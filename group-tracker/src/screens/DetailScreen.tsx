import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebtContext } from '../store/DebtContext';
import { ChevronLeft } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { sendDiscordNotification } from '../lib/discord';

export const DetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, transactions, currentUser, getBalance, addTransaction } = useDebtContext();
  
  if (!currentUser) return null;

  const person = users.find(p => p.id === id);
  
  if (!person) {
    return <div className="p-4">Không tìm thấy người này</div>;
  }

  const balance = getBalance(currentUser.id, person.id);

  // Lọc các giao dịch có liên quan giữa currentUser và person
  const relatedTransactions = transactions.filter(tx => {
    if (tx.paid_by === currentUser.id && tx.splits.some(s => s.user_id === person.id)) return true;
    if (tx.paid_by === person.id && tx.splits.some(s => s.user_id === currentUser.id)) return true;
    return false;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  let balanceColor = 'var(--text-primary)';
  if (balance > 0) balanceColor = 'var(--success-color)';
  else if (balance < 0) balanceColor = 'var(--danger-color)';

  const getTxDescription = (tx: any) => {
    if (tx.description === 'Thanh toán nợ') {
      return tx.paid_by === currentUser.id ? `Bạn đã thanh toán cho ${person.name}` : `${person.name} đã thanh toán cho bạn`;
    }
    if (tx.paid_by === currentUser.id) {
      const amountOwed = tx.splits.find((s: any) => s.user_id === person.id)?.amount_owed || 0;
      return `Bạn trả, ${person.name} nợ ${Number(amountOwed).toLocaleString()}`;
    } else {
      const amountOwed = tx.splits.find((s: any) => s.user_id === currentUser.id)?.amount_owed || 0;
      return `${person.name} trả, bạn nợ ${Number(amountOwed).toLocaleString()}`;
    }
  };

  const handleSettleSpecificTx = async (tx: any) => {
    const amountOwed = tx.splits.find((s: any) => s.user_id === currentUser.id)?.amount_owed;
    if (!amountOwed) return;

    triggerHaptic('medium');
    const amount = Number(amountOwed);
    
    if (window.confirm(`Xác nhận thanh toán ${amount.toLocaleString()}đ cho khoản "${tx.description}"?`)) {
      triggerHaptic('success');
      
      const paidBy = currentUser.id;
      const splitUser = person.id;
      const autoNote = `Thanh toán khoản: ${tx.description}`;
      const splitData = [{ userId: splitUser, amount }];
      
      await addTransaction(autoNote, amount, paidBy, splitData);
      
      const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        await sendDiscordNotification(
          webhookUrl,
          currentUser.name,
          amount,
          autoNote,
          1,
          amount,
          true,
          person.name
        );
      }
    }
  };

  return (
    <div className="flex-col animate-scale-in" style={{ height: '100%' }}>
      <header className="app-header flex items-center justify-between" style={{ paddingBottom: '20px' }}>
        <button 
          onClick={() => { triggerHaptic('light'); navigate('/'); }} 
          className="flex items-center text-secondary"
        >
          <ChevronLeft size={28} color="var(--accent-color)" />
          <span style={{ color: 'var(--accent-color)', fontSize: '17px' }}>Quay lại</span>
        </button>
        <h3 style={{ fontSize: '18px' }}>{person.name}</h3>
        <div style={{ width: '60px' }}></div>
      </header>

      <div className="scroll-container">
        {/* Balance Card */}
        <div className="flex-col items-center justify-center py-4 mb-4">
          <span className="text-secondary" style={{ marginBottom: '8px' }}>
            {balance >= 0 ? `${person.name} đang nợ bạn` : `Bạn đang nợ ${person.name}`}
          </span>
          <div 
            style={{ 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: balanceColor,
              lineHeight: 1
            }}
          >
            {balance > 0 ? '+' : ''}{balance.toLocaleString()}
          </div>
          
        </div>

        {/* Transactions List */}
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontSize: '20px' }}>Lịch sử giao dịch chung</h3>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {relatedTransactions.length === 0 ? (
            <div className="p-4 text-center text-secondary text-sm">
              Chưa có giao dịch chung nào
            </div>
          ) : (
            relatedTransactions.map((tx, index) => {
              // Kiểm tra xem giao dịch này currentUser có đang nợ person không (để hiện nút Trả khoản này)
              const isCurrentUserOwingThis = tx.paid_by === person.id && tx.splits.some((s: any) => s.user_id === currentUser.id) && !tx.description.includes('Thanh toán');
              
              // Kiểm tra xem đã có khoản thanh toán nào cho giao dịch này sau đó chưa
              const hasBeenPaid = relatedTransactions.some(t => 
                t.description === `Thanh toán khoản: ${tx.description}` && 
                new Date(t.created_at) > new Date(tx.created_at)
              );
              
              const showPayButton = isCurrentUserOwingThis && !hasBeenPaid;

              return (
                <div key={tx.id} style={{ animationDelay: `${index * 0.05}s`, padding: '16px', borderBottom: '1px solid var(--border-color)' }} className="animate-scale-in">
                  <div className="flex justify-between items-center">
                    <div className="flex-col">
                      <span style={{ fontWeight: '600', fontSize: '16px' }}>{tx.description}</span>
                      <span className="text-sm text-secondary">{getTxDescription(tx)}</span>
                    </div>
                    <div className="flex-col items-end">
                      <div style={{ fontWeight: 'bold', marginBottom: showPayButton ? '8px' : '0' }}>
                        {Number(tx.amount).toLocaleString()}
                      </div>
                      {showPayButton && (
                        <button 
                          onClick={() => handleSettleSpecificTx(tx)}
                          style={{
                            backgroundColor: 'var(--success-color)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          Trả khoản này
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
