/*
  # GrayMall Database Schema

  ## Overview
  Complete database schema for GrayMall - a paid article marketplace platform.
  
  ## New Tables
  
  ### 1. `users` (User profiles)
    - `id` (uuid, primary key) - Links to auth.users
    - `email` (text, unique) - User email address
    - `display_name` (text) - Public display name
    - `is_admin` (boolean) - Admin privileges flag
    - `can_publish` (boolean) - Can create/sell articles flag
    - `affiliate_code` (text, unique nullable) - Unique affiliate tracking code
    - `created_at` (timestamptz) - Account creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. `articles` (Article content and metadata)
    - `id` (uuid, primary key) - Article identifier
    - `author_id` (uuid, foreign key) - References users.id
    - `title` (text) - Article title
    - `slug` (text, unique) - URL-friendly identifier
    - `excerpt` (text) - Free preview text
    - `content` (text) - Full article content (HTML/JSON)
    - `price` (integer) - Price in yen
    - `is_subscription_product` (boolean) - Requires subscription vs one-off
    - `cover_image_url` (text nullable) - Neutral eyecatch image
    - `status` (text) - Workflow status: draft, pending_review, published, rejected
    - `admin_comment` (text nullable) - Admin feedback on rejection
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. `orders` (One-off article purchases)
    - `id` (uuid, primary key) - Order identifier
    - `buyer_id` (uuid, foreign key) - References users.id
    - `article_id` (uuid, foreign key) - References articles.id
    - `author_id` (uuid, foreign key) - References users.id
    - `affiliate_user_id` (uuid nullable, foreign key) - References users.id
    - `amount` (integer) - Purchase amount in yen
    - `status` (text) - Payment status: pending, paid, failed, refunded
    - `payment_provider` (text) - Payment provider name (e.g., "stripe")
    - `payment_session_id` (text nullable) - Provider session/transaction ID
    - `created_at` (timestamptz) - Order creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
  
  ### 4. `subscriptions` (Author subscriptions)
    - `id` (uuid, primary key) - Subscription identifier
    - `subscriber_id` (uuid, foreign key) - References users.id
    - `author_id` (uuid, foreign key) - References users.id
    - `status` (text) - Subscription status: active, canceled, expired
    - `current_period_start` (timestamptz) - Current billing period start
    - `current_period_end` (timestamptz) - Current billing period end
    - `stripe_subscription_id` (text nullable) - Stripe subscription ID
    - `created_at` (timestamptz) - Subscription creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
  
  ### 5. `payouts` (Payment tracking for authors/affiliates)
    - `id` (uuid, primary key) - Payout identifier
    - `user_id` (uuid, foreign key) - References users.id
    - `period` (text) - Payout period (e.g., "2025-01")
    - `amount` (integer) - Payout amount in yen
    - `status` (text) - Payout status: scheduled, paid
    - `paid_at` (timestamptz nullable) - Payment completion timestamp
    - `created_at` (timestamptz) - Payout record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  
  All tables have Row Level Security (RLS) enabled with appropriate policies:
  
  - **users**: Users can read their own profile, admins can read all
  - **articles**: Public can read published articles, authors manage their own
  - **orders**: Users can read their own orders, authors can read orders for their articles
  - **subscriptions**: Users can read their own subscriptions, authors can read subscriptions to them
  - **payouts**: Users can read their own payouts, admins can manage all
  
  ## Indexes
  
  Performance indexes on frequently queried columns:
  - articles: slug, author_id, status
  - orders: buyer_id, article_id, status
  - subscriptions: subscriber_id, author_id, status
*/

-- Create users profile table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  is_admin boolean DEFAULT false,
  can_publish boolean DEFAULT false,
  affiliate_code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  is_subscription_product boolean DEFAULT false,
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected')),
  admin_comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliate_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_provider text NOT NULL DEFAULT 'stripe',
  payment_session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paid')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_article_id ON orders(article_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber_id ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_author_id ON subscriptions(author_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON users(affiliate_code);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for articles table
CREATE POLICY "Anyone can read published articles"
  ON articles FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "Authors can read own articles"
  ON articles FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins can read all articles"
  ON articles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Authors can create articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND can_publish = true
    )
  );

CREATE POLICY "Authors can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Admins can update all articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Authors can delete own draft articles"
  ON articles FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() AND status = 'draft');

-- RLS Policies for orders table
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Authors can read orders for their articles"
  ON orders FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "System can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (subscriber_id = auth.uid());

CREATE POLICY "Authors can read subscriptions to them"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can create subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (subscriber_id = auth.uid());

CREATE POLICY "System can update subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payouts table
CREATE POLICY "Users can read own payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can create payouts"
  ON payouts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update payouts"
  ON payouts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON articles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON orders;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON subscriptions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON payouts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();