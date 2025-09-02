import React, { useMemo, useRef } from 'react';
import { AriaModalOverlayProps, Overlay, useModalOverlay } from 'react-aria';
import { OverlayTriggerState } from 'react-stately';
import { motion } from 'framer-motion';

interface ModalProps extends AriaModalOverlayProps {
  children: React.ReactNode;
  state: OverlayTriggerState;
}

export function Modal({ state, children, ...rest }: ModalProps) {
  const ref = useRef(null);
  const { modalProps, underlayProps } = useModalOverlay({ ...rest, isOpen: state.isOpen, onClose: state.close }, state, ref);
  const variants = useMemo(
    () => ({
      initial: { backdropFilter: 'blur(0)', opacity: 0 },
      animate: { backdropFilter: 'blur(4px)', opacity: 1 },
      exit: { backdropFilter: 'blur(0)', opacity: 0 },
    }),
    [],
  );

  return (
    <Overlay>
      <div {...underlayProps} className="fixed inset-0 z-[100] h-screen w-screen bg-black/50">
        <motion.div variants={variants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
          <div {...modalProps} ref={ref} className="h-full w-full">
            {children}
          </div>
        </motion.div>
      </div>
    </Overlay>
  );
}
