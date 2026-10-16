/*
# Create club_subscriptions table

1. New Tables
- `club_subscriptions` — stores the subscription status for each club
  - `id` (uuid, primary key)
  - `club_id` (uuid, foreign key to clubs)
  - `plan` (text: 'full' = 29€/mois complete tool, 'module' = 14.99€/mois per module)
  - `status` (text: 'active', 'canceled', 'past_due', 'trialing')
  - `stripe_customer_id` (text, nullable)
  - `stripe_subscription_id` (text, nullable)
  - `active_modules` (text array: which content modules are enabled for 'module' plan)
  - `current_period_end` (timestamptz, nullable)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `club_subscriptions`.
- Admins of a club can read their club's subscription.
- Only the edge function (service role) can insert/update/delete.
*/

CREATE TABLE IF NOT EXISTS club_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'full' CHECK (plan IN ('full', 'module')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'inactive')),
  stripe_customer_id text,
  stripe_subscription_id text,
  active_modules text[] NOT NULL DEFAULT '{}',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (club_id)
);

ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins of a club can read their subscription
DROP POLICY IF EXISTS "select_club_subscriptions" ON club_subscriptions;
CREATE POLICY "select_club_subscriptions"
ON club_subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_subscriptions.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role = 'admin'
    AND club_members.status = 'active'
  )
);

-- Only service role can insert/update (via edge function)
DROP POLICY IF EXISTS "insert_club_subscriptions" ON club_subscriptions;
CREATE POLICY "insert_club_subscriptions"
ON club_subscriptions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_subscriptions.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role = 'admin'
    AND club_members.status = 'active'
  )
);

DROP POLICY IF EXISTS "update_club_subscriptions" ON club_subscriptions;
CREATE POLICY "update_club_subscriptions"
ON club_subscriptions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_subscriptions.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role = 'admin'
    AND club_members.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_subscriptions.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role = 'admin'
    AND club_members.status = 'active'
  )
);
