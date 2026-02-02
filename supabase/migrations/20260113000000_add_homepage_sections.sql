-- Homepage sections management tables

-- Create homepage_sections table
CREATE TABLE IF NOT EXISTS homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create homepage_section_articles table (junction table)
CREATE TABLE IF NOT EXISTS homepage_section_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES homepage_sections(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(section_id, article_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_homepage_sections_display_order ON homepage_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_homepage_section_articles_section_id ON homepage_section_articles(section_id);
CREATE INDEX IF NOT EXISTS idx_homepage_section_articles_article_id ON homepage_section_articles(article_id);

-- Insert default sections
INSERT INTO homepage_sections (section_key, title, display_order, is_active) VALUES
  ('popular', '人気の記事', 1, true),
  ('new', '新着記事', 2, true),
  ('editor_picks', '編集部おすすめ', 3, true)
ON CONFLICT (section_key) DO NOTHING;

-- Enable RLS
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_section_articles ENABLE ROW LEVEL SECURITY;

-- RLS policies for homepage_sections (public read, admin write)
CREATE POLICY "Anyone can view homepage sections"
  ON homepage_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage homepage sections"
  ON homepage_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- RLS policies for homepage_section_articles (public read, admin write)
CREATE POLICY "Anyone can view homepage section articles"
  ON homepage_section_articles FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage homepage section articles"
  ON homepage_section_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );
