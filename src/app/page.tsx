'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import DashboardView from '@/components/DashboardView';
import InventoryView from '@/components/InventoryView';
import PosView from '@/components/PosView';
import SalesHistoryView from '@/components/SalesHistoryView';
import SettingsView from '@/components/SettingsView';
import EquipmentModal from '@/components/EquipmentModal';
import QuickSaleModal from '@/components/QuickSaleModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import EasyHelpModal from '@/components/EasyHelpModal';
import PinLockScreen from '@/components/PinLockScreen';
import PackModal from '@/components/PackModal';
import PackSaleModal from '@/components/PackSaleModal';
import CartDrawer from '@/components/CartDrawer';
import Toast, { ToastMessage } from '@/components/Toast';
import { Equipment, Sale, InventoryStats, DeletionLog, EquipmentPack, CartItem } from '@/types/inventory';
import { CurrencyCode, formatCurrency } from '@/lib/currency';

const CACHE_KEYS = {
  INVENTORY: 'kickboxing_inventory_cache',
  SALES: 'kickboxing_sales_cache',
  DELETIONS: 'kickboxing_deletions_cache',
  PACKS: 'kickboxing_packs_cache',
  CART: 'kickboxing_cart_cache',
};

function saveLocalCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function loadLocalCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function markUserEdits(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kickboxing_has_user_edits', 'true');
    localStorage.setItem('kickboxing_last_edit_time', String(Date.now()));
  } catch {}
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'pos' | 'sales' | 'settings'>('dashboard');
  const [currency, setCurrency] = useState<CurrencyCode>('MAD');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [deletions, setDeletions] = useState<DeletionLog[]>([]);
  const [packs, setPacks] = useState<EquipmentPack[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Cloud & Storage Engine State
  const [storageStatus, setStorageStatus] = useState<{ provider: string; isCloud: boolean }>({
    provider: 'Détection...',
    isCloud: false,
  });

  // Subtab for sales/deletions history
  const [historySubTab, setHistorySubTab] = useState<'sales' | 'deletions'>('sales');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [saleItem, setSaleItem] = useState<Equipment | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Equipment | null>(null);

  // Pack Modals state
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<EquipmentPack | null>(null);
  const [preSelectedPackItems, setPreSelectedPackItems] = useState<Equipment[]>([]);
  const [sellingPack, setSellingPack] = useState<EquipmentPack | null>(null);

  // Panier / Multi-Item Cart state (User Request: group items to sell in 1 step with custom element prices)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCartHydrated, setIsCartHydrated] = useState<boolean>(false);

  // 1. Hydrate cart from localStorage immediately on mount
  useEffect(() => {
    try {
      const cachedCart = loadLocalCache<CartItem[]>(CACHE_KEYS.CART);
      if (cachedCart && Array.isArray(cachedCart) && cachedCart.length > 0) {
        setCart(cachedCart);
      }
    } catch (err) {
      console.error('Failed to load cart cache:', err);
    } finally {
      setIsCartHydrated(true);
    }
  }, []);

  // 2. Persist cart to localStorage whenever it changes (guarded so initial [] never wipes cache)
  useEffect(() => {
    if (!isCartHydrated) return;
    saveLocalCache(CACHE_KEYS.CART, cart);
  }, [cart, isCartHydrated]);

  // 3. Multi-tab synchronization (storage event)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CACHE_KEYS.CART) {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(updated)) {
            setCart(updated);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 4. Validate cart stock against refreshed inventory to prevent out-of-stock discrepancies
  useEffect(() => {
    if (!isCartHydrated || equipment.length === 0 || cart.length === 0) return;
    setCart((prev) => {
      let modified = false;
      const updated = prev.map((cItem) => {
        const liveEquip = equipment.find((e) => e.id === cItem.equipment.id);
        if (!liveEquip) return cItem;

        let liveMaxStock = liveEquip.stock ?? 0;
        if (cItem.size || cItem.color) {
          const sz = liveEquip.sizes?.find((s) => s.size === (cItem.size || 'Unique'));
          if (sz) {
            const clr = sz.colors.find((c) => c.color === (cItem.color || 'Standard'));
            if (clr) liveMaxStock = clr.quantity;
          }
        }

        const validQuantity = Math.max(1, Math.min(cItem.quantity, liveMaxStock > 0 ? liveMaxStock : 1));
        if (validQuantity !== cItem.quantity || liveMaxStock !== cItem.maxStock) {
          modified = true;
          return {
            ...cItem,
            quantity: validQuantity,
            maxStock: liveMaxStock,
            equipment: liveEquip,
          };
        }
        return cItem;
      });
      return modified ? updated : prev;
    });
  }, [equipment, isCartHydrated, cart.length]);

  // Security PIN Lock & 10-minute Inactivity Tracking
  const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lockReason, setLockReason] = useState<'initial' | 'inactivity' | 'manual'>('initial');
  const [authChecked, setAuthChecked] = useState(false);

  // Check initial session from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('kickbox_auth_token');
      const lastActive = Number(sessionStorage.getItem('kickbox_last_active') || 0);
      const now = Date.now();

      if (token && lastActive && now - lastActive < INACTIVITY_TIMEOUT_MS) {
        setIsUnlocked(true);
        sessionStorage.setItem('kickbox_last_active', String(now));
      } else {
        setIsUnlocked(false);
        if (token && lastActive && now - lastActive >= INACTIVITY_TIMEOUT_MS) {
          setLockReason('inactivity');
        }
      }
    }
    setAuthChecked(true);
  }, [INACTIVITY_TIMEOUT_MS]);

  // Continuous Inactivity Tracking (resets on user interactions, locks after 10 min)
  useEffect(() => {
    if (!isUnlocked) return;

    const updateActivity = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('kickbox_last_active', String(Date.now()));
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const lastActive = Number(sessionStorage.getItem('kickbox_last_active') || Date.now());
        if (Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          sessionStorage.removeItem('kickbox_auth_token');
          setLockReason('inactivity');
          setIsUnlocked(false);
        }
      }
    }, 4000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
      clearInterval(interval);
    };
  }, [isUnlocked, INACTIVITY_TIMEOUT_MS]);

  const handleManualLock = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('kickbox_auth_token');
    }
    setLockReason('manual');
    setIsUnlocked(false);
  };

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch initial data (loads cached data immediately, then syncs with API)
  const fetchData = useCallback(async () => {
    // 1. Immediately hydrate from cache so user sees their data with 0 latency
    const cachedInv = loadLocalCache<Equipment[]>(CACHE_KEYS.INVENTORY);
    const cachedSales = loadLocalCache<Sale[]>(CACHE_KEYS.SALES);
    const cachedDel = loadLocalCache<DeletionLog[]>(CACHE_KEYS.DELETIONS);
    const cachedPacks = loadLocalCache<EquipmentPack[]>(CACHE_KEYS.PACKS);
    const cachedCart = loadLocalCache<CartItem[]>(CACHE_KEYS.CART);
    const hasLocalEdits = typeof window !== 'undefined' && localStorage.getItem('kickboxing_has_user_edits') === 'true';

    if (cachedInv && cachedInv.length > 0) {
      setEquipment(cachedInv);
    }
    if (cachedSales) setSales(cachedSales);
    if (cachedDel) setDeletions(cachedDel);
    if (cachedPacks) setPacks(cachedPacks);
    if (cachedCart && Array.isArray(cachedCart)) setCart(cachedCart);

    try {
      const invRes = await fetch('/api/inventory');
      const invData = await invRes.json();

      if (invData.success) {
        const isCloudActive = Boolean(invData.isCloud);
        setStorageStatus({
          provider: invData.provider || (isCloudActive ? 'Upstash Redis Cloud' : 'Local / Serverless'),
          isCloud: isCloudActive,
        });

        if (isCloudActive) {
          // Cloud database is connected: server is single source of truth
          setEquipment(invData.equipment);
          setStats(invData.stats);
          saveLocalCache(CACHE_KEYS.INVENTORY, invData.equipment);
        } else {
          // Serverless fallback: if user has local edits, NEVER let stale server seed wipe them!
          if (hasLocalEdits && cachedInv && cachedInv.length > 0) {
            setEquipment(cachedInv);
            fetch('/api/backup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ equipment: cachedInv, sales: cachedSales || [] }),
            }).catch(() => {});
          } else {
            setEquipment(invData.equipment);
            setStats(invData.stats);
            saveLocalCache(CACHE_KEYS.INVENTORY, invData.equipment);
          }
        }

        // Optimized single-flight: sync sales, deletions and packs from same payload
        if (Array.isArray(invData.sales)) {
          setSales(invData.sales);
          saveLocalCache(CACHE_KEYS.SALES, invData.sales);
        }
        if (Array.isArray(invData.deletions)) {
          setDeletions(invData.deletions);
          saveLocalCache(CACHE_KEYS.DELETIONS, invData.deletions);
        }
        if (Array.isArray(invData.packs)) {
          setPacks(invData.packs);
          saveLocalCache(CACHE_KEYS.PACKS, invData.packs);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (!cachedInv || cachedInv.length === 0) {
        addToast('error', 'Erreur de connexion. Mode local actif.');
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load / Save preferred currency
  useEffect(() => {
    const savedCurrency = localStorage.getItem('kickboxing_currency') as CurrencyCode;
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const handleSetCurrency = (c: CurrencyCode) => {
    setCurrency(c);
    localStorage.setItem('kickboxing_currency', c);
  };

  // CRUD Handlers
  const handleSaveEquipment = async (itemData: Partial<Equipment>) => {
    try {
      if (editingItem) {
        // Edit PUT
        const res = await fetch(`/api/inventory/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const updated = equipment.map((i) => (i.id === editingItem.id ? data.item : i));
        setEquipment(updated);
        saveLocalCache(CACHE_KEYS.INVENTORY, updated);
        markUserEdits();
        setStats(data.stats);
        addToast('success', `✏️ "${data.item.name}" mis à jour avec succès`);
      } else {
        // Add POST
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const updated = [data.item, ...equipment];
        setEquipment(updated);
        saveLocalCache(CACHE_KEYS.INVENTORY, updated);
        markUserEdits();
        setStats(data.stats);
        addToast('success', `✅ Nouvel équipement "${data.item.name}" ajouté avec succès`);
      }
      setEditingItem(null);
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de l’enregistrement');
      throw err;
    }
  };

  const handleConfirmDelete = async (id: string, name: string, reason: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const updated = equipment.filter((i) => i.id !== id);
      setEquipment(updated);
      saveLocalCache(CACHE_KEYS.INVENTORY, updated);
      markUserEdits();
      if (data.deletedLog) {
        const updatedDel = [data.deletedLog, ...deletions];
        setDeletions(updatedDel);
        saveLocalCache(CACHE_KEYS.DELETIONS, updatedDel);
      }
      setStats(data.stats);
      addToast('info', `🗑️ "${name}" supprimé et archivé dans le journal des suppressions`);
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la suppression');
      throw err;
    }
  };

  const handleRestoreDeletedItem = async (deletionId: string) => {
    try {
      const res = await fetch(`/api/deletions/${deletionId}/restore`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const updated = [data.item, ...equipment];
      setEquipment(updated);
      saveLocalCache(CACHE_KEYS.INVENTORY, updated);
      markUserEdits();
      const updatedDel = deletions.filter((d) => d.id !== deletionId);
      setDeletions(updatedDel);
      saveLocalCache(CACHE_KEYS.DELETIONS, updatedDel);
      setStats(data.stats);
      addToast('success', `🔄 "${data.item.name}" restauré avec succès dans l'inventaire actif !`);
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la restauration');
      throw err;
    }
  };

  const handleDuplicateEquipment = async (item: Equipment) => {
    try {
      const duplicatePayload = {
        name: `${item.name} (Copie)`,
        category: item.category,
        brand: item.brand,
        model: item.model,
        sizes: JSON.parse(JSON.stringify(item.sizes || [])),
        minStockAlert: item.minStockAlert,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        description: item.description,
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatePayload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const updated = [data.item, ...equipment];
      setEquipment(updated);
      saveLocalCache(CACHE_KEYS.INVENTORY, updated);
      markUserEdits();
      setStats(data.stats);
      addToast('success', `Copie créée: "${data.item.name}"`);
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la duplication');
    }
  };

  const handleAdjustStock = async (
    id: string,
    delta: number,
    variant?: { size?: string; color?: string }
  ) => {
    try {
      const res = await fetch(`/api/inventory/${id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, size: variant?.size, color: variant?.color }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const updated = equipment.map((i) => (i.id === id ? data.item : i));
      setEquipment(updated);
      saveLocalCache(CACHE_KEYS.INVENTORY, updated);
      markUserEdits();
      setStats(data.stats);
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      const detail = variant?.color ? ` (${[variant.size, variant.color].filter(Boolean).join(' - ')})` : '';
      addToast('info', `Stock ajusté (${sign} pcs)${detail} pour ${data.item.name}`);
    } catch (err: any) {
      addToast('error', err.message || 'Erreur d’ajustement de stock');
    }
  };

  const handleRecordSale = async (saleData: {
    equipmentId: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    buyerName: string;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
    notes?: string;
  }) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const updatedSales = [data.sale, ...sales];
      setSales(updatedSales);
      saveLocalCache(CACHE_KEYS.SALES, updatedSales);
      const updatedEq = equipment.map((i) =>
        i.id === data.updatedEquipment.id ? data.updatedEquipment : i
      );
      setEquipment(updatedEq);
      saveLocalCache(CACHE_KEYS.INVENTORY, updatedEq);
      markUserEdits();
      setStats(data.stats);
      addToast('success', `Vente enregistrée : ${data.sale.quantity}x ${data.sale.equipmentName}`);
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la vente');
      throw err;
    }
  };

  const handleRefundSale = async (saleId: string) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Re-fetch all fresh data to sync stock restored
      await fetchData();
      addToast('info', `Vente annulée. Le stock a été réintégré.`);
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors du remboursement');
      throw err;
    }
  };

  const handleResetDatabase = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setEquipment(data.equipment);
      setSales(data.sales);
      setDeletions(data.deletions || []);
      setStats(data.stats);
      saveLocalCache(CACHE_KEYS.INVENTORY, data.equipment);
      saveLocalCache(CACHE_KEYS.SALES, data.sales);
      saveLocalCache(CACHE_KEYS.DELETIONS, data.deletions || []);
      addToast('success', 'Base de données réinitialisée au stock officiel kickboxing !');
    } catch (err: any) {
      addToast('error', err.message || 'Erreur de réinitialisation');
      throw err;
    }
  };

  const handleImportDatabase = async (importedData: { equipment: Equipment[]; sales: Sale[] }) => {
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importedData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setEquipment(data.equipment);
      setSales(data.sales);
      setStats(data.stats);
      saveLocalCache(CACHE_KEYS.INVENTORY, data.equipment);
      saveLocalCache(CACHE_KEYS.SALES, data.sales);
      addToast('success', 'Import JSON complété avec succès !');
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de l’importation');
      throw err;
    }
  };

  // Pack Handlers
  const handleSavePack = async (packData: Partial<EquipmentPack>) => {
    try {
      if (editingPack) {
        // Edit PUT
        const res = await fetch(`/api/packs/${editingPack.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const updated = packs.map((p) => (p.id === editingPack.id ? data.pack : p));
        setPacks(updated);
        saveLocalCache(CACHE_KEYS.PACKS, updated);
        markUserEdits();
        addToast('success', `✏️ Pack "${data.pack.name}" mis à jour avec succès`);
      } else {
        // Add POST
        const res = await fetch('/api/packs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const updated = [data.pack, ...packs];
        setPacks(updated);
        saveLocalCache(CACHE_KEYS.PACKS, updated);
        markUserEdits();
        addToast('success', `📦 Pack "${data.pack.name}" créé avec succès`);
      }
      setEditingPack(null);
      setPreSelectedPackItems([]);
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la sauvegarde du pack');
      throw err;
    }
  };

  const handleDeletePack = async (pack: EquipmentPack) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le pack "${pack.name}" ?\n(Les équipements qui le composent restent intacts dans votre inventaire)`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/packs/${pack.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const updated = packs.filter((p) => p.id !== pack.id);
      setPacks(updated);
      saveLocalCache(CACHE_KEYS.PACKS, updated);
      markUserEdits();
      addToast('info', `🗑️ Pack "${pack.name}" supprimé`);
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la suppression du pack');
    }
  };

  const handleSellPack = async (saleData: {
    packId: string;
    buyerName?: string;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
    notes?: string;
    variantSelections?: Record<string, { size?: string; color?: string }>;
  }) => {
    try {
      const res = await fetch(`/api/packs/${saleData.packId}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (Array.isArray(data.updatedEquipment)) {
        setEquipment(data.updatedEquipment);
        saveLocalCache(CACHE_KEYS.INVENTORY, data.updatedEquipment);
      }
      if (Array.isArray(data.sales)) {
        setSales(data.sales);
        saveLocalCache(CACHE_KEYS.SALES, data.sales);
      }
      if (data.stats) {
        setStats(data.stats);
      }
      markUserEdits();
      addToast(
        'success',
        `🎉 Vente de pack enregistrée : "${data.packName}" (${formatCurrency(data.totalPackPrice, currency)})`
      );
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la vente du pack');
      throw err;
    }
  };

  // =========================================================================
  // PANIER / MULTI-ITEM CART HANDLERS (Add multiple items & sell in 1 step)
  // =========================================================================
  const handleAddToCart = useCallback(
    (
      item: Equipment,
      variant?: {
        size?: string;
        color?: string;
        quantity?: number;
        unitPrice?: number;
        maxStock?: number;
      }
    ) => {
      const size = variant?.size;
      const color = variant?.color;
      const quantityToAdd = variant?.quantity || 1;
      const unitPrice = variant?.unitPrice !== undefined ? variant.unitPrice : item.sellingPrice;
      const maxStock =
        variant?.maxStock !== undefined
          ? variant.maxStock
          : item.stock !== undefined
          ? item.stock
          : 999;

      const lineId = `${item.id}-${size || 'unique'}-${color || 'standard'}`;

      setCart((prev) => {
        const existing = prev.find((c) => c.cartLineId === lineId);
        let updated: CartItem[];

        if (existing) {
          const newQty = Math.min(maxStock, existing.quantity + quantityToAdd);
          updated = prev.map((c) =>
            c.cartLineId === lineId
              ? {
                  ...c,
                  quantity: newQty,
                  unitPrice: variant?.unitPrice !== undefined ? variant.unitPrice : c.unitPrice,
                }
              : c
          );
        } else {
          updated = [
            ...prev,
            {
              cartLineId: lineId,
              equipment: item,
              size,
              color,
              quantity: Math.min(maxStock, quantityToAdd),
              unitPrice,
              originalPrice: item.sellingPrice || unitPrice,
              costPrice: item.costPrice || 0,
              maxStock,
            },
          ];
        }

        saveLocalCache(CACHE_KEYS.CART, updated);
        return updated;
      });

      addToast(
        'success',
        `🛒 "${item.name}" ajouté au panier (${formatCurrency(unitPrice * quantityToAdd, currency)})`
      );
    },
    [currency, addToast]
  );

  const handleAddBatchToCart = useCallback(
    (itemsToAdd: Equipment[]) => {
      if (itemsToAdd.length === 0) return;

      setCart((prev) => {
        let current = [...prev];

        for (const item of itemsToAdd) {
          const sizes = item.sizes || [];
          const firstSize = sizes[0]?.size;
          const firstColor = sizes[0]?.colors?.[0]?.color;
          const maxStock = sizes[0]?.colors?.[0]?.quantity || item.stock || 1;
          const lineId = `${item.id}-${firstSize || 'unique'}-${firstColor || 'standard'}`;

          const existingIndex = current.findIndex((c) => c.cartLineId === lineId);
          if (existingIndex !== -1) {
            current[existingIndex] = {
              ...current[existingIndex],
              quantity: Math.min(maxStock, current[existingIndex].quantity + 1),
            };
          } else {
            current.push({
              cartLineId: lineId,
              equipment: item,
              size: firstSize,
              color: firstColor,
              quantity: 1,
              unitPrice: item.sellingPrice,
              originalPrice: item.sellingPrice,
              costPrice: item.costPrice || 0,
              maxStock,
            });
          }
        }

        saveLocalCache(CACHE_KEYS.CART, current);
        return current;
      });

      addToast('success', `🛒 ${itemsToAdd.length} article(s) ajouté(s) au panier`);
    },
    [addToast]
  );

  const handleUpdateCartItemQuantity = useCallback((cartLineId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => {
          if (item.cartLineId === cartLineId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.maxStock) return item;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      saveLocalCache(CACHE_KEYS.CART, updated);
      return updated;
    });
  }, []);

  const handleUpdateCartItemPrice = useCallback((cartLineId: string, newPrice: number) => {
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.cartLineId === cartLineId ? { ...item, unitPrice: Math.max(0, newPrice) } : item
      );
      saveLocalCache(CACHE_KEYS.CART, updated);
      return updated;
    });
  }, []);

  const handleRemoveFromCart = useCallback((cartLineId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.cartLineId !== cartLineId);
      saveLocalCache(CACHE_KEYS.CART, updated);
      return updated;
    });
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
    saveLocalCache(CACHE_KEYS.CART, []);
  }, []);

  const handleCheckoutCart = useCallback(
    async (checkoutData: {
      buyerName: string;
      paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
      notes?: string;
    }) => {
      if (cart.length === 0) return;

      try {
        const payload = {
          items: cart.map((line) => ({
            equipmentId: line.equipment.id,
            size: line.size,
            color: line.color,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
          buyerName: checkoutData.buyerName,
          paymentMethod: checkoutData.paymentMethod,
          notes: checkoutData.notes,
        };

        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        // Update equipment & sales from response
        if (Array.isArray(data.updatedEquipment)) {
          setEquipment(data.updatedEquipment);
          saveLocalCache(CACHE_KEYS.INVENTORY, data.updatedEquipment);
        }
        if (Array.isArray(data.sales)) {
          const combinedSales = [...data.sales, ...sales];
          setSales(combinedSales);
          saveLocalCache(CACHE_KEYS.SALES, combinedSales);
        }
        if (data.stats) {
          setStats(data.stats);
        }

        markUserEdits();
        handleClearCart();

        const totalSold = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        addToast(
          'success',
          `🎉 Vente groupée enregistrée avec succès en 1 étape ! (${cart.length} articles pour ${formatCurrency(
            totalSold,
            currency
          )})`
        );
      } catch (err: any) {
        addToast('error', err.message || 'Erreur lors du règlement groupé');
        throw err;
      }
    },
    [cart, sales, currency, addToast, handleClearCart]
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        currency={currency}
        setCurrency={handleSetCurrency}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onLockSession={handleManualLock}
        cartItemCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-700">Chargement de votre stock kickboxing...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                currency={currency}
                onQuickRestock={(id, amt) => handleAdjustStock(id, amt)}
                onNavigateToInventory={() => setActiveTab('inventory')}
                onNavigateToPos={() => setActiveTab('pos')}
                onNavigateToSales={() => setActiveTab('sales')}
                onNavigateToSettings={() => setActiveTab('settings')}
                onOpenAddModal={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
                onOpenHelpModal={() => setIsHelpModalOpen(true)}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                equipment={equipment}
                packs={packs}
                cart={cart}
                currency={currency}
                onOpenAddModal={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
                onOpenEditModal={(item) => {
                  setEditingItem(item);
                  setIsAddModalOpen(true);
                }}
                onOpenSaleModal={(item) => setSaleItem(item)}
                onDuplicateItem={handleDuplicateEquipment}
                onDeleteItem={(item) => setItemToDelete(item)}
                onAdjustStock={handleAdjustStock}
                onOpenDeletionsHistory={() => {
                  setActiveTab('sales');
                  setHistorySubTab('deletions');
                }}
                deletionsCount={deletions.length}
                onOpenCreatePackModal={(preselected) => {
                  setEditingPack(null);
                  setPreSelectedPackItems(preselected || []);
                  setIsPackModalOpen(true);
                }}
                onOpenEditPackModal={(pack) => {
                  setEditingPack(pack);
                  setPreSelectedPackItems([]);
                  setIsPackModalOpen(true);
                }}
                onOpenSellPackModal={(pack) => {
                  setSellingPack(pack);
                }}
                onDeletePack={handleDeletePack}
                onAddToCart={handleAddToCart}
                onAddBatchToCart={handleAddBatchToCart}
                onOpenCart={() => setIsCartOpen(true)}
              />
            )}

            {activeTab === 'pos' && (
              <PosView
                equipment={equipment}
                currency={currency}
                cart={cart}
                onAddToCart={handleAddToCart}
                onUpdateCartItemQuantity={handleUpdateCartItemQuantity}
                onUpdateCartItemPrice={handleUpdateCartItemPrice}
                onRemoveCartItem={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onCheckoutCart={handleCheckoutCart}
                onRecordSale={handleRecordSale}
              />
            )}

            {activeTab === 'sales' && (
              <SalesHistoryView
                sales={sales}
                deletions={deletions}
                currency={currency}
                onRefundSale={handleRefundSale}
                onRestoreDeletedItem={handleRestoreDeletedItem}
                activeSubTab={historySubTab}
                onChangeSubTab={setHistorySubTab}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                equipment={equipment}
                sales={sales}
                currency={currency}
                setCurrency={handleSetCurrency}
                onResetDatabase={handleResetDatabase}
                onImportDatabase={handleImportDatabase}
              />
            )}
          </>
        )}
      </main>

      {/* Add / Edit Equipment Modal */}
      <EquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEquipment}
        initialData={editingItem}
        currency={currency}
      />

      {/* Quick Sale Modal */}
      <QuickSaleModal
        isOpen={!!saleItem}
        onClose={() => setSaleItem(null)}
        equipment={saleItem}
        onConfirmSale={handleRecordSale}
        onDirectAdjustStock={handleAdjustStock}
        onAddToCart={handleAddToCart}
        currency={currency}
      />

      {/* 5-Second Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        equipment={itemToDelete}
        currency={currency}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Panier / Multi-Item Cart Drawer (User Request: Group multiple items, edit unit prices, sell in 1 step) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        currency={currency}
        onUpdateItemQuantity={handleUpdateCartItemQuantity}
        onUpdateItemPrice={handleUpdateCartItemPrice}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckout={handleCheckoutCart}
        onNavigateToInventory={() => setActiveTab('inventory')}
      />

      {/* Pack Builder / Editor Modal */}
      <PackModal
        isOpen={isPackModalOpen}
        onClose={() => {
          setIsPackModalOpen(false);
          setEditingPack(null);
          setPreSelectedPackItems([]);
        }}
        onSave={handleSavePack}
        initialData={editingPack}
        preSelectedEquipment={preSelectedPackItems}
        allEquipment={equipment}
        currency={currency}
      />

      {/* Pack Sale Checkout Modal */}
      <PackSaleModal
        isOpen={!!sellingPack}
        onClose={() => setSellingPack(null)}
        pack={sellingPack}
        allEquipment={equipment}
        currency={currency}
        onConfirmSale={handleSellPack}
      />

      {/* Easy Beginner Help Modal */}
      <EasyHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onNavigate={setActiveTab}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* 6-Digit PIN Security Screen (with 10-minute inactivity lockout) */}
      {!isUnlocked && authChecked && (
        <PinLockScreen
          onUnlock={() => {
            setIsUnlocked(true);
            setLockReason('initial');
          }}
          lockReason={lockReason}
        />
      )}

    </div>
  );
}
