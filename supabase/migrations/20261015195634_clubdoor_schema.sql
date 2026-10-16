/*
# ClubDoor — Full Database Schema

## Overview
Creates the complete schema for ClubDoor, a club management platform with member and admin (president/coach) interfaces. Includes clubs, user profiles, memberships, categories, events with RSVPs, polls with voting, links, WhatsApp groups, contacts, announcements, and notifications.

## New Tables
1. `clubs` — Club entities with name, sport, QR token, colors
2. `profiles` — User profile data extending auth.users (first name, last name, phone, birth date, address, avatar, bio)
3. `club_members` — Junction linking users to clubs with role (member/admin) and status
4. `categories` — Club categories/groups (e.g. Baby tennis, Jeunes, Adultes, Compétition)
5. `member_categories` — Junction linking members to categories
6. `events` — Club events with title, description, date, location
7. `rsvps` — Member responses to events (yes/maybe/no)
8. `polls` — Club polls with question and optional close date
9. `poll_options` — Options for each poll
10. `poll_votes` — Member votes on poll options
11. `links` — Club links (website, social media, documents, etc.)
12. `whatsapp_groups` — Club WhatsApp group links
13. `contacts` — Club contacts (president, coach, secretary, etc.)
14. `announcements` — Club announcements / important information
15. `notifications` — Notifications sent to members

## Security
- RLS enabled on ALL tables
- Two SECURITY DEFINER helper functions: `is_club_member(uuid)` and `is_club_admin(uuid)`
- Profiles: users can read/update only their own profile
- Club-scoped tables: members can read, admins can write
- RSVPs: members can create/update/delete their own responses
- Poll votes: members can vote, admins can see results
- Notifications: users see their own, admins can create
- Club membership: self-insert (join), admin manages

## Seed Data
- Creates a demo club "Tennis Club Olympique" with QR token
- Seeds categories, links, contacts, WhatsApp groups, events, polls, announcements
*/

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================

CREATE OR REPLACE FUNCTION is_club_member(check_club_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = check_club_id
    AND club_members.user_id = auth.uid()
    AND club_members.status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_club_admin(check_club_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = check_club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role = 'admin'
    AND club_members.status = 'active'
  );
END;
$$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sport text DEFAULT 'Tennis',
  description text,
  qr_token text UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  primary_color text DEFAULT '#1e3a8a',
  accent_color text DEFAULT '#22c55e',
  address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  phone text,
  birth_date date,
  address text,
  city text,
  avatar_url text,
  bio text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3b82f6',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_member_id uuid NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(club_member_id, category_id)
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('yes', 'maybe', 'no')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  question text NOT NULL,
  description text,
  closes_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_option_id, user_id)
);

CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  icon text DEFAULT 'link',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  phone text,
  email text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: clubs
-- ============================================================
DROP POLICY IF EXISTS "select_clubs" ON clubs;
CREATE POLICY "select_clubs" ON clubs FOR SELECT
  TO authenticated USING (is_club_member(clubs.id));

DROP POLICY IF EXISTS "update_clubs" ON clubs;
CREATE POLICY "update_clubs" ON clubs FOR UPDATE
  TO authenticated USING (is_club_admin(clubs.id)) WITH CHECK (is_club_admin(clubs.id));

-- ============================================================
-- POLICIES: profiles
-- ============================================================
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- POLICIES: club_members
-- ============================================================
DROP POLICY IF EXISTS "select_club_members" ON club_members;
CREATE POLICY "select_club_members" ON club_members FOR SELECT
  TO authenticated USING (is_club_member(club_members.club_id));

DROP POLICY IF EXISTS "insert_club_members_self" ON club_members;
CREATE POLICY "insert_club_members_self" ON club_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND is_club_member(club_members.club_id) = false);

DROP POLICY IF EXISTS "insert_club_members_admin" ON club_members;
CREATE POLICY "insert_club_members_admin" ON club_members FOR INSERT
  TO authenticated WITH CHECK (is_club_admin(club_members.club_id));

DROP POLICY IF EXISTS "update_club_members_admin" ON club_members;
CREATE POLICY "update_club_members_admin" ON club_members FOR UPDATE
  TO authenticated USING (is_club_admin(club_members.club_id)) WITH CHECK (is_club_admin(club_members.club_id));

