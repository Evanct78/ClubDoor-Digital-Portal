import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Club } from '@/types';

type ClubContextType = {
  currentClub: Club | null;
  clubs: Club[];
  loading: boolean;
  isAdmin: boolean;
  selectClub: (clubId: string) => void;
  refreshClubs: () => Promise<void>;
};

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({ children }: { children: ReactNode }) {
  const { memberships, user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMembership, setCurrentMembership] = useState<{ role: string } | null>(null);

  const loadClubs = useCallback(async () => {
    if (!memberships.length) {
      setClubs([]);
      setCurrentClub(null);
      setLoading(false);
      return;
    }
    const clubIds = memberships.map(m => m.club_id);
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .in('id', clubIds);
    const clubList = (data as Club[]) ?? [];
    setClubs(clubList);

    const stored = localStorage.getItem('clubdoor_selected_club');
    let target = clubList.find(c => c.id === stored);
    if (!target) {
      target = clubList[0];
    }
    setCurrentClub(target ?? null);

    const mem = memberships.find(m => m.club_id === target?.id);
    setCurrentMembership(mem ? { role: mem.role } : null);

    setLoading(false);
  }, [memberships]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const selectClub = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    if (club) {
      setCurrentClub(club);
      localStorage.setItem('clubdoor_selected_club', clubId);
      const mem = memberships.find(m => m.club_id === clubId);
      setCurrentMembership(mem ? { role: mem.role } : null);
    }
  };

  const refreshClubs = async () => {
    await loadClubs();
  };

  const isAdmin = currentMembership?.role === 'admin';

  return (
    <ClubContext.Provider value={{ currentClub, clubs, loading, isAdmin, selectClub, refreshClubs }}>
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error('useClub must be used within ClubProvider');
  return ctx;
}
