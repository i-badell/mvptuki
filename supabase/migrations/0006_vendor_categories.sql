CREATE TABLE public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text NOT NULL,
  emoji      text NOT NULL,
  keywords   text[] NOT NULL DEFAULT '{}',
  sort_order int  NOT NULL DEFAULT 0
);

INSERT INTO public.categories (label, emoji, keywords, sort_order) VALUES
  ('Todos',   '🍽️', '{}',                              0),
  ('Burgers', '🍔', '{burger,hamburgue,smash}',         1),
  ('Street',  '🌮', '{taco,mexic,street}',              2),
  ('Pizza',   '🍕', '{pizza,fornac,napol}',             3),
  ('Ramen',   '🍜', '{ramen,noodle,asian}',             4),
  ('Vegano',  '🌱', '{vegan,vegano,plant,verde}',       5),
  ('Bebidas', '🍺', '{beer,cervez,drink,bebid,bar}',    6);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT USING (true);
