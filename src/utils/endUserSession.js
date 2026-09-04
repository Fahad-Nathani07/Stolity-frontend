import store from "../store/store";

export const SESSION_END_EVENT = "stolity:session-end";

/** Stop playback and tear down global media UI (no storage changes). */
export function cleanupSessionUI() {
  if (typeof document !== "undefined") {
    document.querySelectorAll("audio, video").forEach((el) => {
      try {
        el.pause();
        el.removeAttribute("src");
        if (typeof el.load === "function") el.load();
      } catch {
        /* ignore */
      }
    });
    document.body.classList.remove("audio-player-active");
  }

  store.dispatch({ type: "RESET" });
  window.dispatchEvent(new CustomEvent(SESSION_END_EVENT));
}

/**
 * Full session teardown: UI cleanup + storage clear.
 * @param {{ intentional?: boolean }} options
 */
export function endUserSession({ intentional = false } = {}) {
  cleanupSessionUI();

  localStorage.clear();
  sessionStorage.clear();

  if (intentional) {
    sessionStorage.setItem("intentionalLogout", "1");
  } else {
    sessionStorage.setItem("sessionExpired", "1");
  }
}
