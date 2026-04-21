import React from 'react';

interface NumberPadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onQuickAdd: (amount: number) => void;
}

export const NumberPad: React.FC<NumberPadProps> = ({ onKeyPress, onDelete, onQuickAdd }) => {
  const quickAmounts = [50000, 100000, 200000, 500000];

  return (
    <div>
      <div className="numpad-quick">
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            className="numpad-quick-btn"
            onClick={() => onQuickAdd(amount)}
          >
            +{amount.toLocaleString()}
          </button>
        ))}
      </div>
      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            className="numpad-btn"
            onClick={() => onKeyPress(num.toString())}
          >
            {num}
          </button>
        ))}
        <button className="numpad-btn numpad-action" onClick={() => onKeyPress('000')}>
          000
        </button>
        <button className="numpad-btn" onClick={() => onKeyPress('0')}>
          0
        </button>
        <button className="numpad-btn numpad-action" onClick={onDelete}>
          ⌫
        </button>
      </div>
    </div>
  );
};
