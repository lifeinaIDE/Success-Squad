-- ============================================================
-- 008_admin_content_and_messages.sql
-- Success Squad: Content Management & Contact Messages Schema
-- ============================================================

-- 1. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  tag         TEXT DEFAULT 'Event',
  date        TEXT NOT NULL,
  description TEXT,
  meta        TEXT,
  btn_label   TEXT DEFAULT 'Register Now',
  btn_class   TEXT DEFAULT 'btn btn-primary',
  highlight   BOOLEAN DEFAULT false,
  is_past     BOOLEAN DEFAULT false,
  year        TEXT DEFAULT '2026',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'core_member', -- 'leadership' | 'domain_lead' | 'core_member'
  bio         TEXT,
  image       TEXT,
  photo_url   TEXT,
  linkedin    TEXT,
  email       TEXT,
  phone       TEXT,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Startups Table
CREATE TABLE IF NOT EXISTS public.startups (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  logo_text     TEXT,
  tag           TEXT,
  description   TEXT,
  website       TEXT,
  website_label TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. Gallery Items Table
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  accent_title TEXT,
  year         TEXT,
  category     TEXT DEFAULT 'album', -- 'album' | 'memory'
  image_url    TEXT,
  alt_text     TEXT,
  slides_count INTEGER DEFAULT 1,
  slides       JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 5. Contact Messages Table (Submitted from "Get Involved" page)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'unread', -- 'unread' | 'read' | 'replied' | 'archived'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Disable RLS or set permissive policies for seamless operation
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

-- 7. Seed Initial Data for Connexaa Startup (if empty)
INSERT INTO public.startups (id, name, logo_text, tag, description, website, website_label)
VALUES (
  'connexaa',
  'Connexaa',
  'CX',
  'Networking Platform',
  'An innovative digital platform designed to seamlessly connect people, ideas, and opportunities. Empowering the community through strategic networking.',
  'https://connexaa.in',
  'Visit connexaa.in ↗'
)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Initial Leadership Members (if empty)
INSERT INTO public.team_members (id, name, role, category, bio, photo_url, linkedin)
VALUES
  ('kunal', 'Kunal Singh Rajput', 'President', 'leadership', 'Third year CS student. Building startup. Passionate about deep tech and impact investing.', '/images/team/kunal-singh-rajput.png', 'https://www.linkedin.com/in/21ksr/'),
  ('samruddhi', 'Samruddhi Karale', 'Vice President', 'leadership', 'Design thinker and community builder. Leads all creative and outreach initiatives.', '/images/team/samruddhi-karale.png', 'https://www.linkedin.com/in/samruddhi07karale/')
ON CONFLICT (id) DO NOTHING;
