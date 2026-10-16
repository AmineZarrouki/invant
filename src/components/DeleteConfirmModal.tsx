'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  Lock,
  Unlock,
  X,
  Archive,
} from 'lucide-react';
import { Equipment } from '@/types/inventory';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { getColorSwatch } from '@/lib/categoryColors';

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
    const finalReason =
      selectedReason === 'Autre motif' && customReason.trim()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#131c31] border border-red-500/50 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp text-[#f8fafc]">
        {/* Progress Bar of the 5s Timer */}
        <div className="h-1.5 w-full bg-[#0e1628]">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isUnlocked ? 'bg-red-500' : 'bg-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-3 border-b border-[#22314e] bg-[#0e1628]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Confirmation de Suppression</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-200 border border-red-800 font-mono font-bold">
                  SÉCURITÉ 5S
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Vérifiez les informations avant de confirmer la suppression
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e2c47] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Equipment Info Card */}
          <div className="p-4 rounded-xl bg-[#0e1628] border border-[#22314e] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Article ciblé
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#131c31] text-slate-200 border border-[#22314e] font-bold">
                ID: {equipment.id.slice(0, 10)}...
              </span>
            </div>

            <div className="text-base font-black text-white">{equipment.name}</div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-[#131c31] border border-[#22314e] text-slate-200 font-bold">
                {equipment.brand || 'Sans marque'}
              </span>
              {equipment.sizes && equipment.sizes.length > 0 ? (
                equipment.sizes.map((sz, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#131c31] border border-[#22314e] text-slate-200"
                  >
                    {sz.size && sz.size !== 'Unique' ? (
                      <span className="font-bold text-red-400">{sz.size}: </span>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      {sz.colors.map((c, cIdx) => (
                        <span key={cIdx} className="inline-flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full border border-white/20"
                            style={{ background: getColorSwatch(c.color) }}
                          />
                          <span>{c.color}</span>
                          <b className="text-white">({c.quantity})</b>
                        </span>
                      ))}
                    </div>
                  </span>
                ))
              ) : null}
              <span className="px-2 py-0.5 rounded bg-red-950 text-red-200 border border-red-800/80 font-bold">
                Stock total : {equipment.stock ?? 0} pcs
              </span>
            </div>

            {equipment.sellingPrice > 0 && (
              <div className="text-xs text-slate-300 pt-1">
                Valeur unitaire :{' '}
                <span className="font-bold text-emerald-400">
                  {formatCurrency(equipment.sellingPrice, currency)}
                </span>
              </div>
            )}
          </div>

          {/* Archive Notice */}
          <div className="p-3.5 rounded-xl bg-[#0e1628] border border-amber-500/30 flex items-start gap-3 text-xs text-slate-200">
            <Archive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">
                Archivage automatique dans l’historique :
              </span>{' '}
              Cet équipement ne sera pas définitivement perdu. Il sera transféré dans le{' '}
              <strong className="text-white">Journal des suppressions</strong> avec l’ensemble de ses
              variantes, et vous pourrez le{' '}
              <strong className="text-emerald-400">restaurer</strong> en un clic.
            </div>
          </div>

          {/* Deletion Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">
              Motif de suppression (archivé dans l’historique) :
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-[#0e1628] border border-[#22314e] rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-red-500 cursor-pointer"
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
                className="w-full mt-2 bg-[#0e1628] border border-[#22314e] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500 font-medium"
              />
            )}
          </div>

          {/* Timer Notice Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1628] border border-[#22314e] text-xs">
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <Unlock className="w-4 h-4 text-red-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
              )}
              <span className="font-semibold text-slate-200">
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
                  ? 'bg-red-950 text-red-300 border-red-800'
                  : 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
              }`}
            >
              {isUnlocked ? '0s' : `${secondsLeft}s`}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 pt-3 bg-[#0e1628] border-t border-[#22314e] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#1e2c47] hover:bg-[#283b5e] text-slate-200 hover:text-white text-xs font-bold border border-[#2e4166] transition-colors"
          >
            Annuler immédiatement
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isUnlocked || isDeleting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md ${
              isUnlocked && !isDeleting
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer active:scale-95 shadow-red-600/30'
                : 'bg-[#1a253f] text-slate-500 cursor-not-allowed border border-[#2a3c5f]'
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
