// src/components/LoaderLogo.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NewLogo from '../images/NewLogo.png';

const LoaderLogo = ({ isVisible = false }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999999,
            cursor: 'wait',
            overflow: 'hidden',
          }}
        >
          <motion.span
            className="animate_logo animate_logo_loader expanded"
            data-value="1"
            initial={{
              width: '1px',
              height: '1px',
              borderRadius: '50%',
            }}
            animate={{
              width: '110vw',
              height: '110vw',
              borderRadius: '50%',
            }}
            exit={{
              width: '1px',
              height: '1px',
              borderRadius: '50%',
              transition: {
                duration: 1,
                ease: 'easeIn',
              },
            }}
            transition={{
              duration: 1,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background:
                'conic-gradient(from 0deg at 50% 50%, #E5252A 0deg, #E7400C 120deg, #FFAB49 240deg, #E5252A 360deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(229, 37, 42, 0.35)',
              transformOrigin: 'center center',
            }}
          >
            <div className="logo__load" style={{ width: '100px', height: '100px' }}>
              <motion.img
                src={NewLogo}
                alt="Loading..."
                style={{
                  width: '90px',
                  height: '90px',
                  filter: 'brightness(0) invert(1)',
                  objectFit: 'contain',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            </div>
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoaderLogo;