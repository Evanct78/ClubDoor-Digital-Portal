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
  // Super-admin can visit any club's admin space
  visitClubAsSuperAdmin: (clubId: string) => void;
  isVisitingAsSuperAdmin: boolean;
  exitVisit: () => void;
};

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({ children }: { children: ReactNode }) {
  const { memberships, user, isSuperAdmin } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMembership, setCurrentMembership] = useState<{ role: string } | null>(null);
  const [isVisitingAsSuperAdmin, setIsVisitingAsSuperAdmin] = useState(false);

  const loadClubs = useCallback(async () => {
    // Super-admin visiting a specific club
    const visitingId = localStorage.getItem('clubdoor_visiting_club');
    if (isSuperAdmin && visitingId) {
      const { data: club } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', visitingId)
        .maybeSingle();
      if (club) {
        setClubs([club as Club]);
        setCurrentClub(club as Club);
        setIsVisitingAsSuperAdmin(true);
        setCurrentMembership({ role: 'admin' });
        setLoading(false);
        return;
      }
    }

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
  }, [memberships, isSuperAdmin]);

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

  const visitClubAsSuperAdmin = (clubId: string) => {
    localStorage.setItem('clubdoor_visiting_club', clubId);
    localStorage.removeItem('clubdoor_selected_club');
    loadClubs();
  };

  const exitVisit = () => {
    localStorage.removeItem('clubdoor_visiting_club');
    setIsVisitingAsSuperAdmin(false);
    setCurrentClub(null);
    setClubs([]);
    setCurrentMembership(null);
    setLoading(true);
    // Reload will happen via the auth state change or page refresh
    window.location.reload();
  };

  const refreshClubs = async () => {
    await loadClubs();
  };

  const isAdmin = currentMembership?.role === 'admin';

  return (
    <ClubContext.Provider value={{ currentClub, clubs, loading, isAdmin, selectClub, refreshClubs, visitClubAsSuperAdmin, isVisitingAsSuperAdmin, exitVisit }}>
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error('useClub must be used within ClubProvider');
  return ctx;
}
