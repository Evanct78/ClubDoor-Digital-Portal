import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, DoorOpen, Trophy, Users, Calendar, Vote, Megaphone, TrendingUp, CheckCircle, XCircle, Activity, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BarChart, DonutChart, LineChart, ProgressRing } from '@/components/Charts';

type ClubDetailData = {
  club: { id: string; name: string; sport: string; address: string | null; created_at: string };
  members: { id: string; role: string; status: string; joined_at: string; user_id: string }[];
  events: { id: string; title: string; event_date: string }[];
  rsvps: { event_id: string; status: string }[];
  polls: { id: string; question: string }[];
  pollVotes: { id: string }[];
  announcements: { id: string }[];
  links: { id: string }[];
  whatsappGroups: { id: string }[];
  contacts: { id: string }[];
  notifications: { id: string; read: boolean }[];
  children: { id: string }[];
  profiles: { id: string; first_name: string | null; last_name: string | null; email: string | null }[];
};

export function ClubDetail({ clubId, onBack }: { clubId: string; onBack: () => void }) {
  const [data, setData] = useState<ClubDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [clubsRes, membersRes, eventsRes, pollsRes, annRes, linksRes, waRes, contactsRes, notifsRes, childrenRes, profilesRes] = await Promise.all([
        supabase.from('clubs').select('*').eq('id', clubId).single(),
        supabase.from('club_members').select('id, role, status, joined_at, user_id').eq('club_id', clubId),
        supabase.from('events').select('id, title, event_date').eq('club_id', clubId).order('event_date'),
        supabase.from('polls').select('id, question').eq('club_id', clubId),
        supabase.from('announcements').select('id').eq('club_id', clubId),
        supabase.from('links').select('id').eq('club_id', clubId),
        supabase.from('whatsapp_groups').select('id').eq('club_id', clubId),
        supabase.from('contacts').select('id').eq('club_id', clubId),
        supabase.from('notifications').select('id, read').eq('club_id', clubId),
        supabase.from('children').select('id').eq('club_id', clubId),
        supabase.from('profiles').select('id, first_name, last_name, email'),
      ]);

      const eventIds = (eventsRes.data ?? []).map((e: { id: string }) => e.id);
      const pollIds = (pollsRes.data ?? []).map((p: { id: string }) => p.id);

      const [rsvpsRes, pollOptionsRes, pollVotesRes] = await Promise.all([
        eventIds.length > 0
          ? supabase.from('rsvps').select('event_id, status').in('event_id', eventIds)
          : Promise.resolve({ data: [], error: null }),
        pollIds.length > 0
          ? supabase.from('poll_options').select('id, poll_id, label').in('poll_id', pollIds)
          : Promise.resolve({ data: [], error: null }),
        Promise.resolve({ data: [], error: null }),
      ]);

      // Count votes per poll via poll_options
      const optionIds = (pollOptionsRes.data ?? []).map((o: { id: string }) => o.id);
      const votesRes = optionIds.length > 0
        ? await supabase.from('poll_votes').select('id, poll_option_id').in('poll_option_id', optionIds)
        : { data: [], error: null };

      const profileMap = new Map((profilesRes.data ?? []).map((p: { id: string; first_name: string | null; last_name: string | null; email: string | null }) => [p.id, p]));

      setData({
        club: clubsRes.data as ClubDetailData['club'],
        members: (membersRes.data ?? []) as ClubDetailData['members'],
        events: (eventsRes.data ?? []) as ClubDetailData['events'],
        rsvps: (rsvpsRes.data ?? []) as ClubDetailData['rsvps'],
        polls: (pollsRes.data ?? []) as ClubDetailData['polls'],
        pollVotes: (votesRes.data ?? []) as ClubDetailData['pollVotes'],
        announcements: (annRes.data ?? []) as ClubDetailData['announcements'],
        links: (linksRes.data ?? []) as ClubDetailData['links'],
        whatsappGroups: (waRes.data ?? []) as ClubDetailData['whatsappGroups'],
        contacts: (contactsRes.data ?? []) as ClubDetailData['contacts'],
        notifications: (notifsRes.data ?? []) as ClubDetailData['notifications'],
        children: (childrenRes.data ?? []) as ClubDetailData['children'],
        profiles: (profilesRes.data ?? []) as ClubDetailData['profiles'],
      });

      // Attach profile info to members
      setData(prev => prev ? {
        ...prev,
        profiles: (profilesRes.data ?? []) as ClubDetailData['profiles'],
        // store profileMap on data for later use
      } : prev);

      // Store profileMap on the data object for the component
      (window as unknown as Record<string, unknown>).__profileMap = profileMap;

      setLoading(false);
    })();
  }, [clubId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-900" />
      </div>
    );
  }

  const { club, members, events, rsvps, polls, pollVotes, announcements, links, whatsappGroups, contacts, notifications, children } = data;
  const profileMap = (window as unknown as Record<string, unknown>).__profileMap as Map<string, { id: string; first_name: string | null; last_name: string | null; email: string | null }> | undefined;

  const activeMembers = members.filter(m => m.status === 'active');
  const adminCount = activeMembers.filter(m => m.role === 'admin').length;
  const memberCount = activeMembers.filter(m => m.role === 'member').length;
  const pendingCount = members.filter(m => m.status === 'pending').length;
  const inactiveCount = members.filter(m => m.status === 'inactive').length;

  const rsvpYes = rsvps.filter(r => r.status === 'yes').length;
  const rsvpMaybe = rsvps.filter(r => r.status === 'maybe').length;
  const rsvpNo = rsvps.filter(r => r.status === 'no').length;

  const readNotifs = notifications.filter(n => n.read).length;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  // Members joined over last 6 months
  const now = new Date();
  const monthData: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const count = members.filter(m => {
      const j = new Date(m.joined_at);
      return j.getFullYear() === d.getFullYear() && j.getMonth() === d.getMonth();
    }).length;
    monthData.push({ label, value: count });
  }

  // Events per month (last 6 months)
  const eventMonthData: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const count = events.filter(e => {
      const ed = new Date(e.event_date);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
    }).length;
    eventMonthData.push({ label, value: count });
  }

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= now).length;
  const pastEvents = events.length - upcomingEvents;

  // App health score
  const healthChecks = [
    { label: 'Membres actifs', ok: activeMembers.length > 0 },
    { label: 'Au moins 1 admin', ok: adminCount > 0 },
    { label: 'Événements créés', ok: events.length > 0 },
    { label: 'Sondages créés', ok: polls.length > 0 },
    { label: 'Infos publiées', ok: announcements.length > 0 },
    { label: 'Groupes WhatsApp', ok: whatsappGroups.length > 0 },
    { label: 'Contacts définis', ok: contacts.length > 0 },
    { label: 'Liens utiles', ok: links.length > 0 },
  ];
  const healthScore = healthChecks.filter(c => c.ok).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white shadow-lg shadow-blue-950/20">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-all hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-blue-950">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold tracking-tight">{club.name}</h1>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-200">
              <Trophy className="h-3 w-3" />
              <span>{club.sport}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-28 md:pb-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 stagger">
          <StatCard icon={Users} value={activeMembers.length} label="Membres actifs" color="from-green-500 to-green-700" />
          <StatCard icon={Calendar} value={events.length} label="Événements" color="from-blue-500 to-blue-700" />
          <StatCard icon={Vote} value={polls.length} label="Sondages" color="from-amber-500 to-amber-700" />
          <StatCard icon={Megaphone} value={announcements.length} label="Infos" color="from-rose-500 to-rose-700" />
        </div>

        {/* Health score */}
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">État de l'application</h2>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            <ProgressRing value={healthScore} max={healthChecks.length} size={100} thickness={10} color={healthScore === healthChecks.length ? '#22c55e' : healthScore >= healthChecks.length / 2 ? '#f59e0b' : '#ef4444'} label="Santé du club" />
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

        {/* Members donut + breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-900" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Répartition des membres</h2>
            </div>
            <DonutChart
              data={[
                { label: 'Membres', value: memberCount, color: '#3b82f6' },
                { label: 'Admins', value: adminCount, color: '#f59e0b' },
                { label: 'En attente', value: pendingCount, color: '#a78bfa' },
                { label: 'Inactifs', value: inactiveCount, color: '#cbd5e1' },
              ]}
            />
          </div>

          <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-900" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Nouvelles inscriptions</h2>
            </div>
            <LineChart data={monthData} height={180} color="#22c55e" />
            <p className="mt-2 text-center text-xs text-gray-400">6 derniers mois</p>
          </div>
        </div>

        {/* Events + RSVPs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-900" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Événements par mois</h2>
            </div>
            <BarChart
              data={eventMonthData.map(d => ({ ...d, color: 'linear-gradient(to top, #1e3a8a, #3b82f6)' }))}
              height={180}
            />
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
              <span className="flex items-center gap-1.5 text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {upcomingEvents} à venir
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                {pastEvents} passés
              </span>
            </div>
          </div>

          <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Participations (RSVP)</h2>
            </div>
            <DonutChart
              data={[
                { label: 'Participent', value: rsvpYes, color: '#22c55e' },
                { label: 'Hésitent', value: rsvpMaybe, color: '#f59e0b' },
                { label: 'Ne participent pas', value: rsvpNo, color: '#ef4444' },
              ]}
            />
            <p className="mt-3 text-center text-xs text-gray-400">{rsvps.length} réponse{rsvps.length > 1 ? 's' : ''} au total</p>
          </div>
        </div>

        {/* Content overview bar chart */}
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Contenu du club</h2>
          </div>
          <BarChart
            data={[
              { label: 'Événements', value: events.length, color: 'linear-gradient(to top, #1e3a8a, #3b82f6)' },
              { label: 'Sondages', value: polls.length, color: 'linear-gradient(to top, #d97706, #f59e0b)' },
              { label: 'Infos', value: announcements.length, color: 'linear-gradient(to top, #be123c, #f43f5e)' },
              { label: 'Liens', value: links.length, color: 'linear-gradient(to top, #7c3aed, #a78bfa)' },
              { label: 'WhatsApp', value: whatsappGroups.length, color: 'linear-gradient(to top, #15803d, #22c55e)' },
              { label: 'Contacts', value: contacts.length, color: 'linear-gradient(to top, #0369a1, #0ea5e9)' },
              { label: 'Enfants', value: children.length, color: 'linear-gradient(to top, #be185d, #ec4899)' },
            ]}
            height={200}
          />
        </div>

        {/* Notifications + engagement */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-900" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Notifications</h2>
            </div>
            <DonutChart
              data={[
                { label: 'Lues', value: readNotifs, color: '#22c55e' },
                { label: 'Non lues', value: unreadNotifs, color: '#f59e0b' },
              ]}
              size={140}
            />
          </div>

          <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Vote className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Participation aux sondages</h2>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 py-4">
              <div className="flex items-center gap-8">
                <ProgressRing value={polls.length} max={Math.max(polls.length, 1)} size={80} thickness={8} color="#f59e0b" label="Sondages" />
                <ProgressRing value={pollVotes.length} max={Math.max(pollVotes.length, activeMembers.length, 1)} size={80} thickness={8} color="#3b82f6" label="Votes" />
              </div>
              <p className="text-center text-xs text-gray-400">
                {pollVotes.length} vote{pollVotes.length > 1 ? 's' : ''} sur {polls.length} sondage{polls.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Member list */}
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Liste des membres</h2>
          </div>
          <div className="space-y-2">
            {activeMembers.map(m => {
              const p = profileMap?.get(m.user_id);
              const name = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email : 'Utilisateur';
              const initials = p ? [p.first_name?.[0], p.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?' : '?';
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-900 to-blue-700 text-xs font-bold text-white">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                    <p className="text-[11px] text-gray-400">Inscrit le {new Date(m.joined_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${m.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {m.role === 'admin' ? 'Admin' : 'Membre'}
                  </span>
                </div>
              );
            })}
            {activeMembers.length === 0 && <p className="py-4 text-center text-sm text-gray-400">Aucun membre actif</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }: { icon: typeof Users; value: number; label: string; color: string }) {
  return (
    <div className="card-hover rounded-2xl bg-white p-4 shadow-sm">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
