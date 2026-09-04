import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UploadContext } from '../pages/UploadContext';
import { DownloadContext } from '../pages/DownloadContext';
import { endUserSession } from '../utils/endUserSession';

// TESTING: restore to 15 * 60 * 1000 and WARNING_TIMEOUT 60 * 1000 before release
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;   // 15 minutes (testing)
const WARNING_TIMEOUT   = 60 * 1000;        // Warning in last 60 seconds (testing)
const WARNING_SECONDS   = WARNING_TIMEOUT / 1000;

const InactivityHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showAudioPlayer = useSelector((state) => state.getdata.showAudioPlayer);

  const { uploads } = useContext(UploadContext);
  const { downloads } = useContext(DownloadContext);

  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);

  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const publicPaths = [
    '/login',
    '/Login',
    '/Signup',
    '/signup',
    '/forgot-password',
    '/ForgotPassword',
    '/careers',
    '/reset-password',
    '/',
  ];

  // Flag: true only on protected routes
//   const isProtectedRoute = !publicPaths.includes(location.pathname);
const isProtectedRoute = !publicPaths.includes(location.pathname) && 
                         !location.pathname.endsWith('/careers') &&
                         !location.pathname.endsWith('/careers/');

  // ────────────────────────────────────────────────
  // All hooks run unconditionally — ESLint happy
  // ────────────────────────────────────────────────

  // Incomplete uploads/downloads (active or paused) keep the session alive
  const isAnyTransferActive = useCallback(() => {
    if (!isProtectedRoute) return false;

    const pendingUpload = uploads.some(
      (u) => Math.round(Number(u.progress) || 0) < 100
    );
    const pendingDownload = downloads.some(
      (d) => Math.round(Number(d.progress) || 0) < 100
    );
    return pendingUpload || pendingDownload;
  }, [uploads, downloads, isProtectedRoute]);

  // Open audio player or active media playback keeps the session alive
  const isAnyMediaActive = useCallback(() => {
    if (!isProtectedRoute) return false;
    if (showAudioPlayer) return true;

    if (typeof document === 'undefined') return false;
    const mediaEls = document.querySelectorAll('audio, video');
    for (const el of mediaEls) {
      if (!el.paused && !el.ended) return true;
    }
    return false;
  }, [isProtectedRoute, showAudioPlayer]);

  const isSessionBusy = useCallback(() => {
    return isAnyTransferActive() || isAnyMediaActive();
  }, [isAnyTransferActive, isAnyMediaActive]);

  const isSessionBusyRef = useRef(isSessionBusy);
  const resetTimerRef = useRef(() => {});
  isSessionBusyRef.current = isSessionBusy;

  // Logout
  const handleLogout = useCallback(() => {
    if (!isProtectedRoute) return; // skip on public paths
    if (isSessionBusyRef.current()) {
      resetTimerRef.current();
      return;
    }

    endUserSession({ intentional: false });
    navigate('/Login', { replace: true });
  }, [navigate, isProtectedRoute]);

  // Reset timer
  const resetTimer = useCallback(() => {
    if (!isProtectedRoute) return; // skip on public paths

    lastActivityRef.current = Date.now();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    setShowWarning(false);
    setSecondsLeft(WARNING_SECONDS);

    timeoutRef.current = setTimeout(() => {
      // Re-check at fire time — media may still be playing
      if (isSessionBusyRef.current()) {
        resetTimerRef.current();
        return;
      }
      handleLogout();
    }, INACTIVITY_TIMEOUT);

    warningRef.current = setTimeout(() => {
      if (!isSessionBusyRef.current()) {
        setShowWarning(true);
        setSecondsLeft(WARNING_SECONDS);
      }
    }, INACTIVITY_TIMEOUT - WARNING_TIMEOUT);
  }, [isProtectedRoute, handleLogout]);

  resetTimerRef.current = resetTimer;

  // Activity handler
  const handleActivity = useCallback(() => {
    if (!isProtectedRoute) return; // skip on public paths
    resetTimer();
  }, [resetTimer, isProtectedRoute]);

  // Live countdown
  useEffect(() => {
    if (!isProtectedRoute) return; // skip on public paths
    if (!showWarning) return;

    const interval = setInterval(() => {
      if (isSessionBusyRef.current()) {
        resetTimerRef.current();
        return;
      }
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, handleLogout, isProtectedRoute]);

  // Keep session alive while uploads/downloads (incl. paused), media, or audio player
  useEffect(() => {
    if (!isProtectedRoute) return; // skip on public paths

    const interval = setInterval(() => {
      if (isSessionBusy()) {
        resetTimer();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isSessionBusy, resetTimer, isProtectedRoute]);

  // Mount listeners + timer
  useEffect(() => {
    if (!isProtectedRoute) return; // skip on public paths

    resetTimer();

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, handleActivity));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [resetTimer, handleActivity, isProtectedRoute]);

  // ────────────────────────────────────────────────
  // Render UI only on protected routes
  // ────────────────────────────────────────────────
  if (!isProtectedRoute) {
    return null;
  }

  return (
    <>
      {showWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            opacity: 0,
            transition: 'opacity 0.4s ease-in-out',
          }}
          ref={(el) => {
            if (el) {
              setTimeout(() => { el.style.opacity = '1'; }, 10);
            }
          }}
          onClick={handleActivity}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.8rem 2.2rem',
              maxWidth: '380px',
              width: '90%',
              boxShadow: '0 15px 35px rgba(0,0,0,0.35)',
              textAlign: 'center',
              transform: 'scale(0.95)',
              transition: 'transform 0.4s ease-out',
            }}
            ref={(el) => {
              if (el) {
                setTimeout(() => { el.style.transform = 'scale(1)'; }, 10);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 1rem',
                fontSize: '1.35rem',
                fontWeight: 600,
                color: '#2d3748',
              }}
            >
              Session About to Expire
            </h3>

            <p
              style={{
                margin: '0 0 1.2rem',
                color: '#4a5568',
                fontSize: '1.05rem',
                lineHeight: '1.4',
              }}
            >
              You’ve been inactive. Logging out in{' '}
              <strong
                style={{
                  color: '#e53e3e',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                }}
              >
                {secondsLeft}
              </strong>{' '}
              seconds.
            </p>

            <p
              style={{
                margin: 0,
                color: '#718096',
                fontSize: '0.92rem',
              }}
            >
              Move your mouse, click anywhere, or press any key to continue.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default InactivityHandler;