DROP POLICY IF EXISTS "update_club_members_self" ON club_members;
CREATE POLICY "update_club_members_self" ON club_members FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_club_members_admin" ON club_members;
CREATE POLICY "delete_club_members_admin" ON club_members FOR DELETE
  TO authenticated USING (is_club_admin(club_members.club_id));

-- ============================================================
-- POLICIES: categories
-- ============================================================
DROP POLICY IF EXISTS "select_categories" ON categories;
CREATE POLICY "select_categories" ON categories FOR SELECT
  TO authenticated USING (is_club_member(categories.club_id));

DROP POLICY IF EXISTS "insert_categories" ON categories;
CREATE POLICY "insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (is_club_admin(categories.club_id));

DROP POLICY IF EXISTS "update_categories" ON categories;
CREATE POLICY "update_categories" ON categories FOR UPDATE
  TO authenticated USING (is_club_admin(categories.club_id)) WITH CHECK (is_club_admin(categories.club_id));

DROP POLICY IF EXISTS "delete_categories" ON categories;
CREATE POLICY "delete_categories" ON categories FOR DELETE
  TO authenticated USING (is_club_admin(categories.club_id));

-- ============================================================
-- POLICIES: member_categories
-- ============================================================
DROP POLICY IF EXISTS "select_member_categories" ON member_categories;
CREATE POLICY "select_member_categories" ON member_categories FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.id = member_categories.club_member_id
      AND is_club_member(cm.club_id)
    )
  );

DROP POLICY IF EXISTS "insert_member_categories_admin" ON member_categories;
CREATE POLICY "insert_member_categories_admin" ON member_categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.id = member_categories.club_member_id
      AND is_club_admin(cm.club_id)
    )
  );

DROP POLICY IF EXISTS "insert_member_categories_self" ON member_categories;
CREATE POLICY "insert_member_categories_self" ON member_categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.id = member_categories.club_member_id
      AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_member_categories_admin" ON member_categories;
CREATE POLICY "delete_member_categories_admin" ON member_categories FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.id = member_categories.club_member_id
      AND is_club_admin(cm.club_id)
    )
  );

DROP POLICY IF EXISTS "delete_member_categories_self" ON member_categories;
CREATE POLICY "delete_member_categories_self" ON member_categories FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.id = member_categories.club_member_id
      AND cm.user_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES: events
-- ============================================================
DROP POLICY IF EXISTS "select_events" ON events;
CREATE POLICY "select_events" ON events FOR SELECT
  TO authenticated USING (is_club_member(events.club_id));

DROP POLICY IF EXISTS "insert_events" ON events;
CREATE POLICY "insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (is_club_admin(events.club_id));

DROP POLICY IF EXISTS "update_events" ON events;
CREATE POLICY "update_events" ON events FOR UPDATE
  TO authenticated USING (is_club_admin(events.club_id)) WITH CHECK (is_club_admin(events.club_id));

DROP POLICY IF EXISTS "delete_events" ON events;
CREATE POLICY "delete_events" ON events FOR DELETE
  TO authenticated USING (is_club_admin(events.club_id));

-- ============================================================
-- POLICIES: rsvps
-- ============================================================
DROP POLICY IF EXISTS "select_rsvps" ON rsvps;
CREATE POLICY "select_rsvps" ON rsvps FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = rsvps.event_id
      AND is_club_member(e.club_id)
    )
  );

DROP POLICY IF EXISTS "insert_rsvps" ON rsvps;
CREATE POLICY "insert_rsvps" ON rsvps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_rsvps" ON rsvps;
CREATE POLICY "update_rsvps" ON rsvps FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_rsvps" ON rsvps;
CREATE POLICY "delete_rsvps" ON rsvps FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES: polls
-- ============================================================
DROP POLICY IF EXISTS "select_polls" ON polls;
CREATE POLICY "select_polls" ON polls FOR SELECT
  TO authenticated USING (is_club_member(polls.club_id));

DROP POLICY IF EXISTS "insert_polls" ON polls;
CREATE POLICY "insert_polls" ON polls FOR INSERT
  TO authenticated WITH CHECK (is_club_admin(polls.club_id));

DROP POLICY IF EXISTS "update_polls" ON polls;
CREATE POLICY "update_polls" ON polls FOR UPDATE
  TO authenticated USING (is_club_admin(polls.club_id)) WITH CHECK (is_club_admin(polls.club_id));

DROP POLICY IF EXISTS "delete_polls" ON polls;
CREATE POLICY "delete_polls" ON polls FOR DELETE
  TO authenticated USING (is_club_admin(polls.club_id));

