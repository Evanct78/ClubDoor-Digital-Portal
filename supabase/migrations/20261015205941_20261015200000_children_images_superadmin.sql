/*
# Children, Images, and Super-Admin

## Overview
Three additions to the ClubDoor schema:
1. A `children` table so members can add minor children linked to their profile.
2. `image_url` columns on `events`, `announcements`, and `whatsapp_groups` so admins can attach images.
3. A `is_super_admin` boolean on `profiles` to grant a user platform-wide visibility (all clubs + member counts).

## New Tables
- `children` — minor children linked to a parent member and a club

## Modified Tables
- `events` — added `image_url text`
- `announcements` — added `image_url text`
- `whatsapp_groups` — added `image_url text`
- `profiles` — added `is_super_admin boolean DEFAULT false`

## Security
- RLS enabled on `children` with parent + admin + super-admin policies
- Super-admin can read all clubs and club_members
- Storage bucket `club-images` created as public
*/

-- ============================================================
-- ADD image_url COLUMNS
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
    ALTER TABLE events ADD COLUMN image_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'image_url') THEN
    ALTER TABLE announcements ADD COLUMN image_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_groups' AND column_name = 'image_url') THEN
    ALTER TABLE whatsapp_groups ADD COLUMN image_url text;
  END IF;
END $$;

-- ============================================================
-- ADD is_super_admin TO profiles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_super_admin') THEN
    ALTER TABLE profiles ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- CREATE children TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_children" ON children;
CREATE POLICY "select_own_children" ON children FOR SELECT
  TO authenticated USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "select_club_children" ON children;
CREATE POLICY "select_club_children" ON children FOR SELECT
  TO authenticated USING (is_club_admin(children.club_id));

DROP POLICY IF EXISTS "select_superadmin_children" ON children;
CREATE POLICY "select_superadmin_children" ON children FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

DROP POLICY IF EXISTS "insert_own_children" ON children;
CREATE POLICY "insert_own_children" ON children FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "update_own_children" ON children;
CREATE POLICY "update_own_children" ON children FOR UPDATE
  TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "delete_own_children" ON children;
CREATE POLICY "delete_own_children" ON children FOR DELETE
  TO authenticated USING (auth.uid() = parent_id);

-- ============================================================
-- SUPER-ADMIN POLICIES: allow reading all clubs and club_members
-- ============================================================
DROP POLICY IF EXISTS "select_all_clubs_superadmin" ON clubs;
CREATE POLICY "select_all_clubs_superadmin" ON clubs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

DROP POLICY IF EXISTS "select_all_club_members_superadmin" ON club_members;
CREATE POLICY "select_all_club_members_superadmin" ON club_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_club ON children(club_id);

-- ============================================================
-- SET evan cathala AS SUPER-ADMIN
-- ============================================================
UPDATE profiles SET is_super_admin = true WHERE email = 'evancathala.ec@gmail.com';

-- ============================================================
-- STORAGE BUCKET for club images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-images', 'club-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "upload_club_images" ON storage.objects;
CREATE POLICY "upload_club_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'club-images');

DROP POLICY IF EXISTS "read_club_images" ON storage.objects;
CREATE POLICY "read_club_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'club-images');

DROP POLICY IF EXISTS "delete_club_images" ON storage.objects;
CREATE POLICY "delete_club_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'club-images');
