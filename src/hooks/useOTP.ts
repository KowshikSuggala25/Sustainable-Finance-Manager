import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOTP = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendOTP = async (mobile: string) => {
    setIsLoading(true);
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Call edge function to send SMS
      const { error } = await supabase.functions.invoke('send-otp-sms', {
        body: {
          mobile,
          otp,
          expiresAt: expiresAt.toISOString()
        }
      });

      if (error) throw error;

      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${mobile}`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (mobile: string, otp: string, userId: string) => {
    setIsLoading(true);
    try {
      // Verify OTP through edge function
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          mobile,
          otp,
          userId
        }
      });

      if (error) throw error;

      if (data.verified) {
        toast({
          title: "Success",
          description: "Mobile number verified successfully!",
        });
        return { success: true };
      } else {
        toast({
          title: "Invalid OTP",
          description: "Please check your code and try again.",
          variant: "destructive",
        });
        return { success: false };
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendOTP,
    verifyOTP,
    isLoading
  };
};