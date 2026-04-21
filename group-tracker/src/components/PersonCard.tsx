import React from 'react';
import type { User } from '../store/DebtContext';
import { ChevronRight } from 'lucide-react';

interface PersonCardProps {
  person: User & { note?: string };
  balance: number;
  onClick: () => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, balance, onClick }) => {
  let balanceColor = 'var(--text-secondary)';
  if (balance > 0) balanceColor = 'var(--danger-color)';
  else if (balance < 0) balanceColor = 'var(--success-color)';

  const formatBalance = (amount: number) => {
    return (amount > 0 ? '+' : '') + amount.toLocaleString('en-US');
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="card flex items-center justify-between" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="flex items-center gap-4">
        {person.avatar_url ? (
          <img src={person.avatar_url} alt={person.name} className="avatar" style={{ objectFit: 'cover' }} />
        ) : (
          <div className="avatar">{getInitials(person.name)}</div>
        )}
        <div className="flex-col">
          <span className="font-semibold" style={{ fontSize: '18px' }}>{person.name}</span>
          {person.note && <span className="text-sm text-secondary">{person.note}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
          <span className="font-bold" style={{ color: balanceColor }}>
            {formatBalance(balance)}
          </span>
        </div>
        <ChevronRight size={20} color="var(--text-tertiary)" />
      </div>
    </div>
  );
};
