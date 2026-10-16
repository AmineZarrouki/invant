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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'pos' | 'sales' | 'settings'>('dashboard');
  const [currency, setCurrency] = useState<CurrencyCode>('MAD');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [deletions, setDeletions] = useState<DeletionLog[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [invRes, salesRes, delRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/sales'),
        fetch('/api/deletions'),
      ]);

      const invData = await invRes.json();
      const salesData = await salesRes.json();
      const delData = await delRes.json();

      if (invData.success) {
        setEquipment(invData.equipment);
        setStats(invData.stats);
      }
      if (salesData.success) {
        setSales(salesData.sales);
      }
      if (delData.success) {
        setDeletions(delData.deletions);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      addToast('error', 'Erreur de connexion à la base de données');
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

        setEquipment((prev) => prev.map((i) => (i.id === editingItem.id ? data.item : i)));
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

        setEquipment((prev) => [data.item, ...prev]);
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

      setEquipment((prev) => prev.filter((i) => i.id !== id));
      if (data.deletedLog) {
        setDeletions((prev) => [data.deletedLog, ...prev]);
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

      setEquipment((prev) => [data.item, ...prev]);
      setDeletions((prev) => prev.filter((d) => d.id !== deletionId));
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

      setEquipment((prev) => [data.item, ...prev]);
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

      setEquipment((prev) => prev.map((i) => (i.id === id ? data.item : i)));
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

      setSales((prev) => [data.sale, ...prev]);
      setEquipment((prev) =>
        prev.map((i) => (i.id === data.updatedEquipment.id ? data.updatedEquipment : i))
      );
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
      addToast('success', 'Import JSON complété avec succès !');
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de l’importation');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f8fafc] flex flex-col font-sans selection:bg-red-600 selection:text-white">
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
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-zinc-400">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold">Chargement de la base de données kickboxing...</p>
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
