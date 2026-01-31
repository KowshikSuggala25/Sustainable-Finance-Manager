-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_name text NOT NULL,
    account_number text,
    balance numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
-- Enable Row Level Security (RLS) for accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
-- Create RLS policies for accounts
CREATE POLICY "Users can view their own accounts" ON public.accounts FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own accounts" ON public.accounts FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own accounts" ON public.accounts FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts (user_id);
-- Create transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    to_account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    status text DEFAULT 'pending',
    otp_verified boolean DEFAULT false,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);
-- Enable Row Level Security (RLS) for transfers
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
-- Create RLS policies for transfers
CREATE POLICY "Users can view their own transfers" ON public.transfers FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transfers" ON public.transfers FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transfers" ON public.transfers FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transfers" ON public.transfers FOR DELETE USING (auth.uid() = user_id);
-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON public.transfers (user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON public.transfers (from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON public.transfers (to_account_id);
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger to automatically update updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE
UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();