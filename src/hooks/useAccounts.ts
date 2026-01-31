import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Account {
  id: string;
  user_id: string;
  account_name: string;
  account_number: string | null;
  balance: number;
  associated_email?: string;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  status: string;
  otp_verified: boolean;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts((data as Account[]) || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTransfers = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransfers((data as Transfer[]) || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
    fetchTransfers();
  }, [fetchAccounts, fetchTransfers]);

  const addAccount = useCallback(async (accountData: { account_name: string; account_number?: string; balance?: number; associated_email?: string }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          ...accountData,
          user_id: user.id,
          balance: accountData.balance || 0,
          associated_email: accountData.associated_email
        }])
        .select()
        .single();

      if (error) throw error;
      
      setAccounts(prev => [data as Account, ...prev]);
      toast({
        title: "Account Added",
        description: `${accountData.account_name} has been created successfully.`,
      });
      return data;
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "Error",
        description: "Failed to add account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  const initiateTransfer = useCallback(async (transferData: {
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description?: string;
    recipient_email: string;
  }) => {
    if (!user) return;

    try {
      // First, verify that recipient email exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', transferData.recipient_email)
        .single();

      if (profileError || !profileData) {
        toast({
          title: "Email Not Found",
          description: "The recipient email is not registered in the system.",
          variant: "destructive",
        });
        throw new Error("Recipient email not found");
      }

      // Call edge function to initiate transfer and send OTP to recipient email
      const { data, error } = await supabase.functions.invoke('initiate-transfer', {
        body: {
          ...transferData,
          recipient_user_id: profileData.id
        }
      });

      if (error) throw error;
      
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${transferData.recipient_email}`,
      });
      
      await fetchTransfers();
      return data;
    } catch (error: any) {
      console.error('Error initiating transfer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate transfer.",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast, fetchTransfers]);

  const verifyTransferOTP = useCallback(async (transferId: string, otp: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-transfer-otp', {
        body: { transferId, otp }
      });

      if (error) throw error;

      if (data.verified) {
        toast({
          title: "Transfer Completed",
          description: "Your transfer has been completed successfully!",
        });
        await fetchAccounts();
        await fetchTransfers();
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
        description: error.message || "Failed to verify OTP.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [toast, fetchAccounts, fetchTransfers]);

  const updateAccountBalance = useCallback(async (accountId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', accountId);

      if (error) throw error;
      await fetchAccounts();
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      
      setAccounts(prev => prev.filter(a => a.id !== accountId));
      toast({
        title: "Account Deleted",
        description: "Account has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  return {
    accounts,
    transfers,
    loading,
    addAccount,
    initiateTransfer,
    verifyTransferOTP,
    updateAccountBalance,
    deleteAccount,
    refetch: fetchAccounts,
    refetchTransfers: fetchTransfers
  };
};
