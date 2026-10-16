'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Zap,
  Lock,
  ArrowRight,
  Database,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface CloudConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCloud: boolean;
  currentProvider: string;
  onCloudConfigured: () => void;
}

export default function CloudConnectModal({
  isOpen,
  onClose,
  isCloud,
  currentProvider,
  onCloudConfigured,
}: CloudConnectModalProps) {
  const [upstashUrl, setUpstashUrl] = useState('');
  const [upstashToken, setUpstashToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLockedByEnv, setIsLockedByEnv] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/storage-status')
        .then((r) => r.json())
        .then((d) => {
          if (d && d.isLockedByEnv) {
            setIsLockedByEnv(true);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!upstashUrl.trim() || !upstashToken.trim()) {
      setTestResult({
        success: false,
        message: 'Veuillez saisir à la fois l’URL et le Token REST d’Upstash.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/storage-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          url: upstashUrl.trim(),
          token: upstashToken.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: '🟢 Connexion Upstash Cloud validée avec succès ! Vous pouvez maintenant l’activer.',
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ ${data.error || 'Impossible de joindre la base Upstash.'}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ Erreur de communication : ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndSync = async () => {
    if (!upstashUrl.trim() || !upstashToken.trim()) {
      setTestResult({
        success: false,
        message: 'Veuillez saisir à la fois l’URL et le Token REST.',
      });
      return;
    }

    setSaving(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/storage-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          url: upstashUrl.trim(),
          token: upstashToken.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: '🚀 Base Cloud Upstash activée et inventaire synchronisé !',
        });
        onCloudConfigured();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setTestResult({
          success: false,
          message: `❌ ${data.error || 'Erreur lors de l’enregistrement.'}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ Erreur : ${err.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Voulez-vous déconnecter la base Cloud et repasser en mode stockage local ?')) return;

    try {
      await fetch('/api/storage-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      onCloudConfigured();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-2 border-blue-200 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-slate-900 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Base de Données Cloud (100% Gratuite)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Permet de sauvegarder vos modifications en direct sur l’application hébergée et de synchroniser tous vos appareils.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            isCloud
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-blue-50/70 border-blue-200 text-blue-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                isCloud ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
              }`}
            />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                {isCloud ? '🟢 Mode Cloud Actif' : '⚡ Mode Local & Navigateur'}
              </span>
              <span className="text-xs font-medium opacity-80">
                Fournisseur : {currentProvider}
              </span>
            </div>
          </div>

          {isCloud && !isLockedByEnv && (
            <button
              onClick={handleDisconnect}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200"
            >
              Déconnecter
            </button>
          )}

          {isLockedByEnv && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 shadow-sm">
              <Lock className="w-3.5 h-3.5" />
              <span>Protégé Serveur</span>
            </div>
          )}
        </div>

        {/* Security badge if locked by environment */}
        {isLockedByEnv && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-xs font-medium space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 font-black text-emerald-950 uppercase tracking-wider">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>Sécurité Maximale Activée</span>
            </div>
            <p className="leading-relaxed">
              Votre base Cloud est connectée et protégée par les variables d’environnement du serveur. Les accès sont strictement sécurisés et ne peuvent être altérés depuis le navigateur.
            </p>
          </div>
        )}

        {/* Recommendation box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-blue-700 font-black text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Pourquoi Upstash Redis est la meilleure option gratuite ?</span>
          </div>
          <p className="leading-relaxed font-medium">
            • <strong>100% Gratuit à vie</strong> (10 000 requêtes par jour offertes, aucune carte bancaire requise).<br />
            • <strong>Ultra rapide</strong> : vos ajouts et modifications de matériel sur la page inventaire s’enregistrent en moins de 15 millisecondes.<br />
            • <strong>Zéro maintenance</strong> : aucune table SQL complexe à créer, vos données sont sauvegardées instantanément.
          </p>
        </div>

        {!isLockedByEnv && (
          <>
            {/* Method 1: Automatic on Vercel */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-sm">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Méthode 1 : Automatique en 1 clic sur Vercel (Recommandé)</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-1.5 pl-6 list-decimal font-medium leading-relaxed">
                <li>Sur votre tableau de bord <strong>Vercel</strong>, ouvrez votre projet <code>invant</code>.</li>
                <li>Cliquez sur l’onglet <strong>Storage</strong> puis <strong>Create Database</strong> $\rightarrow$ choisissez <strong>KV (Upstash)</strong>.</li>
                <li>Cliquez sur <strong>Connect</strong>. Vercel relie automatiquement la base cloud gratuite sans copier aucun code !</li>
              </ol>
            </div>

            {/* Method 2: Direct Credentials Form */}
            <div className="border-2 border-blue-200 rounded-2xl p-4 sm:p-5 space-y-4 bg-gradient-to-b from-blue-50/40 to-white shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-blue-900">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Méthode 2 : Connexion directe avec vos identifiants Upstash</span>
                </div>
                <a
                  href="https://console.upstash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                >
                  <span>Créer une base gratuite sur upstash.com</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                UPSTASH_REDIS_REST_URL :
              </label>
              <input
                type="text"
                value={upstashUrl}
                onChange={(e) => setUpstashUrl(e.target.value)}
                placeholder="ex: https://usable-cougar-12345.upstash.io"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                UPSTASH_REDIS_REST_TOKEN :
              </label>
              <input
                type="password"
                value={upstashToken}
                onChange={(e) => setUpstashToken(e.target.value)}
                placeholder="ex: AX-cASQgZTRhYTM0..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 shadow-inner"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Test en cours...' : '1. Tester la connexion'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndSync}
                disabled={saving || testing}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-colors cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{saving ? 'Activation & Synchronisation...' : '2. Activer & Synchroniser l’Inventaire'}</span>
              </button>
            </div>
          </div>
        </div>
      </>
    )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
