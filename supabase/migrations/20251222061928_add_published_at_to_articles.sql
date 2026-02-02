/*
  # Add Published At Column to Articles

  1. Changes
    - Add `published_at` (timestamptz nullable) column to articles table
    - This tracks when an article was first published
    - Set published_at for existing published articles to their created_at

  2. Notes
    - Nullable because draft articles don't have a published date yet
    - When status changes to 'published', this should be set to now()
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE articles ADD COLUMN published_at timestamptz;

    -- Set published_at for existing published articles
    UPDATE articles
    SET published_at = created_at
    WHERE status = 'published' AND published_at IS NULL;
  END IF;
END $$;
