import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type SubscriptionPlan = 'full' | 'module';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive';

export type ClubSubscription = {
  id: string;
  club_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  active_modules: string[];
  current_period_end: string | null;
  created_at: string;
};

export const ALL_MODULES = [
  { key: 'events', label: 'Événements' },
  { key: 'polls', label: 'Sondages' },
  { key: 'announcements', label: 'Actualités' },
  { key: 'categories', label: 'Catégories' },
  { key: 'links', label: 'Liens utiles' },
  { key: 'whatsapp', label: 'Groupes WhatsApp' },
  { key: 'contacts', label: 'Contacts' },
] as const;

export function useSubscription(clubId: string | undefined) {
  const [subscription, setSubscription] = useState<ClubSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('club_subscriptions')
        .select('*')
        .eq('club_id', clubId)
        .maybeSingle();
      setSubscription(data as ClubSubscription | null);
      setLoading(false);
    })();
  }, [clubId]);

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isFullPlan = subscription?.plan === 'full' && isActive;
  const isModulePlan = subscription?.plan === 'module' && isActive;

  function hasModuleAccess(moduleKey: string): boolean {
    if (!isActive) return false;
    if (isFullPlan) return true;
    if (isModulePlan) return subscription?.active_modules?.includes(moduleKey) ?? false;
    return false;
  }

  return { subscription, loading, isActive, isFullPlan, isModulePlan, hasModuleAccess };
}
