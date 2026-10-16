import { useEffect, useState } from 'react';
import {
  Users, Calendar, BarChart3, Bell, FileText, TrendingUp, Megaphone,
  CheckCircle2, Circle, XCircle, Vote, CalendarDays, UserCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useClub } from '@/context/ClubContext';

type DashboardData = {
  stats: {
    members: number;
    events: number;
    polls: number;
    notifications: number;
    pending: number;
    announcements: number;
  };
  recentActivity: { type: string; title: string; date: string }[];
  eventRsvps: { title: string; date: string; yes: number; maybe: number; no: number }[];
  pollResults: { question: string; options: { label: string; votes: number }[]; total: number }[];
  recentAnnouncements: { title: string; content: string | null; date: string }[];
  newMembers: { firstName: string | null; lastName: string | null; joinedAt: string }[];
  categoryBreakdown: { name: string; color: string; count: number }[];
  monthlyJoins: { month: string; count: number }[];
};

export function AdminDashboard() {
  const { currentClub } = useClub();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentClub) return;
    (async () => {
      const clubId = currentClub.id;

      const [
        membersCount, eventsCount, pollsCount, notifsCount, pendingCount, annCount,
        recentEvents, recentPolls, recentAnns,
        allEvents, allRsvps, allPolls, allPollOptions, allPollVotes,
        announcements,
        membersData, categoriesData, memberCategoriesData,
      ] = await Promise.all([
        supabase.from('club_members').select('id', { count: 'exact', head: true }).eq('club_id', clubId).eq('status', 'active'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('club_id', clubId),
        supabase.from('polls').select('id', { count: 'exact', head: true }).eq('club_id', clubId),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('club_id', clubId),
        supabase.from('club_members').select('id', { count: 'exact', head: true }).eq('club_id', clubId).eq('status', 'pending'),
        supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('club_id', clubId),
        supabase.from('events').select('title, created_at').eq('club_id', clubId).order('created_at', { ascending: false }).limit(3),
        supabase.from('polls').select('question, created_at').eq('club_id', clubId).order('created_at', { ascending: false }).limit(3),
        supabase.from('announcements').select('title, created_at').eq('club_id', clubId).order('created_at', { ascending: false }).limit(3),
        supabase.from('events').select('id, title, event_date').eq('club_id', clubId).order('event_date'),
        supabase.from('rsvps').select('event_id, status').in('event_id', (await supabase.from('events').select('id').eq('club_id', clubId)).data?.map(e => e.id) ?? []),
        supabase.from('polls').select('id, question').eq('club_id', clubId).order('created_at', { ascending: false }),
        supabase.from('poll_options').select('id, poll_id, label, sort_order').in('poll_id', (await supabase.from('polls').select('id').eq('club_id', clubId)).data?.map(p => p.id) ?? []).order('sort_order'),
        supabase.from('poll_votes').select('poll_option_id'),
        supabase.from('announcements').select('title, content, created_at').eq('club_id', clubId).order('created_at', { ascending: false }).limit(3),
        supabase.from('club_members').select('id, user_id, joined_at, profile:profiles(first_name, last_name)').eq('club_id', clubId).eq('status', 'active').order('joined_at', { ascending: false }).limit(5),
        supabase.from('categories').select('id, name, color').eq('club_id', clubId).order('sort_order'),
        supabase.from('member_categories').select('category_id, club_member_id').in('club_member_id',
          (await supabase.from('club_members').select('id').eq('club_id', clubId).eq('status', 'active')).data?.map(m => m.id) ?? []),
      ]);

      const activity: { type: string; title: string; date: string }[] = [];
      (recentEvents.data as { title: string; created_at: string }[])?.forEach(e => activity.push({ type: 'event', title: e.title, date: e.created_at }));
      (recentPolls.data as { question: string; created_at: string }[])?.forEach(p => activity.push({ type: 'poll', title: p.question, date: p.created_at }));
      (recentAnns.data as { title: string; created_at: string }[])?.forEach(a => activity.push({ type: 'announcement', title: a.title, date: a.created_at }));
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Event RSVPs
      const eventRsvps = (allEvents.data as { id: string; title: string; event_date: string }[] ?? []).map(ev => {
        const evRsvps = (allRsvps.data as { event_id: string; status: string }[] ?? []).filter(r => r.event_id === ev.id);
        return {
          title: ev.title,
          date: ev.event_date,
          yes: evRsvps.filter(r => r.status === 'yes').length,
          maybe: evRsvps.filter(r => r.status === 'maybe').length,
          no: evRsvps.filter(r => r.status === 'no').length,
        };
      });

      // Poll results
      const pollResults = (allPolls.data as { id: string; question: string }[] ?? []).map(p => {
        const opts = (allPollOptions.data as { id: string; poll_id: string; label: string }[] ?? []).filter(o => o.poll_id === p.id);
        const options = opts.map(o => ({
          label: o.label,
          votes: (allPollVotes.data as { poll_option_id: string }[] ?? []).filter(v => v.poll_option_id === o.id).length,
        }));
        return { question: p.question, options, total: options.reduce((s, o) => s + o.votes, 0) };
      });

      // Announcements
      const recentAnnouncements = (announcements.data as { title: string; content: string | null; created_at: string }[] ?? []).map(a => ({
        title: a.title, content: a.content, date: a.created_at,
      }));

      // New members
      const newMembers = (membersData.data as { joined_at: string; profile: { first_name: string | null; last_name: string | null }[] }[] ?? []).map(m => ({
        firstName: m.profile?.[0]?.first_name ?? null,
        lastName: m.profile?.[0]?.last_name ?? null,
        joinedAt: m.joined_at,
      }));

      // Category breakdown
      const cats = categoriesData.data as { id: string; name: string; color: string }[] ?? [];
      const memCats = memberCategoriesData.data as { category_id: string }[] ?? [];
      const categoryBreakdown = cats.map(c => ({
        name: c.name,
        color: c.color,
        count: memCats.filter(mc => mc.category_id === c.id).length,
      }));

      // Monthly joins (last 6 months)
      const allMembersRes = await supabase.from('club_members').select('joined_at').eq('club_id', clubId).eq('status', 'active');
      const now = new Date();
      const monthlyJoins: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const count = (allMembersRes.data as { joined_at: string }[] ?? []).filter(m => {
          const j = new Date(m.joined_at);
          return j >= d && j <= monthEnd;
        }).length;
        monthlyJoins.push({ month: d.toLocaleDateString('fr-FR', { month: 'short' }), count });
      }

      setData({
        stats: {
          members: membersCount.count ?? 0,
          events: eventsCount.count ?? 0,
          polls: pollsCount.count ?? 0,
          notifications: notifsCount.count ?? 0,
          pending: pendingCount.count ?? 0,
          announcements: annCount.count ?? 0,
        },
        recentActivity: activity.slice(0, 6),
        eventRsvps,
        pollResults,
        recentAnnouncements,
        newMembers,
        categoryBreakdown,
        monthlyJoins,
      });

      setLoading(false);
    })();
  }, [currentClub]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-900" />
      </div>
    );
  }

  const maxMonthly = Math.max(...data.monthlyJoins.map(m => m.count), 1);
  const maxCatCount = Math.max(...data.categoryBreakdown.map(c => c.count), 1);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
      {/* Title */}
      <div className="animate-fade-in-up">
        <h1 className="gradient-text text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Vue d'ensemble du {currentClub?.name}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 stagger md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Users} label="Membres" value={data.stats.members} gradient="from-blue-500 to-blue-700" />
        <StatCard icon={Calendar} label="Événements" value={data.stats.events} gradient="from-green-500 to-green-700" />
        <StatCard icon={BarChart3} label="Sondages" value={data.stats.polls} gradient="from-amber-500 to-amber-700" />
        <StatCard icon={Megaphone} label="Annonces" value={data.stats.announcements} gradient="from-teal-500 to-teal-700" />
        <StatCard icon={Bell} label="Notifications" value={data.stats.notifications} gradient="from-rose-500 to-rose-700" />
        <StatCard icon={UserCheck} label="En attente" value={data.stats.pending} gradient="from-orange-500 to-orange-700" />
      </div>

      {/* Pending alert */}
      {data.stats.pending > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 animate-fade-in-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-200">
            <FileText className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">{data.stats.pending} demande{data.stats.pending > 1 ? 's' : ''} à traiter</p>
            <p className="text-xs text-amber-700">Nouveaux membres en attente de validation</p>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly joins bar chart */}
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Nouveaux membres / mois</h2>
          </div>
          <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
            {data.monthlyJoins.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-400 transition-all duration-500 hover:from-blue-800 hover:to-blue-500"
                    style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? '8px' : '2px' }}
                    title={`${m.count} membre(s)`}
                  />
                </div>
                <span className="text-[10px] font-medium text-gray-400">{m.month}</span>
                <span className="text-[10px] font-bold text-blue-900">{m.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Membres par catégorie</h2>
          </div>
          {data.categoryBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Aucune catégorie</p>
          ) : (
            <div className="space-y-3">
              {data.categoryBreakdown.map((cat, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{cat.name}</span>
                    <span className="font-bold text-gray-900">{cat.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(cat.count / maxCatCount) * 100}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event RSVPs */}
      {data.eventRsvps.length > 0 && (
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Participation aux événements</h2>
          </div>
          <div className="space-y-4">
            {data.eventRsvps.map((ev, i) => {
              const total = ev.yes + ev.maybe + ev.no;
              const yesPct = total > 0 ? (ev.yes / total) * 100 : 0;
              const maybePct = total > 0 ? (ev.maybe / total) * 100 : 0;
              const noPct = total > 0 ? (ev.no / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                      <p className="text-[11px] text-gray-400">{new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-400">{total} réponse{total > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex h-6 overflow-hidden rounded-lg bg-slate-100 text-[10px] font-semibold text-white">
                    {total > 0 ? (
                      <>
                        {ev.yes > 0 && (
                          <div className="flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500" style={{ width: `${yesPct}%` }}>
                            {ev.yes}
                          </div>
                        )}
                        {ev.maybe > 0 && (
                          <div className="flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500" style={{ width: `${maybePct}%` }}>
                            {ev.maybe}
                          </div>
                        )}
                        {ev.no > 0 && (
                          <div className="flex items-center justify-center bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500" style={{ width: `${noPct}%` }}>
                            {ev.no}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex w-full items-center justify-center text-gray-400">Aucune réponse</div>
                    )}
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="h-3 w-3" /> Participent ({ev.yes})</span>
                    <span className="flex items-center gap-1 text-amber-700"><Circle className="h-3 w-3" /> Hésitent ({ev.maybe})</span>
                    <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3 w-3" /> Absents ({ev.no})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Poll results */}
      {data.pollResults.length > 0 && (
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Vote className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Résultats des sondages</h2>
          </div>
          <div className="space-y-5">
            {data.pollResults.map((poll, i) => {
              const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);
              return (
                <div key={i}>
                  <p className="mb-3 text-sm font-medium text-gray-900">{poll.question}</p>
                  <div className="space-y-2">
                    {poll.options.map((opt, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 truncate text-xs text-gray-500">{opt.label}</span>
                        <div className="h-5 flex-1 overflow-hidden rounded-lg bg-slate-100">
                          <div
                            className={`h-full rounded-lg transition-all duration-700 ${
                              opt.votes === maxVotes && opt.votes > 0
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                : 'bg-gradient-to-r from-slate-300 to-slate-400'
                            }`}
                            style={{ width: `${(opt.votes / maxVotes) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs font-bold text-gray-700">{opt.votes}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400">{poll.total} vote{poll.total > 1 ? 's' : ''} au total</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom row: activity + announcements */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent activity */}
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Dernières activités</h2>
          </div>
          <div className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune activité récente</p>
            ) : (
              data.recentActivity.map((act, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50">
                  <ActivityIcon type={act.type} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{act.title}</p>
                    <p className="text-xs text-gray-400">{new Date(act.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent announcements */}
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Dernières annonces</h2>
          </div>
          {data.recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune annonce</p>
          ) : (
            <div className="space-y-3">
              {data.recentAnnouncements.map((ann, i) => (
                <div key={i} className="rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100">
                  <p className="text-sm font-medium text-gray-900">{ann.title}</p>
                  {ann.content && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{ann.content}</p>}
                  <p className="mt-1 text-[10px] text-gray-400">{new Date(ann.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New members */}
      {data.newMembers.length > 0 && (
        <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Membres récents</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.newMembers.map((m, i) => {
              const initials = [m.firstName?.[0], m.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
              return (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-900 to-blue-700 text-xs font-bold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{[m.firstName, m.lastName].filter(Boolean).join(' ') || 'Sans nom'}</p>
                    <p className="text-[10px] text-gray-400">Depuis {new Date(m.joinedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient }: { icon: typeof Users; label: string; value: number; gradient: string }) {
  return (
    <div className="card-hover group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform group-hover:scale-110`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const config: Record<string, { icon: typeof Users; gradient: string }> = {
    event: { icon: Calendar, gradient: 'from-blue-100 to-blue-200 text-blue-700' },
    poll: { icon: BarChart3, gradient: 'from-amber-100 to-amber-200 text-amber-700' },
    announcement: { icon: Megaphone, gradient: 'from-green-100 to-green-200 text-green-700' },
  };
  const c = config[type] ?? config.event;
  const Icon = c.icon;
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${c.gradient}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}
