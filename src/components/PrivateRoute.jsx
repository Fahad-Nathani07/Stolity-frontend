import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { cleanupSessionUI } from "../utils/endUserSession";
import { showToast } from "./ToastProvider";

/**
 * Protects nested routes: requires sessionStorage "email".
 * If missing, redirects to /Login.
 * Skips the session toast when the user intentionally logged out
 * (SideNav sets sessionStorage "intentionalLogout").
 */
const PrivateRoute = () => {
  const location = useLocation();
  const email = sessionStorage.getItem("email");
  const skipToastRef = useRef(false);
  const toastHandledRef = useRef(false);

  if (!email && sessionStorage.getItem("intentionalLogout") === "1") {
    sessionStorage.removeItem("intentionalLogout");
    skipToastRef.current = true;
  }

  useEffect(() => {
    if (email) return;
    cleanupSessionUI();
    if (toastHandledRef.current) return;
    toastHandledRef.current = true;
    if (skipToastRef.current) return;

    showToast(
      "warning",
      "Please log in to continue. Your session may have expired.",
      "Session expired"
    );
  }, [email]);

  if (!email) {
    return (
      <Navigate
        to="/Login"
        replace
        state={{
          from: location.pathname,
          sessionExpired: !skipToastRef.current,
        }}
      />
    );
  }

  return <Outlet />;
};

export default PrivateRoute;
