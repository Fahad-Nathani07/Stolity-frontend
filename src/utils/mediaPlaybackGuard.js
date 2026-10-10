/** Cross-player coordination: pause floating music when video starts. */

export const PAUSE_GLOBAL_AUDIO_EVENT = "stolity:pause-global-audio";

export function pauseGlobalAudioPlayer() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(PAUSE_GLOBAL_AUDIO_EVENT));

  document.querySelectorAll("audio.ap-audio-el").forEach((el) => {
    try {
      if (!el.paused) el.pause();
    } catch {
      /* ignore */
    }
  });
}
