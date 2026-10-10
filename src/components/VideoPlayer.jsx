import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
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
import { DualRingMark } from "./brandLoaders";
import { getVideoFileName } from "../utils/videoPlayer";
import { warmVideoPlaybackCache } from "../utils/videoPlaybackWarmup";
import { pauseGlobalAudioPlayer } from "../utils/mediaPlaybackGuard";
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

const VIDEO_ERR_CODEC =
  "This video format (10-bit HEVC / Main10) isn't supported by your browser. Please download the file to play it.";
const VIDEO_ERR_NETWORK =
  "Connection interrupted while loading the video. Check your network and try again.";

/** @param {number | undefined} code MediaError.code from HTMLMediaElement.error */
function getVideoPlaybackErrorMessage(code) {
  if (code === 2) return VIDEO_ERR_NETWORK;
  if (code === 1) return "";
  return VIDEO_ERR_CODEC;
}

/** Abort in-flight Range/media requests when switching or closing a video. */
function stopVideoNetwork(video) {
  if (!video) return;
  try {
    video.pause();
    video.removeAttribute("src");
    while (video.firstChild) {
      video.removeChild(video.firstChild);
    }
    video.load();
  } catch {
    /* ignore teardown errors */
  }
}

const VideoPlayer = ({
  url,
  fileSize = 0,
  fileName = "",
  className = "",
  fitToFrame = false,
}) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const hideTimerRef = useRef(null);
  const bufferTimerRef = useRef(null);
  const shouldAutoPlayRef = useRef(true);
  const warmAbortRef = useRef(null);

  const getInternalVideo = useCallback(() => {
    try {
      return playerRef.current?.getInternalPlayer?.() || null;
    } catch {
      return null;
    }
  }, []);

  const clearFitSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.removeProperty("width");
    container.style.removeProperty("height");
  }, []);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const fitPlayerToFrame = useCallback(() => {
    const container = containerRef.current;
    const video = getInternalVideo();
    if (!container || !fitToFrame || document.fullscreenElement) return;

    const stage = container.parentElement;
    if (!stage) return;

    let vw = video?.videoWidth;
    let vh = video?.videoHeight;
    if (!vw || !vh) {
      if (!error) return;
      vw = 16;
      vh = 9;
    }

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

    if (error) {
      w = Math.max(w, Math.min(maxW, 520));
      h = Math.max(h, Math.min(maxH, 300));
      if (w > maxW) w = maxW;
      if (h > maxH) h = maxH;
    }

    container.style.width = `${Math.floor(w)}px`;
    container.style.height = `${Math.floor(h)}px`;
  }, [fitToFrame, error, getInternalVideo]);

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
      setPlaying((prev) => {
        const next = !prev;
        if (next) pauseGlobalAudioPlayer();
        return next;
      });
      revealControls();
    },
    [revealControls]
  );

  const seekBy = useCallback(
    (delta) => {
      const player = playerRef.current;
      if (!player || !duration) return;
      const current = player.getCurrentTime?.() || 0;
      const next = Math.max(0, Math.min(duration, current + delta));
      setBuffering(true);
      player.seekTo(next, "seconds");
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
      const player = playerRef.current;
      if (!bar || !player || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const next = ratio * duration;
      setBuffering(true);
      player.seekTo(next, "seconds");
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
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [clearFitSize, fitPlayerToFrame]);

  useEffect(() => {
    shouldAutoPlayRef.current = true;
    setPlaying(false);
    setPlayed(0);
    setLoaded(0);
    setPlayedSeconds(0);
    setDuration(0);
    setReady(false);
    setBuffering(true);
    setError("");
    setShowControls(true);
    clearFitSize();
    clearBufferTimer();
  }, [url, clearBufferTimer, clearFitSize]);

  // Parallel Range warm (start + end) — does not block attaching the player.
  useEffect(() => {
    if (!url) return undefined;
    warmAbortRef.current?.abort?.();
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    warmAbortRef.current = controller;
    warmVideoPlaybackCache(url, {
      size: fileSize,
      signal: controller?.signal,
    });
    return () => {
      controller?.abort?.();
      if (warmAbortRef.current === controller) {
        warmAbortRef.current = null;
      }
    };
  }, [url, fileSize]);

  useEffect(() => {
    return () => {
      warmAbortRef.current?.abort?.();
      stopVideoNetwork(getInternalVideo());
    };
  }, [url, getInternalVideo]);

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
      stopVideoNetwork(getInternalVideo());
    };
  }, [clearBufferTimer, getInternalVideo]);

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

  const handleReady = useCallback(() => {
    setReady(true);
    fitPlayerToFrame();
    if (shouldAutoPlayRef.current) {
      shouldAutoPlayRef.current = false;
      pauseGlobalAudioPlayer();
      setPlaying(true);
    }
  }, [fitPlayerToFrame]);

  const handleDuration = useCallback((d) => {
    if (Number.isFinite(d) && d > 0) setDuration(d);
  }, []);

  const handleProgress = useCallback((state) => {
    if (!state) return;
    if (Number.isFinite(state.played)) setPlayed(state.played);
    if (Number.isFinite(state.loaded)) setLoaded(state.loaded);
    if (Number.isFinite(state.playedSeconds)) {
      setPlayedSeconds(state.playedSeconds);
    }
  }, []);

  const handleBuffer = useCallback(() => {
    clearBufferTimer();
    bufferTimerRef.current = setTimeout(() => setBuffering(true), 350);
  }, [clearBufferTimer]);

  const handleBufferEnd = useCallback(() => {
    clearBufferTimer();
    setBuffering(false);
  }, [clearBufferTimer]);

  const handlePlay = useCallback(() => {
    clearBufferTimer();
    setBuffering(false);
    setPlaying(true);
    pauseGlobalAudioPlayer();
  }, [clearBufferTimer]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    setShowControls(true);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setShowControls(true);
  }, []);

  const handleError = useCallback(() => {
    const code = getInternalVideo()?.error?.code;
    const message = getVideoPlaybackErrorMessage(code);
    setError(message);
    setBuffering(false);
    setPlaying(false);
  }, [getInternalVideo]);

  const VolumeIcon =
    muted || volume === 0 ? FaVolumeMute : volume < 0.5 ? FaVolumeDown : FaVolumeUp;

  const volumeLevel = muted ? 0 : volume;
  const volumePercent = Math.round(volumeLevel * 100);

  if (!url) return null;

  return (
    <div
      ref={containerRef}
      className={`vp-root ${showControls && !error ? "vp-show-controls" : ""} ${
        isFullscreen ? "vp-fullscreen" : ""
      } ${fitToFrame ? "vp-fit-frame" : ""} ${
        error ? "vp-has-error" : ""
      } ${className}`.trim()}
      onMouseMove={error ? undefined : revealControls}
      onMouseLeave={() => !error && playing && setShowControls(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="vp-stage">
        <div className="vp-react-player">
          <ReactPlayer
            key={url}
            ref={playerRef}
            url={url}
            width="100%"
            height="100%"
            playing={playing && !error}
            muted={muted}
            volume={volumeLevel}
            controls={false}
            playsinline
            progressInterval={400}
            stopOnUnmount
            config={{
              file: {
                attributes: {
                  preload: "auto",
                  playsInline: true,
                  className: "vp-video",
                },
                forceVideo: true,
              },
            }}
            onReady={handleReady}
            onDuration={handleDuration}
            onProgress={handleProgress}
            onBuffer={handleBuffer}
            onBufferEnd={handleBufferEnd}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
          />
        </div>

        {!error && (
          <button
            type="button"
            className="vp-stage-hit"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          />
        )}

        {buffering && !error && (
          <div className="vp-buffering" aria-hidden="true">
            <DualRingMark size={36} />
          </div>
        )}

        {!playing && ready && !buffering && !error && (
          <div className="vp-center-play" aria-hidden="true">
            <FaPlay />
          </div>
        )}

        {error && (
          <div className="vp-error" role="alert">
            <p className="vp-error-text">{error}</p>
          </div>
        )}
      </div>

      <div className="vp-top-bar">
        <span className="vp-title" title={getVideoFileName(fileName)}>
          {displayName}
        </span>
      </div>

      {!error && (
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
                className="vp-progress-loaded"
                style={{ width: `${(loaded || 0) * 100}%` }}
              />
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

              <ApTooltip
                label={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
              >
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
      )}
    </div>
  );
};

export default VideoPlayer;
