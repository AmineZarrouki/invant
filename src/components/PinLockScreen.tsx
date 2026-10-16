'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Flame,
  Delete,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: () => void;
  lockReason?: 'inactivity' | 'manual' | 'initial';
}

const PIN_LENGTH = 6;

export default function PinLockScreen({ onUnlock, lockReason = 'initial' }: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleVerifyPin = useCallback(
    async (codeToVerify: string) => {
      if (codeToVerify.length !== PIN_LENGTH) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: codeToVerify }),
        });

        const data = await res.json();
        if (data.success) {
          // Store session token and timestamp
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('kickbox_auth_token', data.token);
            sessionStorage.setItem('kickbox_last_active', String(Date.now()));
          }
          onUnlock();
        } else {
          setError(data.error || 'Code PIN incorrect.');
          triggerShake();
          setPin('');
        }
      } catch (err: any) {
        setError('Erreur de connexion avec le serveur.');
        triggerShake();
        setPin('');
      } finally {
        setLoading(false);
      }
    },
    [onUnlock]
  );

  const handleKeyPress = (num: string) => {
    if (loading || pin.length >= PIN_LENGTH) return;
    setError(null);
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length === PIN_LENGTH) {
      handleVerifyPin(newPin);
    }
  };

  const handleDelete = () => {
    if (loading || pin.length === 0) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (loading) return;
    setError(null);
    setPin('');
  };

  // Physical keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pin, loading, handleVerifyPin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-white border-2 border-slate-200 rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl text-slate-900 flex flex-col items-center space-y-6 transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10 mb-1">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
            <span>KickBox<strong className="text-blue-600">Stock</strong></span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              PRO
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-xs">
            Saisissez votre code PIN à 6 chiffres pour déverrouiller l'accès au club.
          </p>
        </div>

        {/* Lock Reason Warning Banner */}
        {lockReason === 'inactivity' && (
          <div className="w-full p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Session verrouillée après 10 minutes d'inactivité.</span>
          </div>
        )}

        {/* 6 Visual PIN Dots */}
        <div className="flex items-center justify-center gap-3.5 py-1">
          {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-blue-600 scale-125 shadow-md shadow-blue-500/40'
                    : 'bg-slate-200 border-2 border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center w-full animate-fadeIn">
            {error}
          </div>
        )}

        {/* Loading status */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-blue-600 font-bold">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Vérification du code...</span>
          </div>
        )}

        {/* Numeric Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[260px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={loading}
              onClick={() => handleKeyPress(String(num))}
              className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-600 active:text-white border border-slate-200 text-xl font-black text-slate-800 transition-all flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* Reset / Clear */}
          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={handleClear}
            className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-black text-slate-500 transition-all flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-30"
          >
            ANNULER
          </button>

          {/* Zero */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleKeyPress('0')}
            className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-600 active:text-white border border-slate-200 text-xl font-black text-slate-800 transition-all flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-50"
          >
            0
          </button>

          {/* Delete backspace */}
          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={handleDelete}
            className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:border-rose-300 border border-slate-200 text-slate-600 hover:text-rose-600 transition-all flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-30"
            title="Effacer le dernier chiffre"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Helpful Hint */}
        <div className="pt-1 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            💡 Code initial : <strong className="text-slate-600 font-bold">777777</strong>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Clavier physique (pavé numérique) également supporté.
          </p>
        </div>
      </div>
    </div>
  );
}
