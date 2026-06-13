REVOKE EXECUTE ON FUNCTION public.handle_user_skills_changed() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_user_skills_changed() FROM authenticated;

-- Missing FK index on skill_exchanges.skill_id
CREATE INDEX IF NOT EXISTS idx_skill_exchanges_skill ON public.skill_exchanges (skill_id);