-- ============================================================
-- POLICIES: poll_options
-- ============================================================
DROP POLICY IF EXISTS "select_poll_options" ON poll_options;
CREATE POLICY "select_poll_options" ON poll_options FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = poll_options.poll_id
      AND is_club_member(p.club_id)
    )
  );

DROP POLICY IF EXISTS "insert_poll_options" ON poll_options;
CREATE POLICY "insert_poll_options" ON poll_options FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = poll_options.poll_id
      AND is_club_admin(p.club_id)
    )
  );

DROP POLICY IF EXISTS "update_poll_options" ON poll_options;
CREATE POLICY "update_poll_options" ON poll_options FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = poll_options.poll_id
      AND is_club_admin(p.club_id)
    )
  );

DROP POLICY IF EXISTS "delete_poll_options" ON poll_options;
CREATE POLICY "delete_poll_options" ON poll_options FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = poll_options.poll_id
      AND is_club_admin(p.club_id)
    )
  );

-- ============================================================
-- POLICIES: poll_votes
-- ============================================================
DROP POLICY IF EXISTS "select_poll_votes" ON poll_votes;
CREATE POLICY "select_poll_votes" ON poll_votes FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM poll_options po
      JOIN polls p ON p.id = po.poll_id
      WHERE po.id = poll_votes.poll_option_id
      AND is_club_member(p.club_id)
    )
  );

DROP POLICY IF EXISTS "insert_poll_votes" ON poll_votes;
CREATE POLICY "insert_poll_votes" ON poll_votes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_poll_votes" ON poll_votes;
CREATE POLICY "delete_poll_votes" ON poll_votes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES: links
-- ============================================================
DROP POLICY IF EXISTS "select_links" ON links;
CREATE POLICY "select_links" ON links FOR SELECT
  TO authenticated USING (is_club_member(links.club_id));

DROP POLICY IF EXISTS "insert_links" ON links;
CREATE POLICY "insert_links" ON links FOR INSERT
  TO authenticated WITH CHECK (is_club_admin(links.club_id));

DROP POLICY IF EXISTS "update_links" ON links;
CREATE POLICY "update_links" ON links FOR UPDATE
  TO authenticated USING (is_club_admin(links.club_id)) WITH CHECK (is_club_admin(links.club_id));

DROP POLICY IF EXISTS "delete_links" ON links;
CREATE POLICY "delete_links" ON links FOR DELETE
  TO authenticated USING (is_club_admin(links.club_id));

-- ============================================================
-- POLICIES: whatsapp_groups
-- ============================================================
DROP POLICY IF EXISTS "select_whatsapp_groups" ON whatsapp_groups;
CREATE POLICY "select_whatsapp_groups" ON whatsapp_groups FOR SELECT
  TO authenticated USING (is_club_member(whatsapp_groups.club_id));

DROP POLICY IF EXISTS "insert_whatsapp_groups" ON whatsapp_groups;
CREATE POLICY "insert_whatsapp_groups" ON whatsapp_groups FOR INSERT
  TO authenticated WITH CHECK (is_club_admin(whatsapp_groups.club_id));

DROP POLICY IF EXISTS "update_whatsapp_groups" ON whatsapp_groups;
CREATE POLICY "update_whatsapp_groups" ON whatsapp_groups FOR UPDATE
  TO authenticated USING (is_club_admin(whatsapp_groups.club_id)) WITH CHECK (is_club_admin(whatsapp_groups.club_id));

DROP POLICY IF EXISTS "delete_whatsapp_groups" ON whatsapp_groups;
CREATE POLICY "delete_whatsapp_groups" ON whatsapp_groups FOR DELETE
  TO authenticated USING (is_club_admin(whatsapp_groups.club_id));

-- ============================================================
-- POLICIES: contacts
-- ============================================================
DROP POLICY IF EXISTS "select_contacts" ON contacts;
CREATE POLICY "select_contacts" ON contacts FOR SELECT
  TO authenticated USING (is_club_member(contacts.club_id));

DROP POLICY IF EXISTS "insert_contacts" ON contacts;
CREATE POLICY "insert_contacts" ON contacts FOR INSERT
  TO authenticated WITH CHECK (is_club_admin(contacts.club_id));

DROP POLICY IF EXISTS "update_contacts" ON contacts;
CREATE POLICY "update_contacts" ON contacts FOR UPDATE
  TO authenticated USING (is_club_admin(contacts.club_id)) WITH CHECK (is_club_admin(contacts.club_id));

