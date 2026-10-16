import { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp, DoorOpen, Trophy, ChevronRight, BarChart3, Activity, Calendar, Vote, Megaphone, CreditCard, CheckCircle, XCircle, Globe, Zap, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { BarChart, DonutChart, LineChart, ProgressRing } from '@/components/Charts';
import { ClubDetail } from './ClubDetail';

type ClubInfo = {
  id: string;
  name: string;
  sport: string;
  address: string | null;
  created_at: string;
  member_count: number;
  admin_count: number;
  event_count: number;
  poll_count: number;
  announcement_count: number;
};

type Page = 'clubs' | 'platform';

export function SuperAdmin() {
  const { signOut } = useAuth();
  const [page, setPage] = useState<Page>('clubs');
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [allMembers, setAllMembers] = useState<{ club_id: string; role: string; status: string; joined_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [clubsRes, membersRes, eventsRes, pollsRes, annRes] = await Promise.all([
        supabase.from('clubs').select('*').order('created_at', { ascending: false }),
        supabase.from('club_members').select('club_id, role, status, joined_at'),
        supabase.from('events').select('club_id'),
        supabase.from('polls').select('club_id'),
        supabase.from('announcements').select('club_id'),
      ]);

      const members = (membersRes.data ?? []) as { club_id: string; role: string; status: string; joined_at: string }[];
      setAllMembers(members);

      const clubsInfo: ClubInfo[] = (clubsRes.data ?? []).map((c: { id: string; name: string; sport: string; address: string | null; created_at: string }) => {
        const clubMembers = members.filter(m => m.club_id === c.id && m.status === 'active');
        return {
          id: c.id,
          name: c.name,
          sport: c.sport,
          address: c.address,
          created_at: c.created_at,
          member_count: clubMembers.length,
          admin_count: clubMembers.filter(m => m.role === 'admin').length,
          event_count: (eventsRes.data ?? []).filter((e: { club_id: string }) => e.club_id === c.id).length,
          poll_count: (pollsRes.data ?? []).filter((p: { club_id: string }) => p.club_id === c.id).length,
          announcement_count: (annRes.data ?? []).filter((a: { club_id: string }) => a.club_id === c.id).length,
        };
      });

      setClubs(clubsInfo);
      setLoading(false);
    })();
  }, []);

  if (selectedClubId) {
    return <ClubDetail clubId={selectedClubId} onBack={() => setSelectedClubId(null)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-slate-200 bg-gradient-to-b from-blue-950 to-slate-900 text-white md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-blue-950 shadow-lg shadow-amber-400/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight">ClubDoor</p>
            <span className="text-[11px] font-medium text-amber-300">Super Admin</span>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1.5 px-3">
          <NavBtn active={page === 'clubs'} onClick={() => setPage('clubs')} icon={DoorOpen} label="Clubs" />
          <NavBtn active={page === 'platform'} onClick={() => setPage('platform')} icon={BarChart3} label="Plateforme" />
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={signOut}
            className="btn-ghost flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition-all hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white shadow-lg shadow-blue-950/20 md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-blue-950">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-tight">ClubDoor</p>
            <span className="text-[11px] font-medium text-amber-300">Super Admin</span>
          </div>
        </div>
        <div className="flex gap-1.5 px-3 pb-2">
          <MobileTab active={page === 'clubs'} onClick={() => setPage('clubs')} icon={DoorOpen} label="Clubs" />
          <MobileTab active={page === 'platform'} onClick={() => setPage('platform')} icon={BarChart3} label="Plateforme" />
        </div>
      </header>

      <div className="md:pl-64">
        {page === 'clubs' ? (
          <ClubsPage clubs={clubs} onSelectClub={setSelectedClubId} />
        ) : (
          <PlatformPage clubs={clubs} allMembers={allMembers} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// PAGE 1: CLUBS LIST
// ============================================================
function ClubsPage({ clubs, onSelectClub }: { clubs: ClubInfo[]; onSelectClub: (id: string) => void }) {
  const totalMembers = clubs.reduce((s, c) => s + c.member_count, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8 pb-28 md:pb-6">
      <div className="animate-fade-in-up">
        <h1 className="gradient-text text-2xl font-bold">Clubs</h1>
        <p className="mt-1 text-sm text-gray-500">Cliquez sur un club pour voir ses graphiques et statistiques</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 stagger">
        <div className="card-hover rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{clubs.length}</p>
          <p className="text-xs text-gray-500">Clubs</p>
        </div>
        <div className="card-hover rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-md">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
          <p className="text-xs text-gray-500">Membres total</p>
        </div>
        <div className="card-hover rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md">
            <Trophy className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{new Set(clubs.map(c => c.sport)).size}</p>
          <p className="text-xs text-gray-500">Sports</p>
        </div>
      </div>

      {/* Clubs list */}
      <div className="space-y-3 stagger">
        {clubs.map(club => (
          <button
            key={club.id}
            onClick={() => onSelectClub(club.id)}
            className="card-hover flex w-full items-start gap-3 rounded-2xl bg-white p-5 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-950 to-slate-900 text-white shadow-lg">
              <DoorOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900">{club.name}</h3>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                <Trophy className="h-3 w-3" />
                <span>{club.sport}</span>
                {club.address && <span className="truncate">— {club.address}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  <Users className="h-3 w-3" /> {club.member_count} membre{club.member_count > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  <TrendingUp className="h-3 w-3" /> {club.admin_count} admin{club.admin_count > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                  <Calendar className="h-3 w-3" /> {club.event_count} événement{club.event_count > 1 ? 's' : ''}
                </span>
                {club.poll_count > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                    <Vote className="h-3 w-3" /> {club.poll_count}
                  </span>
                )}
                {club.announcement_count > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                    <Megaphone className="h-3 w-3" /> {club.announcement_count}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PAGE 2: PLATFORM OVERVIEW
// ============================================================
function PlatformPage({ clubs, allMembers }: { clubs: ClubInfo[]; allMembers: { club_id: string; role: string; status: string; joined_at: string }[] }) {
  const totalMembers = clubs.reduce((s, c) => s + c.member_count, 0);
  const totalAdmins = clubs.reduce((s, c) => s + c.admin_count, 0);
  const totalEvents = clubs.reduce((s, c) => s + c.event_count, 0);
  const totalPolls = clubs.reduce((s, c) => s + c.poll_count, 0);
  const totalAnnouncements = clubs.reduce((s, c) => s + c.announcement_count, 0);

  // Members by sport
  const sportMap = new Map<string, number>();
  clubs.forEach(c => sportMap.set(c.sport, (sportMap.get(c.sport) ?? 0) + c.member_count));
  const sportColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#0ea5e9', '#ec4899', '#14b8a6'];
  const sportData = Array.from(sportMap.entries()).map(([label, value], i) => ({ label, value, color: sportColors[i % sportColors.length] }));

  // Registrations over last 6 months
  const now = new Date();
  const monthData: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const count = allMembers.filter(m => {
      const j = new Date(m.joined_at);
      return j.getFullYear() === d.getFullYear() && j.getMonth() === d.getMonth();
    }).length;
    monthData.push({ label, value: count });
  }

  // Content bar chart
  const contentData = [
    { label: 'Événements', value: totalEvents, color: 'linear-gradient(to top, #1e3a8a, #3b82f6)' },
    { label: 'Sondages', value: totalPolls, color: 'linear-gradient(to top, #d97706, #f59e0b)' },
    { label: 'Infos', value: totalAnnouncements, color: 'linear-gradient(to top, #be123c, #f43f5e)' },
  ];

  // Platform health
  const healthChecks = [
    { label: 'Au moins 1 club', ok: clubs.length > 0 },
    { label: 'Au moins 1 membre', ok: totalMembers > 0 },
    { label: 'Au moins 1 admin', ok: totalAdmins > 0 },
    { label: 'Événements créés', ok: totalEvents > 0 },
    { label: 'Sondages créés', ok: totalPolls > 0 },
    { label: 'Infos publiées', ok: totalAnnouncements > 0 },
  ];
  const healthScore = healthChecks.filter(c => c.ok).length;

  // Per-club abonnement status (active vs inactive vs pending)
  const statusData = [
    { label: 'Actifs', value: allMembers.filter(m => m.status === 'active').length, color: '#22c55e' },
    { label: 'En attente', value: allMembers.filter(m => m.status === 'pending').length, color: '#f59e0b' },
    { label: 'Inactifs', value: allMembers.filter(m => m.status === 'inactive').length, color: '#cbd5e1' },
  ];

  // Members per club bar chart
  const membersPerClub = clubs.slice(0, 8).map(c => ({
    label: c.name.length > 12 ? c.name.slice(0, 10) + '…' : c.name,
    value: c.member_count,
    color: 'linear-gradient(to top, #1e3a8a, #3b82f6)',
  }));

  // Club growth (cumulative clubs created over 6 months)
  const clubGrowthData: { label: string; value: number }[] = [];
  let cumulative = 0;
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const created = clubs.filter(c => new Date(c.created_at) <= new Date(d.getFullYear(), d.getMonth() + 1, 0)).length;
    cumulative = created;
    clubGrowthData.push({ label, value: cumulative });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8 pb-28 md:pb-6">
      {/* Title */}
      <div className="animate-fade-in-up">
        <h1 className="gradient-text text-2xl font-bold">Plateforme</h1>
        <p className="mt-1 text-sm text-gray-500">Comment va la plateforme ClubDoor — abonnements et activité</p>
      </div>

      {/* Global stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 stagger">
        <div className="card-hover rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{clubs.length}</p>
          <p className="text-xs text-gray-500">Clubs</p>
        </div>
        <div className="card-hover rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-md">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
          <p className="text-xs text-gray-500">Membres actifs</p>
        </div>
        <div className="card-hover rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{allMembers.length}</p>
          <p className="text-xs text-gray-500">Abonnements total</p>
        </div>
        <div className="card-hover rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-md">
            <Zap className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalEvents + totalPolls + totalAnnouncements}</p>
          <p className="text-xs text-gray-500">Contenu créé</p>
        </div>
      </div>

      {/* Platform health */}
      <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">État de la plateforme</h2>
        </div>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <ProgressRing value={healthScore} max={healthChecks.length} size={100} thickness={10} color={healthScore === healthChecks.length ? '#22c55e' : healthScore >= healthChecks.length / 2 ? '#f59e0b' : '#ef4444'} label="Santé globale" />
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            {healthChecks.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {c.ok ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-gray-300" />
                )}
                <span className={c.ok ? 'text-gray-700' : 'text-gray-400'}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Abonnements donut + Members per club bar chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Abonnements des clubs</h2>
          </div>
          <DonutChart data={statusData} size={160} />
          <p className="mt-3 text-center text-xs text-gray-400">Tous les abonnements aux clubs</p>
        </div>

        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Membres par club</h2>
          </div>
          {membersPerClub.length > 0 ? (
            <BarChart data={membersPerClub} height={200} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Aucun club</p>
          )}
        </div>
      </div>

      {/* Sport distribution + Registrations trend */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Membres par sport</h2>
          </div>
          {sportData.length > 0 ? (
            <DonutChart data={sportData} size={160} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Aucune donnée</p>
          )}
        </div>

        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Inscriptions (6 mois)</h2>
          </div>
          <LineChart data={monthData} height={180} color="#22c55e" />
          <p className="mt-2 text-center text-xs text-gray-400">Total: {monthData.reduce((s, d) => s + d.value, 0)} nouvelles inscriptions</p>
        </div>
      </div>

      {/* Club growth + Content overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Croissance des clubs</h2>
          </div>
          <LineChart data={clubGrowthData} height={180} color="#1e3a8a" />
          <p className="mt-2 text-center text-xs text-gray-400">Nombre cumulé de clubs</p>
        </div>

        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Contenu créé</h2>
          </div>
          <BarChart data={contentData} height={200} />
        </div>
      </div>

      {/* Per-club abonnement detail table */}
      <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-900" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Détail des abonnements par club</h2>
        </div>
        <div className="space-y-2">
          {clubs.map(club => {
            const clubMembers = allMembers.filter(m => m.club_id === club.id);
            const active = clubMembers.filter(m => m.status === 'active').length;
            const pending = clubMembers.filter(m => m.status === 'pending').length;
            const inactive = clubMembers.filter(m => m.status === 'inactive').length;
            const total = clubMembers.length;
            const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

            return (
              <div key={club.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{club.name}</span>
                    <span className="text-[10px] text-gray-400">{club.sport}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-900">{total} abonnement{total > 1 ? 's' : ''}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> {active} actif{active > 1 ? 's' : ''}
                  </span>
                  {pending > 0 && (
                    <span className="flex items-center gap-1 text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> {pending} en attente
                    </span>
                  )}
                  {inactive > 0 && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <span className="h-2 w-2 rounded-full bg-gray-300" /> {inactive} inactif{inactive > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="ml-auto text-gray-400">{activePct}% actifs</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500" style={{ width: `${activePct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function NavBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Building2; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
        active
          ? 'bg-gradient-to-r from-white/15 to-white/5 text-white shadow-sm shadow-black/10'
          : 'text-blue-200 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5 scale-110" />
      <span>{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />}
    </button>
  );
}

function MobileTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Building2; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
        active ? 'bg-white/15 text-white' : 'text-blue-200 hover:bg-white/5'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
