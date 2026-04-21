import React, { useState } from 'react';
import { useDebtContext } from '../store/DebtContext';
// import { useLanguage } from '../store/LanguageContext';
import { PersonCard } from '../components/PersonCard';
import { AddTransactionSheet } from '../components/AddTransactionSheet';
import { SettingsSheet } from '../components/SettingsSheet';
import { Plus, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';

export const HomeScreen: React.FC = () => {
  const { users, currentUser, getBalance, getNetBalance } = useDebtContext();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) return null;

  const netBalance = getNetBalance(currentUser.id);
  const otherUsers = users.filter(u => u.id !== currentUser.id);

  return (
    <div className="flex-col animate-scale-in" style={{ height: '100%' }}>
      <header className="app-header">
        <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
          <div className="flex items-center gap-2">
            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <h1 style={{ fontSize: '20px' }}>{currentUser.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { triggerHaptic('light'); setIsSettingsOpen(true); }}
              style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            >
              <Settings size={22} />
            </button>
          </div>
        </div>
        <div className="card" style={{ backgroundColor: 'var(--accent-color)', marginBottom: '0' }}>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Tổng số dư của bạn
          </span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '4px' }}>
            {netBalance > 0 ? '+' : ''}{netBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
            {netBalance >= 0 ? 'Mọi người đang nợ bạn' : 'Bạn đang nợ mọi người'}
          </div>
        </div>
      </header>

      <div className="scroll-container" style={{ paddingTop: '20px' }}>
        {otherUsers.length === 0 ? (
          <div className="flex-col items-center justify-center" style={{ height: '60%', color: 'var(--text-secondary)' }}>
            <Users size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>Chưa có thành viên nào khác</h3>
          </div>
        ) : (
          <div className="list-container">
            {otherUsers.map((user, index) => {
              // getBalance(A, B): Positive if B owes A. Negative if A owes B.
              // So getBalance(currentUser, user) -> Positive if user owes me
              const balance = getBalance(currentUser.id, user.id);
              
              return (
                <div key={user.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-scale-in">
                  <PersonCard
                    person={{ ...user, note: '' }}
                    balance={balance}
                    onClick={() => { triggerHaptic('light'); navigate(`/person/${user.id}`); }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => { triggerHaptic('medium'); setIsQuickAddOpen(true); }}>
        <Plus size={28} />
      </button>

      {isQuickAddOpen && (
        <AddTransactionSheet 
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
        />
      )}

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
