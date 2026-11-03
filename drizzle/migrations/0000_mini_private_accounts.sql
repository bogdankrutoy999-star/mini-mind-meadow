CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 username text NOT NULL CHECK (char_length(trim(username)) BETWEEN 1 AND 80),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE FUNCTION public.create_mini_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles (id, username) VALUES (NEW.id, left(coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'username'), ''), 'Mini user'), 80));
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_mini_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER mini_profile_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_mini_profile();
CREATE TABLE public.chat_threads (
 id text NOT NULL CHECK (char_length(id) BETWEEN 1 AND 64),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
 messages jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(messages) = 'array' AND jsonb_array_length(messages) <= 100),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY threads_read_own ON public.chat_threads FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY threads_insert_own ON public.chat_threads FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY threads_update_own ON public.chat_threads FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY threads_delete_own ON public.chat_threads FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE INDEX chat_threads_owner_updated ON public.chat_threads (user_id, updated_at DESC);