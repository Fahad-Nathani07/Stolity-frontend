import React from "react";
import { useSelector } from "react-redux";

/** Animated equalizer bars — freezes when the global player is paused. */
export default function NowPlayingIndicator({ className = "" }) {
  const isAudioPlaying = useSelector((state) => state.getdata.isAudioPlaying);

  return (
    <span
      className={`now-playing-eq${isAudioPlaying ? "" : " is-paused"}${
        className ? ` ${className}` : ""
      }`}
      aria-label={isAudioPlaying ? "Now playing" : "Paused"}
      title={isAudioPlaying ? "Now playing" : "Paused"}
    >
      <span className="now-playing-eq__bar" />
      <span className="now-playing-eq__bar" />
      <span className="now-playing-eq__bar" />
      <span className="now-playing-eq__bar" />
    </span>
  );
}