DROP POLICY IF EXISTS "delete_contacts" ON contacts;
CREATE POLICY "delete_contacts" ON contacts FOR DELETE
  TO authenticated USING (is_club_admin(contacts.club_id));

-- ============================================================
-- POLICIES: announcements
-- ============================================================
DROP POLICY IF EXISTS "select_announcements" ON announcements;
CREATE POLICY "select_announcements" ON announcements FOR SELECT
  TO authenticated USING (is_club_member(announcements.club_id));

DROP POLICY IF EXISTS "insert_announcements" ON announcements;
CREATE POLICY "insert_announcements" ON announcements FOR INSERT
  TO authenticated WITH CHECK (is_club_admin(announcements.club_id));

DROP POLICY IF EXISTS "update_announcements" ON announcements;
CREATE POLICY "update_announcements" ON announcements FOR UPDATE
  TO authenticated USING (is_club_admin(announcements.club_id)) WITH CHECK (is_club_admin(announcements.club_id));

DROP POLICY IF EXISTS "delete_announcements" ON announcements;
CREATE POLICY "delete_announcements" ON announcements FOR DELETE
  TO authenticated USING (is_club_admin(announcements.club_id));

-- ============================================================
-- POLICIES: notifications
-- ============================================================
DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (is_club_admin(notifications.club_id));

DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_club ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user ON rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_club ON polls(club_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_club ON announcements(club_id);

-- ============================================================
-- SEED DATA — Demo Club
-- ============================================================

INSERT INTO clubs (id, name, sport, description, qr_token, primary_color, accent_color, address)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
       'Tennis Club Olympique',
       'Tennis',
       'Bienvenue au Tennis Club Olympique — votre club de tennis convivial pour tous les niveaux et tous les âges.',
       'demo-tennis-club',
       '#1e3a8a',
       '#22c55e',
       '12 Avenue du Sport, 75016 Paris'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE qr_token = 'demo-tennis-club');

