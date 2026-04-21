import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset transform when opened
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
    setIsDragging(true);
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 0 && sheetRef.current) {
      // Apply slight resistance
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const deltaY = currentY.current - startY.current;
    
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)';
      
      if (deltaY > 100) {
        // Animate off screen
        sheetRef.current.style.transform = `translateY(100%)`;
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        // Snap back
        sheetRef.current.style.transform = 'translateY(0)';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet" ref={sheetRef}>
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ padding: '0 0 12px 0', marginTop: '-12px', paddingTop: '12px' }}
        >
          <div className="bottom-sheet-handle" />
          <div className="flex justify-between items-center" style={{ flexShrink: 0 }}>
            <h3 className="font-semibold">{title}</h3>
            <button 
              onClick={onClose} 
              style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <X size={20} color="var(--text-secondary)" />
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '24px' }}>
          {children}
        </div>
      </div>
    </>
  );
};
