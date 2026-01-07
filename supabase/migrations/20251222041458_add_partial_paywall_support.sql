/*
  # Add Partial Paywall Support

  1. Changes
    - Add `has_partial_paywall` column to articles table
    - This enables articles to have content that is partially free and partially paid
    - The editor will insert a special marker (<!-- PAYWALL_BOUNDARY -->) in the content
    
  2. Notes
    - Default is false for backward compatibility
    - Existing articles remain unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'has_partial_paywall'
  ) THEN
    ALTER TABLE articles ADD COLUMN has_partial_paywall boolean NOT NULL DEFAULT false;
  END IF;
END $$;