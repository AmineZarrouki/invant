'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-white border-emerald-300 text-emerald-950 shadow-emerald-500/10 ring-1 ring-emerald-100'
              : toast.type === 'error'
              ? 'bg-white border-rose-300 text-rose-950 shadow-rose-500/10 ring-1 ring-rose-100'
              : 'bg-white border-blue-300 text-slate-900 shadow-blue-500/10 ring-1 ring-blue-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
