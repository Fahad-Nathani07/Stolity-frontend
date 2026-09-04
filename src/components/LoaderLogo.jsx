// src/components/LoaderLogo.jsx
import React from 'react';
import { motion } from 'framer-motion';
import NewLogo from '../images/NewLogo.png';  // Make sure this path is correct!

const LoaderLogo = ({animation = false}) => {
  return (
    <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  width: '100vw',
                  height: '100vh',
                  // backgroundColor: 'rgba(0, 0, 0, 0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2147483647,           // maximum safe z-index value
                  pointerEvents: 'none',        // clicks pass through if needed
                }}
              >
                <span
                  className={`animate_logo animate_logo_loader ${animation ? "expanded" : ""}`}
                  data-value="1"
                  style={{
                    background: `conic-gradient(from 0deg at 50% 50%, #E5252A 0deg, #E7400C 120deg, #FFAB49 240deg, #E5252A 360deg)`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(229,37,42,0.4)',
                  }}
                >
                  <div className="logo__load" style={{ width: "100px", height: "100px" }}>
                    <motion.img
                      src={NewLogo}
                      alt="Logo"
                      style={{
                        width: "90px",
                        height: "90px",
                        filter: "brightness(0) invert(1)",
                        objectFit: 'contain',
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  </div>
                </span>
              </div>
  );
};

export default LoaderLogo;