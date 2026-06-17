
ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#22e6ff',
  ADD COLUMN IF NOT EXISTS accent_color_2 text NOT NULL DEFAULT '#ff3df0',
  ADD COLUMN IF NOT EXISTS theme_mode text NOT NULL DEFAULT 'dark' CHECK (theme_mode IN ('dark','light')),
  ADD COLUMN IF NOT EXISTS contrast_level int NOT NULL DEFAULT 100 CHECK (contrast_level BETWEEN 70 AND 140);

ALTER TABLE public.shop_settings ALTER COLUMN shop_name SET DEFAULT 'MOBILE GALARY';
UPDATE public.shop_settings SET shop_name = 'MOBILE GALARY' WHERE shop_name = 'Apple Store';
