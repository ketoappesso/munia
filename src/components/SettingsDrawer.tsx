'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { LogoutButton } from '@/components/LogoutButton';
import { X } from 'lucide-react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { theme } = useTheme();

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
            aria-label="Settings"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-semibold text-foreground">Settings</h2>
              <ButtonNaked
                onPress={onClose}
                className="rounded-full p-1 hover:bg-foreground/5"
                aria-label="Close settings"
              >
                <X className="h-6 w-6 stroke-foreground" />
              </ButtonNaked>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Theme Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Appearance</h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-foreground">Theme</span>
                  <ThemeSwitch />
                </div>
              </div>

              {/* Account Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Account</h3>
                
                {/* Wallet Balance */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-3">
                  <span className="text-foreground">Balance</span>
                  <span className="text-foreground font-medium">¥0.00</span>
                </div>

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