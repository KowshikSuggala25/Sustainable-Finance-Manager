import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
  user_id: string;
  is_hidden?: boolean;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_hidden', false)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        title: item.title,
        amount: item.amount,
        type: item.type as 'income' | 'expense',
        category: item.category || 'Other',
        date: (item as any).date || new Date().toISOString(),
        notes: (item as any).notes || '',
        user_id: item.user_id,
        is_hidden: item.is_hidden || false
      })) || [];
      
      setTransactions(transformedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Transform the returned data to match our interface
      const transformedData = {
        id: data.id,
        title: data.title,
        amount: data.amount,
        type: data.type as 'income' | 'expense',
        category: data.category || 'Other',
        date: (data as any).date || new Date().toISOString(),
        notes: (data as any).notes || '',
        user_id: data.user_id
      };
      
      setTransactions(prev => [transformedData, ...prev]);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, [user]);

  const getRecentTransactions = useCallback((limit: number = 8) => {
    return transactions.slice(0, limit);
  }, [transactions]);

  const getIncomeTransactions = useCallback(() => {
    return transactions.filter(t => t.type === 'income');
  }, [transactions]);

  const getExpenseTransactions = useCallback(() => {
    return transactions.filter(t => t.type === 'expense');
  }, [transactions]);

  const getTotalIncome = useCallback(() => {
    return getIncomeTransactions().reduce((sum, t) => sum + t.amount, 0);
  }, [getIncomeTransactions]);

  const getTotalExpenses = useCallback(() => {
    return getExpenseTransactions().reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [getExpenseTransactions]);

  const getSavingsTransactions = useCallback(() => {
    return transactions.filter(t => 
      t.category?.toLowerCase() === 'savings' || 
      (t.category?.toLowerCase() === 'other expenses' && 
       (t.title?.toLowerCase().includes('savings') || t.notes?.toLowerCase().includes('savings')))
    );
  }, [transactions]);

  const getTotalSavings = useCallback(() => {
    return getSavingsTransactions().reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [getSavingsTransactions]);

  const getCategoryData = useCallback(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    getExpenseTransactions().forEach(transaction => {
      const category = transaction.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(transaction.amount);
    });

    return Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
    }));
  }, [getExpenseTransactions]);

  const fetchHiddenTransactions = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_hidden', true)
        .order('date', { ascending: false });

      if (error) throw error;
      
      const transformedData = data?.map(item => ({
        id: item.id,
        title: item.title,
        amount: item.amount,
        type: item.type as 'income' | 'expense',
        category: item.category || 'Other',
        date: (item as any).date || new Date().toISOString(),
        notes: (item as any).notes || '',
        user_id: item.user_id,
        is_hidden: item.is_hidden || false
      })) || [];
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching hidden transactions:', error);
      return [];
    }
  }, [user]);

  const hideTransaction = useCallback(async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_hidden: true })
        .eq('id', transactionId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Remove from visible transactions
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Error hiding transaction:', error);
      throw error;
    }
  }, [user]);

  const unhideTransaction = useCallback(async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_hidden: false })
        .eq('id', transactionId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Refetch to update visible list
      await fetchTransactions();
    } catch (error) {
      console.error('Error unhiding transaction:', error);
      throw error;
    }
  }, [user, fetchTransactions]);

  return {
    transactions,
    loading,
    addTransaction,
    getRecentTransactions,
    getIncomeTransactions,
    getExpenseTransactions,
    getSavingsTransactions,
    getTotalIncome,
    getTotalExpenses,
    getTotalSavings,
    getCategoryData,
    refetch: fetchTransactions,
    fetchHiddenTransactions,
    hideTransaction,
    unhideTransaction
  };
};