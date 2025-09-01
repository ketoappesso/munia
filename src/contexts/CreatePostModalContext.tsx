'use client';

import React, { Dispatch, SetStateAction, createContext, useContext, useMemo, useState } from 'react';
import { useOverlayTriggerState } from 'react-stately';
import { AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/Modal';
import { CreatePostDialog } from '@/components/CreatePostDialog';
import { ToEditValues } from '@/lib/createPost';

// Separate the `data` and `api` part of the context to prevent
// re-rendering of the `api` consumers when the `data` changes
const CreatePostModalContextData = createContext<{
  toEditValues: ToEditValues | null;
  shouldOpenFileInputOnMount: boolean;
  initialRewardAmount: number;
  isTask: boolean;
}>({
  toEditValues: null,
  shouldOpenFileInputOnMount: false,
  initialRewardAmount: 0,
  isTask: false,
});

const CreatePostModalContextApi = createContext<{
  setShown: (isOpen: boolean) => void;
  setToEditValues: Dispatch<SetStateAction<ToEditValues | null>>;
  setShouldOpenFileInputOnMount: Dispatch<SetStateAction<boolean>>;
  setInitialRewardAmount: Dispatch<SetStateAction<number>>;
  setIsTask: Dispatch<SetStateAction<boolean>>;
}>({
  setShown: () => {},
  setToEditValues: () => {},
  setShouldOpenFileInputOnMount: () => {},
  setInitialRewardAmount: () => {},
  setIsTask: () => {},
});

export function CreatePostModalContextProvider({ children }: { children: React.ReactNode }) {
  const state = useOverlayTriggerState({});
  const [toEditValues, setToEditValues] = useState<ToEditValues | null>(null);
  const [shouldOpenFileInputOnMount, setShouldOpenFileInputOnMount] = useState(false);
  const [initialRewardAmount, setInitialRewardAmount] = useState(0);
  const [isTask, setIsTask] = useState(false);

  // Memoize to prevent re-rendering of consumers when the states change
  const dataValue = useMemo(
    () => ({ toEditValues, shouldOpenFileInputOnMount, initialRewardAmount, isTask }),
    [shouldOpenFileInputOnMount, toEditValues, initialRewardAmount, isTask],
  );
  const apiValue = useMemo(
    () => ({
      setShown: state.setOpen,
      setToEditValues,
      setShouldOpenFileInputOnMount,
      setInitialRewardAmount,
      setIsTask,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // Don't add `state.setOpen` here, otherwise our memoization technique won't work
  );

  return (
    <CreatePostModalContextData.Provider value={dataValue}>
      <CreatePostModalContextApi.Provider value={apiValue}>
        {children}
        <AnimatePresence>
          {state.isOpen && (
            // Set `isKeyboardDismissDisabled`, clicking the `Escape` key must be handled by <CreatePostDialog> instead.
            <Modal state={state} isKeyboardDismissDisabled>
              <CreatePostDialog
                toEditValues={toEditValues}
                shouldOpenFileInputOnMount={shouldOpenFileInputOnMount}
                setShown={state.setOpen}
                initialRewardAmount={initialRewardAmount}
                isTaskInitial={isTask}
              />
            </Modal>
          )}
        </AnimatePresence>
      </CreatePostModalContextApi.Provider>
    </CreatePostModalContextData.Provider>
  );
}

export const useCreatePostModalContextData = () => useContext(CreatePostModalContextData);
export const useCreatePostModalContextApi = () => useContext(CreatePostModalContextApi);
