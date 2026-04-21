import React, { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { NumberPad } from './NumberPad';
import { useDebtContext } from '../store/DebtContext';
import { triggerHaptic } from '../utils/haptics';
import { sendDiscordNotification } from '../lib/discord';

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionSheet: React.FC<AddTransactionSheetProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, addTransaction } = useDebtContext();
  
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && currentUser) {
      setPaidBy(currentUser.id);
      setSplitAmong(users.map(u => u.id));
      setTxAmount('');
      setTxNote('');
    }
  }, [isOpen, currentUser, users]);

  const handleKeyPress = (key: string) => {
    triggerHaptic('light');
    if (txAmount === '0' && key !== '0' && key !== '000') {
      setTxAmount(key);
    } else if (txAmount !== '0' || key === '0') {
      if (txAmount.length < 12) {
        setTxAmount(prev => prev + key);
      }
    }
  };

  const handleDeleteKey = () => {
    triggerHaptic('light');
    setTxAmount(prev => prev.slice(0, -1));
  };

  const handleQuickAdd = (amount: number) => {
    triggerHaptic('medium');
    const current = parseInt(txAmount || '0', 10);
    setTxAmount((current + amount).toString());
  };

  const toggleSplitUser = (userId: string) => {
    triggerHaptic('light');
    setSplitAmong(prev => {
      if (prev.includes(userId)) {
        if (prev.length === 1) return prev; // Cannot deselect last user
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSaveTransaction = async () => {
    const amountNum = parseInt(txAmount || '0', 10);
    if (amountNum <= 0 || !paidBy || splitAmong.length === 0 || !txNote.trim()) {
      triggerHaptic('error');
      return;
    }
    
    triggerHaptic('success');
    
    // Split equally
    const splitAmount = amountNum / splitAmong.length;
    const splitData = splitAmong.map(userId => ({
      userId,
      amount: splitAmount
    }));

    await addTransaction(txNote, amountNum, paidBy, splitData);
    
    // Bắn thông báo lên Discord
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      const payer = users.find(u => u.id === paidBy);
      await sendDiscordNotification(
        webhookUrl,
        payer?.name || 'Ai đó',
        amountNum,
        txNote,
        splitAmong.length,
        splitAmount
      );
    }
    
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Thêm Giao Dịch Nhóm">
      <div className="flex-col gap-3">
        
        {/* Paid By */}
        <div>
          <label className="text-sm text-secondary" style={{ marginBottom: '4px', display: 'block' }}>Ai là người trả tiền?</label>
          <select 
            value={paidBy} 
            onChange={(e) => setPaidBy(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', 
              border: 'none', fontSize: '16px',
              WebkitAppearance: 'none', fontWeight: '600'
            }}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.id === currentUser?.id ? 'Bạn' : u.name}</option>
            ))}
          </select>
        </div>

        {/* Note */}
        <input
          type="text"
          placeholder="Lý do chi tiền (vd: Ăn Lẩu)"
          value={txNote}
          onChange={(e) => setTxNote(e.target.value)}
          style={{ padding: '12px 16px', fontSize: '16px', borderRadius: 'var(--radius-sm)' }}
        />

        {/* Amount Display */}
        <div className="amount-display" style={{ color: 'var(--accent-color)' }}>
          {txAmount ? parseInt(txAmount, 10).toLocaleString() : '0'}
        </div>

        {/* Split Among */}
        <div style={{ marginTop: '8px' }}>
          <label className="text-sm text-secondary" style={{ marginBottom: '8px', display: 'block' }}>Chia đều cho những ai?</label>
          <div className="flex" style={{ flexWrap: 'wrap', gap: '8px' }}>
            {users.map(u => {
              const isSelected = splitAmong.includes(u.id);
              return (
                <div 
                  key={u.id}
                  onClick={() => toggleSplitUser(u.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`
                  }}
                >
                  {u.id === currentUser?.id ? 'Bạn' : u.name}
                </div>
              );
            })}
          </div>
          {splitAmong.length > 0 && txAmount && (
            <div className="text-sm text-secondary mt-2">
              Mỗi người chịu: {(parseInt(txAmount, 10) / splitAmong.length).toLocaleString()}
            </div>
          )}
        </div>

        <NumberPad 
          onKeyPress={handleKeyPress}
          onDelete={handleDeleteKey}
          onQuickAdd={handleQuickAdd}
        />

        <button 
          className="btn-primary" 
          onClick={handleSaveTransaction}
          disabled={!txAmount || txAmount === '0' || !paidBy || !txNote.trim() || splitAmong.length === 0}
          style={{ 
            opacity: (!txAmount || txAmount === '0' || !paidBy || !txNote.trim() || splitAmong.length === 0) ? 0.5 : 1,
            marginTop: '12px',
            padding: '14px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          Lưu Giao Dịch
        </button>
      </div>
    </BottomSheet>
  );
};
