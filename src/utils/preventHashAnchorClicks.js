/**
 * Dropdown/menu items often use <a href="#"> without preventDefault.
 * That adds a history entry (e.g. /nested/2 → /nested/2#) so the next
 * navigate(-1) / breadcrumb-back only clears the hash instead of leaving the folder.
 */

/** Remove a trailing # from the current history entry without adding a new one. */
export function stripLocationHash() {
  if (typeof window === "undefined") return;
  if (!window.location.hash) return;
  const clean = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(window.history.state, "", clean);
}

/** Capture-phase: block default navigation for a[href="#"]. Returns cleanup. */
export function installHashAnchorGuard() {
  const onClick = (e) => {
    const el = e.target?.closest?.('a[href="#"]');
    if (!el) return;
    e.preventDefault();
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