-- Categories
INSERT INTO categories (club_id, name, description, color, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Baby Tennis', '4-6 ans', '#f59e0b', 0
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Baby Tennis');

INSERT INTO categories (club_id, name, description, color, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jeunes', '7-17 ans', '#3b82f6', 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Jeunes');

INSERT INTO categories (club_id, name, description, color, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Adultes', '18 ans et plus', '#22c55e', 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Adultes');

INSERT INTO categories (club_id, name, description, color, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Compétition', 'Joueurs en compétition', '#ef4444', 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Compétition');

INSERT INTO categories (club_id, name, description, color, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Loisirs', 'Joueurs loisir', '#8b5cf6', 4
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Loisirs');

-- Links
INSERT INTO links (club_id, title, url, icon, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Site du club', 'https://tennis-club-olympique.fr', 'globe', 0
WHERE NOT EXISTS (SELECT 1 FROM links WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Site du club');

INSERT INTO links (club_id, title, url, icon, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Instagram', 'https://instagram.com/tennisclubolympique', 'instagram', 1
WHERE NOT EXISTS (SELECT 1 FROM links WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Instagram');

INSERT INTO links (club_id, title, url, icon, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fédération Française de Tennis', 'https://fft.fr', 'trophy', 2
WHERE NOT EXISTS (SELECT 1 FROM links WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Fédération Française de Tennis');

INSERT INTO links (club_id, title, url, icon, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Billetterie', 'https://tennis-club-olympique.fr/billets', 'ticket', 3
WHERE NOT EXISTS (SELECT 1 FROM links WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Billetterie');

-- Contacts
INSERT INTO contacts (club_id, name, role, phone, email, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jean Dupont', 'Président', '06 12 34 56 78', 'president@tco.fr', 0
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Jean Dupont');

INSERT INTO contacts (club_id, name, role, phone, email, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Marie Martin', 'Entraîneur', '06 23 45 67 89', 'entraineur@tco.fr', 1
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Marie Martin');

INSERT INTO contacts (club_id, name, role, phone, email, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sophie Bernard', 'Secrétariat', '01 45 67 89 01', 'secretariat@tco.fr', 2
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Sophie Bernard');

INSERT INTO contacts (club_id, name, role, phone, email, sort_order)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pierre Durand', 'Trésorier', '06 34 56 78 90', 'tresorier@tco.fr', 3
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Pierre Durand');

-- WhatsApp Groups
INSERT INTO whatsapp_groups (club_id, name, url)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Groupe Adultes', 'https://chat.whatsapp.com/adultes'
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_groups WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Groupe Adultes');

INSERT INTO whatsapp_groups (club_id, name, url)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Groupe Compétition', 'https://chat.whatsapp.com/competition'
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_groups WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Groupe Compétition');

INSERT INTO whatsapp_groups (club_id, name, url)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Groupe Jeunes', 'https://chat.whatsapp.com/jeunes'
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_groups WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Groupe Jeunes');

INSERT INTO whatsapp_groups (club_id, name, url)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Groupe Entraîneurs', 'https://chat.whatsapp.com/entraineurs'
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_groups WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND name = 'Groupe Entraîneurs');

-- Events
INSERT INTO events (club_id, title, description, event_date, location)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
       'Tournoi Interne du Samedi',
       'Tournoi interne du club ouvert à tous les membres. Matches en simple et double. Apportez votre raquette et votre bonne humeur !',
       '2026-10-24 14:00:00+00',
       'Tennis Club Olympique — Courts 1 à 4'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Tournoi Interne du Samedi');

INSERT INTO events (club_id, title, description, event_date, location)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
       'Entraînement Adultes',
       'Séance d''entraînement hebdomadaire pour le groupe adulte.',
       '2026-10-22 19:00:00+00',
       'Court Central'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Entraînement Adultes');

INSERT INTO events (club_id, title, description, event_date, location)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
       'Assemblée Générale',
       'Assemblée générale annuelle du club. Présentation du bilan et des projets. Vote important.',
       '2026-11-15 10:00:00+00',
       'Salle des fêtes du club'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Assemblée Générale');

-- Polls + Options
DO $$
DECLARE
  poll_id uuid;
BEGIN
  -- Check if poll already exists
  SELECT id INTO poll_id FROM polls WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND question = 'Quel jour préférez-vous pour l''entraînement ?';
  IF poll_id IS NULL THEN
    INSERT INTO polls (club_id, question, description)
    VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Quel jour préférez-vous pour l''entraînement ?', 'Aidez-nous à planifier les créneaux d''entraînement pour cette saison.')
    RETURNING id INTO poll_id;

    INSERT INTO poll_options (poll_id, label, sort_order) VALUES (poll_id, 'Lundi', 0);
    INSERT INTO poll_options (poll_id, label, sort_order) VALUES (poll_id, 'Mercredi', 1);
    INSERT INTO poll_options (poll_id, label, sort_order) VALUES (poll_id, 'Vendredi', 2);
    INSERT INTO poll_options (poll_id, label, sort_order) VALUES (poll_id, 'Samedi', 3);
  END IF;

  SELECT id INTO poll_id FROM polls WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND question = 'Organiser un repas de fin d''année ?';
  IF poll_id IS NULL THEN
    INSERT INTO polls (club_id, question, description)
    VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Organiser un repas de fin d''année ?', 'Donnez votre avis sur l''organisation d''un repas convivial de fin d''année.')
    RETURNING id INTO poll_id;

    INSERT INTO poll_options (poll_id, label, sort_order) VALUES (poll_id, 'Oui, avec plaisir !', 0);
    INSERT INTO poll_options (poll_id, label, sort_order) VALUES (poll_id, 'Pourquoi pas', 1);
    INSERT INTO poll_options (poll_id, label, sort_order) VALUES (poll_id, 'Non, pas cette fois', 2);
  END IF;
END $$;

-- Announcements
INSERT INTO announcements (club_id, title, content)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
       'Bienvenue dans votre club !',
       'Bienvenue sur ClubDoor ! Scannez le QR code à l''entrée du club pour accéder à toutes les informations : événements, sondages, contacts, groupes WhatsApp et bien plus.'
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Bienvenue dans votre club !');

INSERT INTO announcements (club_id, title, content)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
       'Nouveau créneau d''entraînement',
       'À partir de la semaine prochaine, un nouveau créneau d''entraînement est disponible le mercredi soir de 19h à 21h. Inscrivez-vous vite, places limitées !'
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Nouveau créneau d''entraînement');

INSERT INTO announcements (club_id, title, content)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
       'Cotisations 2026',
       'N''oubliez pas de régler votre cotisation annuelle avant le 31 octobre. Le paiement se fait auprès du trésorier ou en ligne sur le site du club.'
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE club_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND title = 'Cotisations 2026');
