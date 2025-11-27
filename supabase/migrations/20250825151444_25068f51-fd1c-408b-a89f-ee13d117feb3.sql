-- Add mobile_number column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- Add budget column to profiles table with default value 0
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0;

-- Add OTP-related columns for verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS otp_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT FALSE;