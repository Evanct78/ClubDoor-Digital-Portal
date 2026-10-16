import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useClub } from '@/context/ClubContext';
import type { Category, Link, WhatsAppGroup, Contact, ClubEvent, RSVP, Poll, PollOption, PollVote, Announcement, Notification } from '@/types';

export function useClubData() {
  const { currentClub } = useClub();
  const clubId = currentClub?.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [whatsappGroups, setWhatsAppGroups] = useState<WhatsAppGroup[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);

    const [cats, lnks, wa, cts, evts, pls, anns, notifs, rsvpsData, opts, votes] = await Promise.all([
      supabase.from('categories').select('*').eq('club_id', clubId).order('sort_order'),
      supabase.from('links').select('*').eq('club_id', clubId).order('sort_order'),
      supabase.from('whatsapp_groups').select('*').eq('club_id', clubId),
      supabase.from('contacts').select('*').eq('club_id', clubId).order('sort_order'),
      supabase.from('events').select('*').eq('club_id', clubId).order('event_date'),
      supabase.from('polls').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
      supabase.from('rsvps').select('*').in('event_id',
        (await supabase.from('events').select('id').eq('club_id', clubId)).data?.map(e => e.id) ?? []),
      supabase.from('poll_options').select('*').in('poll_id',
        (await supabase.from('polls').select('id').eq('club_id', clubId)).data?.map(p => p.id) ?? []).order('sort_order'),
      supabase.from('poll_votes').select('*'),
    ]);

    setCategories(cats.data as Category[] ?? []);
    setLinks(lnks.data as Link[] ?? []);
    setWhatsAppGroups(wa.data as WhatsAppGroup[] ?? []);
    setContacts(cts.data as Contact[] ?? []);
    setEvents(evts.data as ClubEvent[] ?? []);
    setPolls(pls.data as Poll[] ?? []);
    setAnnouncements(anns.data as Announcement[] ?? []);
    setNotifications(notifs.data as Notification[] ?? []);
    setRsvps(rsvpsData.data as RSVP[] ?? []);
    setPollOptions(opts.data as PollOption[] ?? []);
    setPollVotes(votes.data as PollVote[] ?? []);
    setLoading(false);
  }, [clubId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    categories, links, whatsappGroups, contacts, events, polls, announcements, notifications,
    rsvps, pollOptions, pollVotes, loading, reload: loadAll,
  };
}
