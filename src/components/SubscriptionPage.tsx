import { useState } from 'react';
import { Check, Crown, Layers, Lock, Sparkles, CreditCard, Loader2, ArrowRight, DoorOpen, TrendingUp } from 'lucide-react';
import { useClub } from '@/context/ClubContext';
import { useAuth } from '@/context/AuthContext';
import { useSubscription, ALL_MODULES, type SubscriptionPlan } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';

export function SubscriptionPage({ onContinue }: { onContinue: () => void }) {
  const { currentClub } = useClub();
  const { user } = useAuth();
  const { subscription, loading, isActive, isFullPlan, isModulePlan } = useSubscription(currentClub?.id);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('full');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleModule(key: string) {
    setSelectedModules(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  }

  async function startCheckout() {
    if (!currentClub || !user) return;
    if (selectedPlan === 'module' && selectedModules.length === 0) {
      setError('Sélectionnez au moins un module');
      return;
    }
    setCheckoutLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubId: currentClub.id,
          plan: selectedPlan,
          modules: selectedPlan === 'module' ? selectedModules : [],
          userEmail: user.email,
          clubName: currentClub.name,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur lors du paiement');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-900" />
      </div>
    );
  }

  // Active subscription — show status + continue button
  if (isActive) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8">
          <div className="animate-fade-in-up">
            <h1 className="gradient-text text-2xl font-bold">Abonnement actif</h1>
            <p className="mt-1 text-sm text-gray-500">Votre abonnement {currentClub?.name}</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  {isFullPlan ? 'Abonnement complet' : 'Abonnement par module'}
                </h2>
                <p className="text-sm text-green-700">
                  {isFullPlan ? '29€/mois — Tous les outils' : '14,99€/mois — Modules sélectionnés'}
                </p>
              </div>
            </div>

            {isModulePlan && subscription && (
              <div className="mt-4 border-t border-green-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-800 mb-2">Modules activés</p>
                <div className="flex flex-wrap gap-2">
                  {subscription.active_modules.map(mod => {
                    const modInfo = ALL_MODULES.find(m => m.key === mod);
                    return (
                      <span key={mod} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-green-700 shadow-sm">
                        <Check className="h-3 w-3" /> {modInfo?.label ?? mod}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {subscription?.current_period_end && (
              <p className="mt-4 text-xs text-green-600">
                Prochaine facturation le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>

          <button
            onClick={onContinue}
            className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all hover:shadow-lg"
          >
            Continuer vers l'espace admin
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // No active subscription — show plans
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8">
        {/* Header */}
        <div className="animate-fade-in-up text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-blue-950 shadow-lg shadow-amber-400/20">
            <DoorOpen className="h-8 w-8" />
          </div>
          <h1 className="gradient-text text-3xl font-bold">Choisissez votre abonnement</h1>
          <p className="mt-2 text-sm text-gray-500">Activez les outils pour gérer {currentClub?.name}</p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Full plan */}
          <button
            onClick={() => setSelectedPlan('full')}
            className={`relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all ${
              selectedPlan === 'full'
                ? 'border-blue-900 bg-white shadow-lg scale-[1.02]'
                : 'border-slate-200 bg-white shadow-sm hover:border-blue-300'
            }`}
          >
            {selectedPlan === 'full' && (
              <span className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-900 to-blue-700 px-3 py-1 text-[10px] font-bold text-white shadow-lg">
                <Sparkles className="h-3 w-3" /> RECOMMANDÉ
              </span>
            )}
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                selectedPlan === 'full' ? 'bg-gradient-to-br from-blue-900 to-blue-700 text-white' : 'bg-blue-50 text-blue-900'
              } shadow-md`}>
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Abonnement complet</h3>
                <p className="text-xs text-gray-400">Tous les outils</p>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">29€</span>
              <span className="text-sm text-gray-400">/mois</span>
            </div>
            <ul className="space-y-2 flex-1">
              {ALL_MODULES.map(mod => (
                <li key={mod.key} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  {mod.label}
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                Gestion des membres
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                Tableau de bord complet
              </li>
            </ul>
          </button>

          {/* Module plan */}
          <button
            onClick={() => setSelectedPlan('module')}
            className={`relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all ${
              selectedPlan === 'module'
                ? 'border-blue-900 bg-white shadow-lg scale-[1.02]'
                : 'border-slate-200 bg-white shadow-sm hover:border-blue-300'
            }`}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                selectedPlan === 'module' ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' : 'bg-amber-50 text-amber-600'
              } shadow-md`}>
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Abonnement par module</h3>
                <p className="text-xs text-gray-400">Choisissez vos outils</p>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">14,99€</span>
              <span className="text-sm text-gray-400">/mois par module</span>
            </div>
            <p className="mb-3 text-xs text-gray-400">Sélectionnez les modules que vous souhaitez gérer :</p>
            <div className="space-y-2 flex-1">
              {ALL_MODULES.map(mod => {
                const checked = selectedModules.includes(mod.key);
                return (
                  <button
                    key={mod.key}
                    onClick={(e) => { e.stopPropagation(); toggleModule(mod.key); }}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                      selectedPlan !== 'module'
                        ? 'cursor-not-allowed opacity-50'
                        : checked
                        ? 'border-blue-300 bg-blue-50 text-blue-900'
                        : 'border-slate-200 text-gray-600 hover:border-blue-200'
                    }`}
                    disabled={selectedPlan !== 'module'}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded ${checked ? 'bg-blue-900 text-white' : 'border border-gray-300'}`}>
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    {mod.label}
                  </button>
                );
              })}
            </div>
            {selectedPlan === 'module' && selectedModules.length > 0 && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-center">
                <p className="text-xs text-amber-700">Total: <span className="font-bold">{(selectedModules.length * 14.99).toFixed(2).replace('.', ',')}€/mois</span></p>
              </div>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Checkout button */}
        <button
          onClick={startCheckout}
          disabled={checkoutLoading || (selectedPlan === 'module' && selectedModules.length === 0)}
          className="btn-primary flex w-full items-center justify-center gap-2 py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkoutLoading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Redirection vers le paiement...</>
          ) : (
            <><CreditCard className="h-5 w-5" /> Payer et activer mon abonnement</>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="h-3 w-3" />
          Paiement sécurisé par Stripe
        </div>
      </div>
    </div>
  );
}
