'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { LogoutButton } from '@/components/LogoutButton';
import { X, Wallet, Globe } from 'lucide-react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  const handleWalletClick = () => {
    onClose();
    router.push('/wallet');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-80 bg-background shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Settings">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-semibold text-foreground">{t('settings.title')}</h2>
              <ButtonNaked
                onPress={onClose}
                className="rounded-full p-1 hover:bg-foreground/5"
                aria-label="Close settings">
                <X className="h-6 w-6 stroke-foreground" />
              </ButtonNaked>
            </div>

            {/* Content */}
            <div className="space-y-6 p-4">
              {/* Theme Section */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">{t('settings.appearance')}</h3>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-foreground">{t('settings.theme')}</span>
                  <ThemeSwitch />
                </div>
              </div>

              {/* Language Section */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">{t('settings.language')}</h3>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4 stroke-foreground" />
                    <span className="text-foreground">{t('settings.language')}</span>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'zh' | 'en')}
                    className="rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="zh">{t('settings.chinese')}</option>
                    <option value="en">{t('settings.english')}</option>
                  </select>
                </div>
              </div>

              {/* Account Section */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">{t('settings.account')}</h3>

                {/* Wallet Link */}
                <ButtonNaked
                  onPress={handleWalletClick}
                  className="mb-3 flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted/70">
                  <div className="flex items-center">
                    <Wallet className="mr-3 h-5 w-5 stroke-foreground" />
                    <span className="text-foreground">{t('nav.wallet')}</span>
                  </div>
                  <span className="font-medium text-foreground">¥1,250.50</span>
                </ButtonNaked>

                {/* Logout */}
                <div className="p-3">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
