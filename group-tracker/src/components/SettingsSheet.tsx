import React from 'react';
import { BottomSheet } from './BottomSheet';
import { useLanguage } from '../store/LanguageContext';
import { useTheme } from '../store/ThemeContext';
import { triggerHaptic } from '../utils/haptics';
import { Moon, Sun, Monitor, DollarSign } from 'lucide-react';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({ isOpen, onClose }) => {
  const { t, lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('settings') || 'Cài đặt'}>
      <div className="flex-col" style={{ marginTop: '8px', gap: '32px' }}>
        
        {/* Theme Settings */}
        <div>
          <h4 style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('theme') || 'Giao diện'}
          </h4>
          <div className="amount-type-toggle" style={{ marginBottom: 0 }}>
            <div 
              className={`toggle-btn ${theme === 'light' ? 'active' : ''}`}
              style={{ padding: '10px 8px', fontSize: '14px' }}
              onClick={() => { triggerHaptic('light'); setTheme('light'); }}
            >
              <Sun size={18} /> {t('light') || 'Sáng'}
            </div>
            <div 
              className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
              style={{ padding: '10px 8px', fontSize: '14px' }}
              onClick={() => { triggerHaptic('light'); setTheme('dark'); }}
            >
              <Moon size={18} /> {t('dark') || 'Tối'}
            </div>
            <div 
              className={`toggle-btn ${theme === 'system' ? 'active' : ''}`}
              style={{ padding: '10px 8px', fontSize: '14px' }}
              onClick={() => { triggerHaptic('light'); setTheme('system'); }}
            >
              <Monitor size={18} /> {t('system') || 'Tự động'}
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div>
          <h4 style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('language') || 'Ngôn ngữ'}
          </h4>
          <div className="amount-type-toggle" style={{ marginBottom: 0 }}>
            <div 
              className={`toggle-btn ${lang === 'vi' ? 'active' : ''}`}
              style={{ padding: '10px 8px', fontSize: '14px' }}
              onClick={() => { triggerHaptic('light'); setLang('vi'); }}
            >
              Tiếng Việt
            </div>
            <div 
              className={`toggle-btn ${lang === 'en' ? 'active' : ''}`}
              style={{ padding: '10px 8px', fontSize: '14px' }}
              onClick={() => { triggerHaptic('light'); setLang('en'); }}
            >
              English
            </div>
          </div>
        </div>

        {/* Currency / Format Placeholder */}
        <div style={{ paddingBottom: '20px' }}>
          <h4 style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('currencyFormat') || 'Định dạng tiền tệ'} ({t('comingSoon') || 'Sắp ra mắt'})
          </h4>
          <div 
            style={{ 
              padding: '16px', backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px',
              opacity: 0.5
            }}
          >
            <div style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              width: '36px', height: '36px', 
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <DollarSign size={20} color="var(--text-secondary)" />
            </div>
            <div>
              <div style={{ fontWeight: '500', fontSize: '16px' }}>VND (₫)</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>100,000 ₫</div>
            </div>
          </div>
        </div>

      </div>
    </BottomSheet>
  );
};
