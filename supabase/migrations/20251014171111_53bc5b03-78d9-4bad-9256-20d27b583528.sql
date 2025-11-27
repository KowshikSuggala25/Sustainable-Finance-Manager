-- Add is_hidden column to transactions with default false
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Create index for faster filtering by hidden state and user
CREATE INDEX IF NOT EXISTS idx_transactions_user_hidden ON public.transactions (user_id, is_hidden);
