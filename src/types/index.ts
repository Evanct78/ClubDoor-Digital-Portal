export type Club = {
  id: string;
  name: string;
  sport: string;
  description: string | null;
  qr_token: string;
  primary_color: string;
  accent_color: string;
  address: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  avatar_url: string | null;
  bio: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_super_admin: boolean | null;
  created_at: string;
  updated_at: string;
};

export type ClubMember = {
  id: string;
  club_id: string;
  user_id: string;
  role: 'member' | 'admin';
  status: 'pending' | 'active' | 'inactive';
  joined_at: string;
};

export type Category = {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  created_at: string;
};

export type ClubEvent = {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  created_at: string;
};

export type Child = {
  id: string;
  parent_id: string;
  club_id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  category_id: string | null;
  created_at: string;
};

export type RSVP = {
  id: string;
  event_id: string;
  user_id: string;
  status: 'yes' | 'maybe' | 'no';
  created_at: string;
  updated_at: string;
};

export type Poll = {
  id: string;
  club_id: string;
  question: string;
  description: string | null;
  closes_at: string | null;
  created_at: string;
};

export type PollOption = {
  id: string;
  poll_id: string;
  label: string;
  sort_order: number;
};

export type PollVote = {
  id: string;
  poll_option_id: string;
  user_id: string;
  created_at: string;
};

export type Link = {
  id: string;
  club_id: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type WhatsAppGroup = {
  id: string;
  club_id: string;
  name: string;
  url: string;
  image_url: string | null;
  category_id: string | null;
  created_at: string;
};

export type Contact = {
  id: string;
  club_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  sort_order: number;
  created_at: string;
};

export type Announcement = {
  id: string;
  club_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  club_id: string;
  user_id: string | null;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
};
