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
import Toast, { ToastMessage } from '@/components/Toast';
import { Equipment, Sale, InventoryStats, DeletionLog } from '@/types/inventory';
import { CurrencyCode, formatCurrency } from '@/lib/currency';

const CACHE_KEYS = {
  INVENTORY: 'kickboxing_inventory_cache',
  SALES: 'kickboxing_sales_cache',
  DELETIONS: 'kickboxing_deletions_cache',
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
    const hasLocalEdits = typeof window !== 'undefined' && localStorage.getItem('kickboxing_has_user_edits') === 'true';

    if (cachedInv && cachedInv.length > 0) {
      setEquipment(cachedInv);
    }
    if (cachedSales) setSales(cachedSales);
    if (cachedDel) setDeletions(cachedDel);

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

        // Optimized single-flight: sync sales and deletions from same payload
        if (Array.isArray(invData.sales)) {
          setSales(invData.sales);
          saveLocalCache(CACHE_KEYS.SALES, invData.sales);
        }
        if (Array.isArray(invData.deletions)) {
          setDeletions(invData.deletions);
          saveLocalCache(CACHE_KEYS.DELETIONS, invData.deletions);
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
              />
            )}

            {activeTab === 'pos' && (
              <PosView
                equipment={equipment}
                currency={currency}
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

    </div>
  );
}
