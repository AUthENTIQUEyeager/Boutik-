-- ============================================================================
-- Boutik+ — adding subscription plans and payment tracking
-- ============================================================================

-- Add subscription columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'essential', 'professional')),
ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create table for payment transactions (optional, for tracking)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- amount in FCFA
  currency TEXT NOT NULL DEFAULT 'XOF',
  provider TEXT NOT NULL DEFAULT 'moneyfusion',
  provider_payment_id TEXT, -- ID from MoneyFusion
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded', 'cancelled')),
  plan TEXT NOT NULL CHECK (plan IN ('essential', 'professional')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_shop ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_plan ON payments(plan);

-- ============================================================================
-- End of migration
-- ============================================================================