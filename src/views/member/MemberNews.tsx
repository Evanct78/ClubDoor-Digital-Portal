import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, BarChart3, Megaphone, Check, X, HelpCircle, Vote } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useClubData } from '@/hooks/useClubData';
import { useAuth } from '@/context/AuthContext';
import type { ClubEvent, Poll } from '@/types';

export function MemberNews() {
  const { events, polls, announcements, rsvps, pollOptions, pollVotes, loading, reload } = useClubData();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'events' | 'polls' | 'announcements'>('events');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-900" />
      </div>
    );
  }

  const myRsvp = (eventId: string) => rsvps.find(r => r.event_id === eventId && r.user_id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-slate-900">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Section selector */}
        <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur">
          <TabBtn active={activeSection === 'events'} onClick={() => setActiveSection('events')} icon={Calendar} label="Événements" />
          <TabBtn active={activeSection === 'polls'} onClick={() => setActiveSection('polls')} icon={BarChart3} label="Sondages" />
          <TabBtn active={activeSection === 'announcements'} onClick={() => setActiveSection('announcements')} icon={Megaphone} label="Infos" />
        </div>

        {/* Events */}
        {activeSection === 'events' && (
          <div className="space-y-4 stagger">
            {events.map(event => (
              <EventCard key={event.id} event={event} myRsvp={myRsvp(event.id)} onChanged={reload} userId={user?.id ?? ''} allRsvps={rsvps} />
            ))}
            {events.length === 0 && (
              <EmptyState icon={Calendar} text="Aucun événement à venir" />
            )}
          </div>
        )}

        {/* Polls */}
        {activeSection === 'polls' && (
          <div className="space-y-4 stagger">
            {polls.map(poll => (
              <PollCard
                key={poll.id}
                poll={poll}
                options={pollOptions.filter(o => o.poll_id === poll.id)}
                votes={pollVotes}
                userId={user?.id ?? ''}
                onChanged={reload}
              />
            ))}
            {polls.length === 0 && (
              <EmptyState icon={BarChart3} text="Aucun sondage en cours" />
            )}
          </div>
        )}

        {/* Announcements */}
        {activeSection === 'announcements' && (
          <div className="space-y-4 stagger">
            {announcements.map(ann => (
              <div key={ann.id} className="card-hover rounded-2xl bg-white p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                    <Megaphone className="h-5 w-5 text-blue-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{ann.content}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(ann.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <EmptyState icon={Megaphone} text="Aucune information pour le moment" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Calendar; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`btn-ghost flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all ${
        active
          ? 'bg-white text-blue-900 shadow-md'
          : 'text-blue-200 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Calendar; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-blue-300">
      <Icon className="mb-3 h-12 w-12 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function EventCard({ event, myRsvp, onChanged, userId, allRsvps }: {
  event: ClubEvent;
  myRsvp: { status: string } | undefined;
  onChanged: () => void;
  userId: string;
  allRsvps: { event_id: string; status: string }[];
}) {
  const [submitting, setSubmitting] = useState(false);
  const eventDate = new Date(event.event_date);

  const rsvpCounts = {
    yes: allRsvps.filter(r => r.event_id === event.id && r.status === 'yes').length,
    maybe: allRsvps.filter(r => r.event_id === event.id && r.status === 'maybe').length,
    no: allRsvps.filter(r => r.event_id === event.id && r.status === 'no').length,
  };

  async function handleRsvp(status: 'yes' | 'maybe' | 'no') {
    setSubmitting(true);
    if (myRsvp) {
      await supabase.from('rsvps').update({ status, updated_at: new Date().toISOString() }).eq('event_id', event.id).eq('user_id', userId);
    } else {
      await supabase.from('rsvps').insert({ event_id: event.id, user_id: userId, status });
    }
    setSubmitting(false);
    onChanged();
  }

  return (
    <div className="card-hover rounded-2xl bg-white p-5 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
      {event.description && <p className="mt-1 text-sm text-gray-600">{event.description}</p>}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {event.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2 text-xs">
        <span className="flex items-center gap-1 text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" /> {rsvpCounts.yes} participent
        </span>
        <span className="flex items-center gap-1 text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> {rsvpCounts.maybe} hésitent
        </span>
        <span className="flex items-center gap-1 text-red-700">
          <span className="h-2 w-2 rounded-full bg-red-500" /> {rsvpCounts.no} ne participent pas
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <RsvpButton current={myRsvp?.status} status="yes" onClick={() => handleRsvp('yes')} disabled={submitting} />
        <RsvpButton current={myRsvp?.status} status="maybe" onClick={() => handleRsvp('maybe')} disabled={submitting} />
        <RsvpButton current={myRsvp?.status} status="no" onClick={() => handleRsvp('no')} disabled={submitting} />
      </div>
    </div>
  );
}

function RsvpButton({ current, status, onClick, disabled }: {
  current?: string;
  status: 'yes' | 'maybe' | 'no';
  onClick: () => void;
  disabled: boolean;
}) {
  const config = {
    yes: { active: 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-md shadow-green-600/30', inactive: 'bg-green-50 text-green-700 hover:bg-green-100', icon: Check, label: 'Je participe' },
    maybe: { active: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30', inactive: 'bg-amber-50 text-amber-700 hover:bg-amber-100', icon: HelpCircle, label: 'Je ne sais pas' },
    no: { active: 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md shadow-red-600/30', inactive: 'bg-red-50 text-red-700 hover:bg-red-100', icon: X, label: 'Je ne participe pas' },
  };
  const c = config[status];
  const Icon = c.icon;
  const isActive = current === status;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-ghost flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-all ${
        isActive ? c.active : c.inactive
      } disabled:opacity-50`}
    >
      <Icon className="h-4 w-4" />
      <span>{c.label}</span>
    </button>
  );
}

function PollCard({ poll, options, votes, userId, onChanged }: {
  poll: Poll;
  options: { id: string; label: string; sort_order: number }[];
  votes: { poll_option_id: string; user_id: string }[];
  userId: string;
  onChanged: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const myVote = votes.find(v => v.user_id === userId && options.some(o => o.id === v.poll_option_id));

  async function handleVote(optionId: string) {
    setSubmitting(true);
    if (myVote) {
      await supabase.from('poll_votes').delete().eq('poll_option_id', myVote.poll_option_id).eq('user_id', userId);
    }
    await supabase.from('poll_votes').insert({ poll_option_id: optionId, user_id: userId });
    setSubmitting(false);
    onChanged();
  }

  const totalVotes = votes.filter(v => options.some(o => o.id === v.poll_option_id)).length;

  return (
    <div className="card-hover rounded-2xl bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
          <Vote className="h-5 w-5 text-blue-900" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{poll.question}</h3>
          {poll.description && <p className="mt-0.5 text-sm text-gray-600">{poll.description}</p>}
        </div>
      </div>

      <div className="space-y-2">
        {options.map(opt => {
          const voteCount = votes.filter(v => v.poll_option_id === opt.id).length;
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isMyVote = myVote?.poll_option_id === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={submitting}
              className={`btn-ghost relative w-full overflow-hidden rounded-xl border text-left transition-all ${
                isMyVote ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {myVote && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100/50 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                {myVote && (
                  <span className="text-xs font-medium text-gray-500">{pct}%</span>
                )}
                {isMyVote && (
                  <Check className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        {totalVotes} participant{totalVotes !== 1 ? 's' : ''}
        {myVote ? ' — Votre vote est enregistré' : ' — Cliquez pour voter'}
      </p>
    </div>
  );
}
