'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  Lock,
  Unlock,
  X,
  Archive,
  Info,
  Layers,
  Tag,
} from 'lucide-react';
import { Equipment } from '@/types/inventory';
import { formatCurrency, CurrencyCode } from '@/lib/currency';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  currency: CurrencyCode;
  onConfirmDelete: (id: string, name: string, reason: string) => Promise<void>;
}

const COMMON_REASONS = [
  'Suppression manuelle',
  'Article en rupture définitive / Fin de série',
  'Article endommagé ou défectueux',
  'Erreur de saisie / Doublon',
  'Autre motif',
];

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  equipment,
  currency,
  onConfirmDelete,
}: DeleteConfirmModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [selectedReason, setSelectedReason] = useState('Suppression manuelle');
  const [customReason, setCustomReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset and run 5-second countdown whenever modal opens
  useEffect(() => {
    if (!isOpen || !equipment) {
      setSecondsLeft(5);
      setIsDeleting(false);
      return;
    }

    setSecondsLeft(5);
    setIsDeleting(false);
    setSelectedReason('Suppression manuelle');
    setCustomReason('');

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) return null;

  const progressPercent = ((5 - secondsLeft) / 5) * 100;
  const isUnlocked = secondsLeft === 0;

  const handleConfirm = async () => {
    if (!isUnlocked || isDeleting) return;

    setIsDeleting(true);
    const finalReason = selectedReason === 'Autre motif' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    try {
      await onConfirmDelete(equipment.id, equipment.name, finalReason);
      onClose();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-red-900/40 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Progress Bar of the 5s Timer */}
        <div className="h-1.5 w-full bg-zinc-800">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isUnlocked ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Confirmation de Suppression</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 font-mono font-bold">
                  SÉCURITÉ 5S
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Vérifiez les informations avant de confirmer la suppression
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Equipment Info Card */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Article ciblé
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                ID: {equipment.id.slice(0, 10)}...
              </span>
            </div>

            <div className="text-sm sm:text-base font-extrabold text-white">
              {equipment.name}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                {equipment.brand || 'Sans marque'}
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                Taille : <b className="text-white">{equipment.size}</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                Couleur : <b className="text-white">{equipment.color}</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-900/50 text-red-300 font-bold">
                Stock actuel : {equipment.stock} pcs
              </span>
            </div>

            {equipment.sellingPrice > 0 && (
              <div className="text-xs text-zinc-400 pt-1">
                Valeur unitaire :{' '}
                <span className="font-bold text-zinc-200">
                  {formatCurrency(equipment.sellingPrice, currency)}
                </span>
              </div>
            )}
          </div>

          {/* Archive Notice */}
          <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-300">
            <Archive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-200">
                Archivage automatique dans l’historique :
              </span>{' '}
              Cet équipement ne sera pas définitivement perdu. Il sera transféré dans le{' '}
              <strong className="text-white">Journal des suppressions</strong> avec l’ensemble de ses
              caractéristiques, et vous pourrez le <strong className="text-emerald-400">restaurer</strong> en un clic.
            </div>
          </div>

          {/* Deletion Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 block">
              Motif de suppression (archivé dans l’historique) :
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {selectedReason === 'Autre motif' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Précisez la raison de suppression..."
                className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            )}
          </div>

          {/* Timer Notice Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <Unlock className="w-4 h-4 text-red-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
              )}
              <span className="font-medium text-zinc-300">
                {isUnlocked
                  ? 'Compte à rebours terminé. Action autorisée.'
                  : `Temporisation de sécurité active (${secondsLeft}s restante${
                      secondsLeft > 1 ? 's' : ''
                    })`}
              </span>
            </div>

            <span
              className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border ${
                isUnlocked
                  ? 'bg-red-950 text-red-400 border-red-800'
                  : 'bg-amber-950/80 text-amber-400 border-amber-800/80 animate-pulse'
              }`}
            >
              {isUnlocked ? '0s' : `${secondsLeft}s`}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 pt-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-colors"
          >
            Annuler immédiatement
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isUnlocked || isDeleting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              isUnlocked && !isDeleting
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer active:scale-95'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Suppression en cours...</span>
              </>
            ) : isUnlocked ? (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Attendez {secondsLeft}s pour confirmer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
