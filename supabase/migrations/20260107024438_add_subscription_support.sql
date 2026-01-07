/*
  # Add Subscription Support to Users Table

  1. New Columns
    - `is_premium` (boolean, default false) - Whether user has active premium subscription
    - `stripe_customer_id` (text, unique) - Stripe Customer ID for subscription management
    - `stripe_subscription_id` (text) - Active Stripe Subscription ID
    - `subscription_status` (text) - Subscription status: 'active', 'canceled', 'past_due'
    - `subscription_started_at` (timestamptz) - When subscription started
    - `subscription_current_period_start` (timestamptz) - Current billing period start
    - `subscription_current_period_end` (timestamptz) - Current billing period end
    - `subscription_canceled_at` (timestamptz) - When subscription was canceled

  2. Changes
    - Add columns to existing `users` table with appropriate defaults
    - Add unique constraint on stripe_customer_id for efficient lookups
    - Add index on subscription_status for efficient querying

  3. Security
    - RLS remains enabled on users table
    - Existing policies apply to new columns
*/

DO $$
BEGIN
  -- Add is_premium column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE users ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  -- Add stripe_customer_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id text UNIQUE;
  END IF;

  -- Add stripe_subscription_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_subscription_id text;
  END IF;

  -- Add subscription_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_status text DEFAULT 'none';
  END IF;

  -- Add subscription_started_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_started_at'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_started_at timestamptz;
  END IF;

  -- Add subscription_current_period_start column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_current_period_start'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_current_period_start timestamptz;
  END IF;

  -- Add subscription_current_period_end column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_current_period_end'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_current_period_end timestamptz;
  END IF;

  -- Add subscription_canceled_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_canceled_at'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_canceled_at timestamptz;
  END IF;
END $$;

-- Create index for efficient subscription status queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);