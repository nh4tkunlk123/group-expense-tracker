import React from 'react';
import { useDebtContext } from '../store/DebtContext';
import { UserPlus } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export const IdentityScreen: React.FC = () => {
  const { users, setCurrentUser, addUser, loading } = useDebtContext();

  const handleSelectUser = (user: any) => {
    triggerHaptic('medium');
    setCurrentUser(user);
  };

  const handleAddUser = () => {
    const name = window.prompt('Nhập tên thành viên mới:');
    if (name && name.trim()) {
      addUser(name.trim());
    }
  };

  if (loading && users.length === 0) {
    return <div className="flex items-center justify-center h-full">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="flex-col animate-scale-in" style={{ padding: '24px', height: '100%' }}>
      <div className="flex-col items-center justify-center mb-8" style={{ marginTop: '20vh' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Bạn là ai?</h1>
        <p className="text-secondary text-center">Chọn tên của bạn để xem sổ nợ cá nhân trong nhóm.</p>
      </div>

      <div className="flex-col gap-3">
        {users.map(user => (
          <button
            key={user.id}
            className="card flex items-center justify-between"
            onClick={() => handleSelectUser(user)}
            style={{ padding: '16px', borderRadius: '16px' }}
          >
            <span style={{ fontSize: '18px', fontWeight: '600' }}>{user.name}</span>
          </button>
        ))}

        <button
          className="card flex items-center justify-center gap-2"
          onClick={handleAddUser}
          style={{ 
            padding: '16px', 
            borderRadius: '16px', 
            border: '2px dashed var(--border-color)',
            backgroundColor: 'transparent',
            color: 'var(--accent-color)'
          }}
        >
          <UserPlus size={20} />
          <span style={{ fontSize: '16px', fontWeight: '500' }}>Thêm thành viên mới</span>
        </button>
      </div>
    </div>
  );
};
