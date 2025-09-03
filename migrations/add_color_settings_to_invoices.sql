-- Add color_settings column to rental_invoices table
-- This column will store JSON data for receipt styling options

ALTER TABLE rental_invoices 
ADD COLUMN color_settings JSONB DEFAULT NULL;

-- Add comment to explain the column purpose
COMMENT ON COLUMN rental_invoices.color_settings IS 'JSON object containing color theme settings for receipt styling (header_bg, header_text, total_bg, total_text, theme_name)';

-- Example of the JSON structure:
-- {
--   "header_bg": "#10b981",
--   "header_text": "#ffffff", 
--   "total_bg": "#059669",
--   "total_text": "#ffffff",
--   "theme_name": "Green Theme"
-- }
