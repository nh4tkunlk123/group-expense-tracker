import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  created_at: string;
}

export interface TransactionSplit {
  id: string;
  transaction_id: string;
  user_id: string;
  amount_owed: number;
}

// Extracted from the join
export interface FullTransaction extends Transaction {
  splits: TransactionSplit[];
}

interface DebtContextType {
  users: User[];
  transactions: FullTransaction[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (name: string) => Promise<void>;
  addTransaction: (description: string, amount: number, paidBy: string, splitAmong: { userId: string, amount: number }[]) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getBalance: (userA: string, userB: string) => number; // Positive means userB owes userA. Negative means userA owes userB.
  getNetBalance: (userId: string) => number; // Total net balance of a user (positive means people owe them)
  loading: boolean;
}

const DebtContext = createContext<DebtContextType | undefined>(undefined);

export const useDebtContext = () => {
  const context = useContext(DebtContext);
  if (!context) throw new Error('useDebtContext must be used within a DebtProvider');
  return context;
};

export const DebtProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<FullTransaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('debt-current-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('debt-current-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('debt-current-user');
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) setUsers(usersData);

      const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      const { data: splitsData } = await supabase.from('transaction_splits').select('*');

      if (txData && splitsData) {
        const fullTxs = txData.map(tx => ({
          ...tx,
          splits: splitsData.filter(s => s.transaction_id === tx.id)
        }));
        setTransactions(fullTxs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime changes
    const usersSub = supabase.channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchData)
      .subscribe();

    const txSub = supabase.channel('public:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData)
      .subscribe();

    const splitsSub = supabase.channel('public:transaction_splits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_splits' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(txSub);
      supabase.removeChannel(splitsSub);
    };
  }, []);

  const addUser = async (name: string) => {
    const { data, error } = await supabase.from('users').insert([{ name }]).select().single();
    if (error) throw error;
    if (data) setUsers(prev => [...prev, data]);
  };

  const addTransaction = async (description: string, amount: number, paidBy: string, splitAmong: { userId: string, amount: number }[]) => {
    // 1. Insert transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert([{ description, amount, paid_by: paidBy }])
      .select()
      .single();

    if (txError) throw txError;

    // 2. Insert splits
    const splitsToInsert = splitAmong.map(split => ({
      transaction_id: tx.id,
      user_id: split.userId,
      amount_owed: split.amount
    }));

    const { error: splitError } = await supabase
      .from('transaction_splits')
      .insert(splitsToInsert);

    if (splitError) throw splitError;

    // Fast local update
    const newTx: FullTransaction = {
      ...tx,
      splits: splitsToInsert.map(s => ({ id: uuidv4(), ...s }))
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const deleteTransaction = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const getBalance = (userA: string, userB: string) => {
    // How much userB owes userA = Sum of splits where B owes A
    let bOwesA = 0;
    let aOwesB = 0;

    transactions.forEach(tx => {
      if (tx.paid_by === userA) {
        const splitB = tx.splits.find(s => s.user_id === userB);
        if (splitB) bOwesA += Number(splitB.amount_owed);
      }
      if (tx.paid_by === userB) {
        const splitA = tx.splits.find(s => s.user_id === userA);
        if (splitA) aOwesB += Number(splitA.amount_owed);
      }
    });

    return bOwesA - aOwesB; // Positive if B owes A. Negative if A owes B.
  };

  const getNetBalance = (userId: string) => {
    // Total paid by userId minus their own shares
    let totalPaid = 0;
    let totalOwed = 0;

    transactions.forEach(tx => {
      if (tx.paid_by === userId) {
        totalPaid += Number(tx.amount);
      }
      const mySplit = tx.splits.find(s => s.user_id === userId);
      if (mySplit) {
        totalOwed += Number(mySplit.amount_owed);
      }
    });

    return totalPaid - totalOwed;
  };

  return (
    <DebtContext.Provider value={{
      users,
      transactions,
      currentUser,
      setCurrentUser,
      addUser,
      addTransaction,
      deleteTransaction,
      getBalance,
      getNetBalance,
      loading
    }}>
      {children}
    </DebtContext.Provider>
  );
};
