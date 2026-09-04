import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaCompress,
  FaExpand,
  FaPause,
  FaPlay,
  FaVolumeDown,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { MdForward10, MdReplay10 } from "react-icons/md";
import ApTooltip from "./ApTooltip";
import { getVideoFileName } from "../utils/videoPlayer";
import "../css/VideoPlayer.css";

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const truncateText = (text, maxLength = 40) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
};

const VideoPlayer = ({
  url,
  fileName = "",
  className = "",
  fitToFrame = false,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const hideTimerRef = useRef(null);
  const bufferTimerRef = useRef(null);
  const shouldAutoPlayRef = useRef(true);

  const clearFitSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.removeProperty("width");
    container.style.removeProperty("height");
  }, []);

  const fitPlayerToFrame = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !fitToFrame || document.fullscreenElement) return;

    const stage = container.parentElement;
    if (!stage) return;

    const vw = video?.videoWidth;
    const vh = video?.videoHeight;
    if (!vw || !vh) return;

    const style = getComputedStyle(stage);
    const insetX =
      parseFloat(style.getPropertyValue("--cfm-video-inset-x")) || 160;
    const insetY =
      parseFloat(style.getPropertyValue("--cfm-video-inset-y")) || 48;

    const maxW = Math.max(0, stage.clientWidth - insetX);
    const maxH = Math.max(0, stage.clientHeight - insetY);
    const ar = vw / vh;

    let w = maxW;
    let h = w / ar;
    if (h > maxH) {
      h = maxH;
      w = h * ar;
    }

    container.style.width = `${Math.floor(w)}px`;
    container.style.height = `${Math.floor(h)}px`;
  }, [fitToFrame]);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const displayName = truncateText(getVideoFileName(fileName), 40);

  const clearBufferTimer = useCallback(() => {
    if (bufferTimerRef.current) {
      clearTimeout(bufferTimerRef.current);
      bufferTimerRef.current = null;
    }
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const togglePlay = useCallback(
    (e) => {
      e?.stopPropagation();
      const video = videoRef.current;
      if (!video) return;

      if (video.paused) {
        video.play().catch(() => setPlaying(false));
      } else {
        video.pause();
      }
      revealControls();
    },
    [revealControls]
  );

  const seekBy = useCallback(
    (delta) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const next = Math.max(0, Math.min(duration, video.currentTime + delta));
      video.currentTime = next;
      setPlayedSeconds(next);
      setPlayed(duration > 0 ? next / duration : 0);
      revealControls();
    },
    [duration, revealControls]
  );

  const handleProgressClick = useCallback(
    (e) => {
      e.stopPropagation();
      const bar = progressRef.current;
      const video = videoRef.current;
      if (!bar || !video || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const next = ratio * duration;
      video.currentTime = next;
      setPlayed(ratio);
      setPlayedSeconds(next);
      revealControls();
    },
    [duration, revealControls]
  );

  const toggleMute = useCallback(
    (e) => {
      e?.stopPropagation();
      setMuted((prev) => !prev);
      revealControls();
    },
    [revealControls]
  );

  const handleVolumeChange = useCallback(
    (e) => {
      e.stopPropagation();
      const next = Number(e.target.value);
      setVolume(next);
      setMuted(next === 0);
      revealControls();
    },
    [revealControls]
  );

  const toggleFullscreen = useCallback(
    async (e) => {
      e?.stopPropagation();
      const el = containerRef.current;
      if (!el) return;

      try {
        if (!document.fullscreenElement) {
          await el.requestFullscreen();
          setIsFullscreen(true);
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      } catch {
        /* fullscreen not supported */
      }
      revealControls();
    },
    [revealControls]
  );

  useEffect(() => {
    const onFullscreenChange = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      if (fs) {
        clearFitSize();
      } else {
        fitPlayerToFrame();
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [clearFitSize, fitPlayerToFrame]);

  useEffect(() => {
    shouldAutoPlayRef.current = true;
    setPlaying(false);
    setPlayed(0);
    setPlayedSeconds(0);
    setDuration(0);
    setReady(false);
    setBuffering(true);
    setError("");
    setShowControls(true);
    clearFitSize();
    clearBufferTimer();
  }, [url, clearBufferTimer, clearFitSize]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
  }, [volume]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!containerRef.current) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          e.stopPropagation();
          togglePlay();
          break;
        case "m":
        case "M":
          e.preventDefault();
          e.stopPropagation();
          setMuted((prev) => !prev);
          revealControls();
          break;
        case "f":
        case "F":
          e.preventDefault();
          e.stopPropagation();
          toggleFullscreen();
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            seekBy(-10);
          }
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            seekBy(10);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [revealControls, seekBy, toggleFullscreen, togglePlay]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      clearBufferTimer();
    };
  }, [clearBufferTimer]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
    fitPlayerToFrame();
    setReady(true);
  }, [fitPlayerToFrame]);

  const handleLoadedData = useCallback(() => {
    fitPlayerToFrame();
  }, [fitPlayerToFrame]);

  useEffect(() => {
    if (!fitToFrame) return undefined;

    const container = containerRef.current;
    const stage = container?.parentElement;
    if (!stage) return undefined;

    const observer = new ResizeObserver(() => fitPlayerToFrame());
    observer.observe(stage);
    fitPlayerToFrame();

    return () => observer.disconnect();
  }, [fitToFrame, fitPlayerToFrame, url]);

  const handleCanPlay = useCallback(() => {
    clearBufferTimer();
    setBuffering(false);
    const video = videoRef.current;
    if (!video) return;

    if (shouldAutoPlayRef.current) {
      shouldAutoPlayRef.current = false;
      video.play().catch(() => setPlaying(false));
    }
    fitPlayerToFrame();
  }, [clearBufferTimer, fitPlayerToFrame]);

  const handleWaiting = useCallback(() => {
    clearBufferTimer();
    bufferTimerRef.current = setTimeout(() => setBuffering(true), 350);
  }, [clearBufferTimer]);

  const handlePlaying = useCallback(() => {
    clearBufferTimer();
    setBuffering(false);
    setPlaying(true);
  }, [clearBufferTimer]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    setShowControls(true);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }
    setPlayedSeconds(video.currentTime);
    setPlayed(video.currentTime / video.duration);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setShowControls(true);
  }, []);

  const handleVideoError = useCallback(() => {
    setError("Unable to play this video.");
    setBuffering(false);
    setPlaying(false);
  }, []);

  const VolumeIcon =
    muted || volume === 0 ? FaVolumeMute : volume < 0.5 ? FaVolumeDown : FaVolumeUp;

  const volumeLevel = muted ? 0 : volume;
  const volumePercent = Math.round(volumeLevel * 100);

  if (!url) return null;

  return (
    <div
      ref={containerRef}
      className={`vp-root ${showControls ? "vp-show-controls" : ""} ${
        isFullscreen ? "vp-fullscreen" : ""
      } ${fitToFrame ? "vp-fit-frame" : ""} ${className}`.trim()}
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="vp-stage">
        <video
          ref={videoRef}
          key={url}
          className="vp-video"
          src={url}
          playsInline
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleLoadedData}
          onCanPlay={handleCanPlay}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleVideoError}
        />

        <button
          type="button"
          className="vp-stage-hit"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        />

        {buffering && !error && (
          <div className="vp-buffering" aria-hidden="true">
            <span className="vp-spinner" />
          </div>
        )}

        {!playing && ready && !buffering && !error && (
          <div className="vp-center-play" aria-hidden="true">
            <FaPlay />
          </div>
        )}

        {error && <div className="vp-error">{error}</div>}
      </div>

      <div className="vp-top-bar">
        <span className="vp-title" title={getVideoFileName(fileName)}>
          {displayName}
        </span>
      </div>

      <div className="vp-controls">
        <div
          ref={progressRef}
          className="vp-progress"
          onClick={handleProgressClick}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={playedSeconds}
          aria-label="Seek"
        >
          <div className="vp-progress-track">
            <div
              className="vp-progress-fill"
              style={{ width: `${(played || 0) * 100}%` }}
            />
          </div>
        </div>

        <div className="vp-controls-row">
          <div className="vp-controls-left">
            <ApTooltip label={playing ? "Pause (K)" : "Play (K)"}>
              <button
                type="button"
                className="vp-btn"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <FaPause /> : <FaPlay />}
              </button>
            </ApTooltip>

            <ApTooltip label="Back 10s (Shift+←)">
              <button
                type="button"
                className="vp-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  seekBy(-10);
                }}
                aria-label="Back 10 seconds"
              >
                <MdReplay10 />
              </button>
            </ApTooltip>

            <ApTooltip label="Forward 10s (Shift+→)">
              <button
                type="button"
                className="vp-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  seekBy(10);
                }}
                aria-label="Forward 10 seconds"
              >
                <MdForward10 />
              </button>
            </ApTooltip>

            <span className="vp-time">
              {formatTime(playedSeconds)} / {formatTime(duration)}
            </span>
          </div>

          <div className="vp-controls-right">
            <div className="vp-volume">
              <ApTooltip label={muted ? "Unmute (M)" : "Mute (M)"}>
                <button
                  type="button"
                  className="vp-btn"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  <VolumeIcon />
                </button>
              </ApTooltip>
              <ApTooltip label={`Volume ${volumePercent}%`}>
                <div className="vp-volume-track">
                  <div className="vp-volume-rail" aria-hidden="true">
                    <div
                      className="vp-volume-fill"
                      style={{ width: `${volumePercent}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    className="vp-volume-slider"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volumeLevel}
                    onChange={handleVolumeChange}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Volume"
                  />
                </div>
              </ApTooltip>
            </div>

            <ApTooltip label={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}>
              <button
                type="button"
                className="vp-btn"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </ApTooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
