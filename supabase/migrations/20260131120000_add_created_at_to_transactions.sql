-- Add created_at column to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
-- Update existing records to use their date field as created_at
UPDATE public.transactions
SET created_at = date
WHERE created_at IS NULL;
-- Create index for faster queries on created_at
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at);