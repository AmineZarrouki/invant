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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-rose-200 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp text-slate-900 ring-1 ring-rose-100 max-h-[92vh] flex flex-col">
        {/* Progress Bar of the 5s Timer */}
        <div className="h-1.5 w-full bg-slate-100">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isUnlocked ? 'bg-rose-600' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-3 border-b border-rose-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Confirmation de Suppression</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-mono font-bold">
                  SÉCURITÉ 5S
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vérifiez les informations avant de confirmer la suppression
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Equipment Info Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Article ciblé
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-bold">
                ID: {equipment.id.slice(0, 10)}...
              </span>
            </div>

            <div className="text-base font-black text-slate-900">{equipment.name}</div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-bold shadow-sm">
                {equipment.brand || 'Sans marque'}
              </span>
              {equipment.sizes && equipment.sizes.length > 0 ? (
                equipment.sizes.map((sz, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shadow-sm"
                  >
                    {sz.size && sz.size !== 'Unique' ? (
                      <span className="font-bold text-rose-600">{sz.size}: </span>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      {sz.colors.map((c, cIdx) => (
                        <span key={cIdx} className="inline-flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-300"
                            style={{ background: getColorSwatch(c.color) }}
                          />
                          <span>{c.color}</span>
                          <b className="text-slate-900">({c.quantity})</b>
                        </span>
                      ))}
                    </div>
                  </span>
                ))
              ) : null}
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                Stock total : {equipment.stock ?? 0} pcs
              </span>
            </div>

            {equipment.sellingPrice > 0 && (
              <div className="text-xs text-slate-600 pt-1">
                Valeur unitaire :{' '}
                <span className="font-bold text-emerald-700">
                  {formatCurrency(equipment.sellingPrice, currency)}
                </span>
              </div>
            )}
          </div>

          {/* Archive Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <Archive className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950">
                Archivage automatique dans l’historique :
              </span>{' '}
              Cet équipement ne sera pas définitivement perdu. Il sera transféré dans le{' '}
              <strong className="text-amber-950">Journal des suppressions</strong> avec l’ensemble de ses
              variantes, et vous pourrez le{' '}
              <strong className="text-emerald-700 font-bold">restaurer</strong> en un clic.
            </div>
          </div>

          {/* Deletion Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Motif de suppression (archivé dans l’historique) :
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500 cursor-pointer shadow-sm"
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
                className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 font-medium shadow-sm"
              />
            )}
          </div>

          {/* Timer Notice Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <Unlock className="w-4 h-4 text-rose-600" />
              ) : (
                <Lock className="w-4 h-4 text-amber-600 animate-pulse" />
              )}
              <span className="font-semibold text-slate-700">
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
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-amber-100 text-amber-900 border-amber-200 animate-pulse'
              }`}
            >
              {isUnlocked ? '0s' : `${secondsLeft}s`}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 pt-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
          >
            Annuler immédiatement
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isUnlocked || isDeleting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md ${
              isUnlocked && !isDeleting
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95 shadow-rose-500/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
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
