import { useState, useEffect } from 'react';
import { Search, Send, Tag, Calendar, BarChart3, Users, Check, X, Mail, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useClub } from '@/context/ClubContext';
import { useClubData } from '@/hooks/useClubData';
import type { Profile, ClubMember, ClubEvent } from '@/types';

export function AdminMembers() {
  const { currentClub } = useClub();
  const { events, rsvps, polls, pollOptions, pollVotes, categories, reload } = useClubData();
  const [members, setMembers] = useState<(ClubMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<(ClubMember & { profile: Profile }) | null>(null);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '' });
  const [viewEvent, setViewEvent] = useState<ClubEvent | null>(null);

  useEffect(() => {
    if (!currentClub) return;
    (async () => {
      const { data: mems } = await supabase
        .from('club_members')
        .select('*, profile:profiles(*)')
        .eq('club_id', currentClub.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      setMembers((mems as (ClubMember & { profile: Profile })[]) ?? []);
      setLoading(false);
    })();
  }, [currentClub]);

  async function toggleAdminRole(member: ClubMember) {
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    await supabase.from('club_members').update({ role: newRole }).eq('id', member.id);
    const { data: updated } = await supabase
      .from('club_members')
      .select('*, profile:profiles(*)')
      .eq('club_id', currentClub!.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });
    setMembers((updated as (ClubMember & { profile: Profile })[]) ?? []);
  }

  async function removeMember(member: ClubMember) {
    await supabase.from('club_members').delete().eq('id', member.id);
    setMembers(members.filter(m => m.id !== member.id));
    setSelectedMember(null);
  }

  async function sendNotification() {
    if (!notifyForm.title) return;
    const targetMembers = selectedMember ? [selectedMember] : members;
    const notifs = targetMembers.map(m => ({
      club_id: currentClub!.id,
      user_id: m.user_id,
      title: notifyForm.title,
      message: notifyForm.message || null,
      type: 'info',
    }));
    await supabase.from('notifications').insert(notifs);
    setNotifyForm({ title: '', message: '' });
    setShowNotify(false);
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const name = `${m.profile?.first_name ?? ''} ${m.profile?.last_name ?? ''}`.toLowerCase();
    const email = (m.profile?.email ?? '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-900" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <div className="animate-fade-in-up">
        <h1 className="gradient-text text-2xl font-bold">Membres</h1>
        <p className="mt-1 text-sm text-gray-500">{members.length} membre{members.length > 1 ? 's' : ''} au club</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un membre..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Event participation summary */}
      {events.length > 0 && (
        <div className="card-hover rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-semibold text-gray-900">Participations aux événements</h2>
          </div>
          <div className="space-y-2">
            {events.slice(0, 3).map(ev => {
              const yes = rsvps.filter(r => r.event_id === ev.id && r.status === 'yes').length;
              const maybe = rsvps.filter(r => r.event_id === ev.id && r.status === 'maybe').length;
              const no = rsvps.filter(r => r.event_id === ev.id && r.status === 'no').length;
              return (
                <button key={ev.id} onClick={() => setViewEvent(ev)} className="btn-ghost w-full rounded-lg bg-slate-50 p-3 text-left transition-all hover:bg-slate-100">
                  <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                  <div className="mt-1 flex gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-700"><span className="h-2 w-2 rounded-full bg-green-500" />{yes}</span>
                    <span className="flex items-center gap-1 text-amber-700"><span className="h-2 w-2 rounded-full bg-amber-500" />{maybe}</span>
                    <span className="flex items-center gap-1 text-red-700"><span className="h-2 w-2 rounded-full bg-red-500" />{no}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => { setSelectedMember(null); setShowNotify(true); }}
        className="btn-primary flex w-full items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm"
      >
        <Send className="h-4 w-4" /> Envoyer une notification à tous
      </button>

      {/* Members list */}
      <div className="space-y-2 stagger">
        {filtered.map(member => (
          <button
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className="card-hover flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-200"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-900 to-blue-700 text-sm font-bold text-white shadow-md">
              {[member.profile?.first_name?.[0], member.profile?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {[member.profile?.first_name, member.profile?.last_name].filter(Boolean).join(' ') || 'Sans nom'}
              </p>
              <p className="text-xs text-gray-400">{member.profile?.email}</p>
            </div>
            {member.role === 'admin' && (
              <span className="rounded-full bg-gradient-to-r from-green-100 to-green-200 px-2 py-0.5 text-xs font-medium text-green-700">Admin</span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">Aucun membre trouvé</p>
        )}
      </div>

      {/* Member detail modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setSelectedMember(null)}>
          <div className="animate-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-900 to-blue-700 text-lg font-bold text-white shadow-lg">
                {[selectedMember.profile?.first_name?.[0], selectedMember.profile?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {[selectedMember.profile?.first_name, selectedMember.profile?.last_name].filter(Boolean).join(' ') || 'Sans nom'}
                </h3>
                <p className="text-xs text-gray-400">Membre depuis {new Date(selectedMember.joined_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              {selectedMember.profile?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" /> {selectedMember.profile.email}
                </div>
              )}
              {selectedMember.profile?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" /> {selectedMember.profile.phone}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowNotify(true); }}
                className="btn-ghost flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-sm font-medium text-blue-900 transition-all hover:bg-blue-100"
              >
                <MessageSquare className="h-4 w-4" /> Notifier
              </button>
              <button
                onClick={() => toggleAdminRole(selectedMember)}
                className="btn-ghost flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-slate-100"
              >
                <Tag className="h-4 w-4" /> {selectedMember.role === 'admin' ? 'Rendre membre' : 'Rendre admin'}
              </button>
            </div>
            <button
              onClick={() => removeMember(selectedMember)}
              className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Retirer du club
            </button>
            <button onClick={() => setSelectedMember(null)} className="mt-2 w-full py-2 text-center text-xs text-gray-400">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Notify modal */}
      {showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setShowNotify(false)}>
          <div className="animate-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-1 font-bold text-gray-900">Envoyer une notification</h3>
            <p className="mb-4 text-xs text-gray-400">
              {selectedMember ? `À ${selectedMember.profile?.first_name}` : `À tous les membres (${members.length})`}
            </p>
            <div className="space-y-3">
              <input
                value={notifyForm.title}
                onChange={e => setNotifyForm({ ...notifyForm, title: e.target.value })}
                placeholder="Titre"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <textarea
                value={notifyForm.message}
                onChange={e => setNotifyForm({ ...notifyForm, message: e.target.value })}
                placeholder="Message"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowNotify(false)} className="btn-ghost flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={sendNotification} className="btn-primary flex-1 rounded-xl py-2.5 text-sm font-medium text-white">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event detail modal */}
      {viewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setViewEvent(null)}>
          <div className="animate-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-1 font-bold text-gray-900">{viewEvent.title}</h3>
            <p className="mb-4 text-xs text-gray-400">
              {new Date(viewEvent.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>

            {(() => {
              const eventRsvps = rsvps.filter(r => r.event_id === viewEvent.id);
              const yesMembers = members.filter(m => eventRsvps.some(r => r.user_id === m.user_id && r.status === 'yes'));
              const maybeMembers = members.filter(m => eventRsvps.some(r => r.user_id === m.user_id && r.status === 'maybe'));
              const noMembers = members.filter(m => eventRsvps.some(r => r.user_id === m.user_id && r.status === 'no'));

              return (
                <div className="space-y-3">
                  <RsvpList label="Participent" count={yesMembers.length} color="green" members={yesMembers} />
                  <RsvpList label="Hésitent" count={maybeMembers.length} color="amber" members={maybeMembers} />
                  <RsvpList label="Ne participent pas" count={noMembers.length} color="red" members={noMembers} />
                </div>
              );
            })()}

            <button onClick={() => setViewEvent(null)} className="btn-ghost mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-slate-200">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RsvpList({ label, count, color, members }: { label: string; count: number; color: string; members: (ClubMember & { profile: Profile })[] }) {
  const colors: Record<string, string> = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${colors[color]}`} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">({count})</span>
      </div>
      <div className="ml-4 space-y-1">
        {members.map(m => (
          <p key={m.id} className="text-xs text-gray-500">
            {[m.profile?.first_name, m.profile?.last_name].filter(Boolean).join(' ')}
          </p>
        ))}
        {count === 0 && <p className="text-xs text-gray-300">—</p>}
      </div>
    </div>
  );
}
