-- Create color_themes table to store default color settings
-- This will allow users to save a default color theme that applies to all receipts

CREATE TABLE IF NOT EXISTS color_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  header_bg VARCHAR(7) NOT NULL, -- hex color code
  header_text VARCHAR(7) NOT NULL,
  total_bg VARCHAR(7) NOT NULL, 
  total_text VARCHAR(7) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comment to explain the table purpose
COMMENT ON TABLE color_themes IS 'Stores color theme presets for receipts. One theme can be set as default for all new receipts.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_color_themes_is_default ON color_themes(is_default);

-- Insert some default themes
INSERT INTO color_themes (name, header_bg, header_text, total_bg, total_text, is_default) VALUES
('Xanh Lá (Mặc định)', '#10b981', '#ffffff', '#059669', '#ffffff', true),
('Xanh Dương', '#3b82f6', '#ffffff', '#1d4ed8', '#ffffff', false),
('Tím', '#8b5cf6', '#ffffff', '#7c3aed', '#ffffff', false),
('Đỏ', '#ef4444', '#ffffff', '#dc2626', '#ffffff', false),
('Cam', '#f97316', '#ffffff', '#ea580c', '#ffffff', false);

-- Create trigger to ensure only one default theme
CREATE OR REPLACE FUNCTION ensure_single_default_theme()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Set all other themes to not default
    UPDATE color_themes SET is_default = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_theme
  BEFORE UPDATE ON color_themes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_theme();
