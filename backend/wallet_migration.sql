-- ==============================================================================
-- STANDALONE SQL MIGRATION: Fixed Two-Category Wallet System (Cash & Online)
-- Target Database: PostgreSQL / Supabase
-- Safety Note: DO NOT EXECUTE AUTOMATICALLY IN PRODUCTION WITHOUT EXPLICIT APPROVAL.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PRE-MIGRATION VERIFICATION (READ-ONLY)
-- Run these queries first to record existing state:
-- ------------------------------------------------------------------------------
-- 1. Check existing users count and income:
-- SELECT count(*), coalesce(sum(income), 0) FROM public.users;
--
-- 2. Check existing transactions count and spending:
-- SELECT count(*), coalesce(sum(amount), 0) FROM public.transactions;
--
-- 3. Verify if wallets table already exists:
-- SELECT to_regclass('public.wallets');
-- ------------------------------------------------------------------------------

BEGIN;

-- 1. CREATE WALLETS TABLE (Exactly Two Fixed Categories: 'cash' and 'online')
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('cash', 'online')),
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_wallet_type UNIQUE (user_id, wallet_type)
);

-- Index for fast user wallet queries
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);

-- 2. ROW-LEVEL SECURITY POLICIES (Supabase Auth Integration)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallets' AND policyname = 'Users can view and manage own wallets'
    ) THEN
        CREATE POLICY "Users can view and manage own wallets"
            ON public.wallets FOR ALL
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallets' AND policyname = 'Service role full access on wallets'
    ) THEN
        CREATE POLICY "Service role full access on wallets"
            ON public.wallets FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- 3. ADD PAYMENT SOURCE TO TRANSACTIONS
-- Adds payment_source column ('cash' or 'online') with default 'cash'
ALTER TABLE public.transactions 
    ADD COLUMN IF NOT EXISTS payment_source TEXT DEFAULT 'cash' CHECK (payment_source IN ('cash', 'online'));

-- 4. SEED / INITIALIZE WALLETS FOR EXISTING USERS (Idempotent & Safe)
-- Initializes exactly two wallets ('cash' and 'online') per user without double counting
INSERT INTO public.wallets (id, user_id, wallet_type, balance, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    u.id,
    'cash',
    -- Default initial cash allocation: 50% of available unspent income, rounded to 2 decimal places
    ROUND(GREATEST(0, (u.income - COALESCE(tx_sum.total_spent, 0)) * 0.50), 2),
    NOW(),
    NOW()
FROM public.users u
LEFT JOIN (
    SELECT user_id, SUM(amount) AS total_spent 
    FROM public.transactions 
    GROUP BY user_id
) tx_sum ON tx_sum.user_id = u.id
ON CONFLICT (user_id, wallet_type) DO NOTHING;

INSERT INTO public.wallets (id, user_id, wallet_type, balance, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    u.id,
    'online',
    -- Default initial online allocation: remaining 50% of available unspent income
    ROUND(GREATEST(0, (u.income - COALESCE(tx_sum.total_spent, 0)) * 0.50), 2),
    NOW(),
    NOW()
FROM public.users u
LEFT JOIN (
    SELECT user_id, SUM(amount) AS total_spent 
    FROM public.transactions 
    GROUP BY user_id
) tx_sum ON tx_sum.user_id = u.id
ON CONFLICT (user_id, wallet_type) DO NOTHING;

COMMIT;

-- ------------------------------------------------------------------------------
-- POST-MIGRATION VALIDATION QUERIES
-- Run these queries after applying migration to verify correctness:
-- ------------------------------------------------------------------------------
-- 1. Verify exactly 2 wallets per user:
-- SELECT user_id, count(wallet_type) AS wallet_count, sum(balance) AS total_balance
-- FROM public.wallets
-- GROUP BY user_id;
-- (Expected: wallet_count = 2 for every user)
--
-- 2. Verify total balance equals cash + online:
-- SELECT 
--     user_id,
--     SUM(CASE WHEN wallet_type = 'cash' THEN balance ELSE 0 END) AS cash_balance,
--     SUM(CASE WHEN wallet_type = 'online' THEN balance ELSE 0 END) AS online_balance,
--     SUM(balance) AS total_balance
-- FROM public.wallets
-- GROUP BY user_id;
--
-- 3. Verify transactions payment_source column:
-- SELECT count(*) FROM public.transactions WHERE payment_source IS NULL;
-- (Expected: 0)
-- ------------------------------------------------------------------------------

-- ------------------------------------------------------------------------------
-- ROLLBACK SCRIPT (IF EVER REQUIRED)
-- ------------------------------------------------------------------------------
-- BEGIN;
-- ALTER TABLE public.transactions DROP COLUMN IF EXISTS payment_source;
-- DROP TABLE IF EXISTS public.wallets CASCADE;
-- COMMIT;
-- ------------------------------------------------------------------------------
