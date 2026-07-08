-- ============================================================================
-- Boutik+ — migration 003
-- Suivi mensuel du quota de l'assistant IA (réinitialisation automatique)
-- ============================================================================

alter table profiles
  add column if not exists ai_credits_reset_at date not null default current_date;

-- ai_credits_used existe déjà (réservé depuis la V1) ; on l'utilise maintenant
-- comme compteur de questions posées à l'assistant IA depuis ai_credits_reset_at.
