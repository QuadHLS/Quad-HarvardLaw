-- Add onboarding_count_year to track yearly reset (Aug 1 - Jul 31 cycle)
-- Only includes step 4; earlier steps already applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'onboarding_count_year'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN onboarding_count_year integer DEFAULT date_part('year', now())::int;
  END IF;
END $$;

