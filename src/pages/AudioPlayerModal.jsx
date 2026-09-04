import React, { useCallback, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import "../css/AudioPlayerModal.css";
import {
  FaPause,
  FaPlay,
  FaRandom,
  FaStepBackward,
  FaStepForward,
  FaTimes,
  FaMinus,
  FaVolumeDown,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { LuRepeat, LuRepeat1 } from "react-icons/lu";
import { TbRepeatOff } from "react-icons/tb";
import { resolveFileIconPath } from "../utils/fileIcon";
import ApTooltip from "../components/ApTooltip";

const REPEAT_OPTIONS = [
  { id: "off", label: "Repeat off", shortLabel: "Off", Icon: TbRepeatOff },
  { id: "once", label: "Repeat once", shortLabel: "Once", Icon: LuRepeat1 },
  { id: "on", label: "Loop track", shortLabel: "Loop", Icon: LuRepeat },
];

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getFileName = (fullPath) => {
  if (!fullPath) return "Unknown file";
  return fullPath.split("/").pop();
};

const getFolderPath = (fullPath) => {
  if (!fullPath || !fullPath.includes("/")) return "";
  return fullPath.split("/").slice(0, -1).join(" / ");
};

const truncateText = (text, maxLength = 30) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
};

const AudioPlayerModal = ({
  audioSrc,
  nextAudioSrc,
  fileName,
  onClose,
  onNext,
  onPrev,
  onShuffle,
  isShuffleEnabled,
  repeatMode,
  onSetRepeatMode,
}) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const miniRef = useRef(null);
  const miniDragStart = useRef({ x: 0, y: 0 });
  const hasRepeatedOnceRef = useRef(false);
  const lastSrcRef = useRef("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  const displayName = getFileName(fileName);
  const displayNameShort = truncateText(displayName, 30);
  const folderPath = getFolderPath(fileName);
  const fileIcon = resolveFileIconPath({ fileName: displayName });

  useEffect(() => {
    hasRepeatedOnceRef.current = false;
  }, [audioSrc]);

  useEffect(() => {
    if (!audioSrc) return undefined;
    document.body.classList.toggle("audio-player-active", !isMinimized);
    return () => document.body.classList.remove("audio-player-active");
  }, [audioSrc, isMinimized]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) audioEl.volume = volume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !audioSrc) return;
    if (lastSrcRef.current === audioSrc) return;

    lastSrcRef.current = audioSrc;
    audioEl.src = audioSrc;
    audioEl.load();
    audioEl.play().catch(() => {});
  }, [audioSrc]);

  useEffect(() => {
    if (!nextAudioSrc || nextAudioSrc === audioSrc) return undefined;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "audio";
    link.href = nextAudioSrc;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [nextAudioSrc, audioSrc]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return undefined;

    const onTimeUpdate = () => setCurrentTime(audioEl.currentTime);
    const onLoadedMetadata = () => setDuration(audioEl.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeatMode === "on") {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
        return;
      }
      if (repeatMode === "once") {
        if (!hasRepeatedOnceRef.current) {
          hasRepeatedOnceRef.current = true;
          audioEl.currentTime = 0;
          audioEl.play().catch(() => {});
          return;
        }
        hasRepeatedOnceRef.current = false;
      }
      setIsPlaying(false);
      onNext();
    };

    audioEl.addEventListener("timeupdate", onTimeUpdate);
    audioEl.addEventListener("loadedmetadata", onLoadedMetadata);
    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);
    audioEl.addEventListener("ended", onEnded);

    return () => {
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
      audioEl.removeEventListener("loadedmetadata", onLoadedMetadata);
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
      audioEl.removeEventListener("ended", onEnded);
    };
  }, [onNext, repeatMode]);

  const togglePlay = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (audioEl.paused) audioEl.play().catch(() => {});
    else audioEl.pause();
  }, []);

  const handleProgressClick = useCallback(
    (event) => {
      const bar = progressRef.current;
      const audioEl = audioRef.current;
      if (!bar || !audioEl || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      audioEl.currentTime = ratio * duration;
    },
    [duration]
  );

  const handleVolumeChange = useCallback((event) => {
    const audioEl = audioRef.current;
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
    if (audioEl) audioEl.volume = nextVolume;
  }, []);

  const toggleMute = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (isMuted || volume === 0) {
      const restored = volume > 0 ? volume : 0.85;
      setVolume(restored);
      setIsMuted(false);
      audioEl.volume = restored;
      return;
    }
    setIsMuted(true);
    audioEl.volume = 0;
  }, [isMuted, volume]);

  const handleClose = () => {
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.pause();
      audioEl.removeAttribute("src");
      audioEl.load();
    }
    lastSrcRef.current = "";
    setIsMinimized(false);
    onClose();
  };

  const handleMiniDragStart = (_e, data) => {
    miniDragStart.current = { x: data.x, y: data.y };
  };

  const handleMiniDragStop = (_e, data) => {
    const dx = Math.abs(data.x - miniDragStart.current.x);
    const dy = Math.abs(data.y - miniDragStart.current.y);
    if (dx < 6 && dy < 6) setIsMinimized(false);
  };

  if (!audioSrc) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const volumeLevel = isMuted ? 0 : volume;
  const volumePercent = Math.round(volumeLevel * 100);

  const VolumeIcon =
    volumeLevel === 0 ? FaVolumeMute : volumeLevel < 0.5 ? FaVolumeDown : FaVolumeUp;

  return (
    <>
      <audio ref={audioRef} preload="auto" className="ap-audio-el" />

      {isMinimized ? (
        <Draggable
          nodeRef={miniRef}
          bounds="body"
          cancel=".ap-mini-play"
          onStart={handleMiniDragStart}
          onStop={handleMiniDragStop}
        >
          <div
            ref={miniRef}
            className="ap-mini-widget"
          >
            <ApTooltip label="Expand player" placement="bottom" className="ap-mini-expand-tip">
              <div
                className="ap-mini-expand"
                role="button"
                tabIndex={0}
                aria-label="Expand audio player"
                onClick={() => setIsMinimized(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setIsMinimized(false);
                }}
              >
                <div className={`ap-mini-art${isPlaying ? " is-playing" : ""}`}>
                  <img src={fileIcon} alt="" />
                </div>
                <div className="ap-mini-meta">
                  <span className="ap-mini-title">{truncateText(displayName, 18)}</span>
                  <span className="ap-mini-time">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </ApTooltip>
            <ApTooltip label={isPlaying ? "Pause" : "Play"} placement="bottom">
              <button
                type="button"
                className="ap-mini-play"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
            </ApTooltip>
          </div>
        </Draggable>
      ) : (
        <div className="ap-bar" role="region" aria-label="Audio player">

      <div className="ap-bar-track">
        <div className="ap-bar-art">
          <img src={fileIcon} alt="" />
        </div>
        <div className="ap-bar-meta">
          <ApTooltip label={displayName}>
            <p className="ap-bar-title">{displayNameShort}</p>
          </ApTooltip>
          {folderPath ? (
            <ApTooltip label={folderPath}>
              <p className="ap-bar-sub">{folderPath}</p>
            </ApTooltip>
          ) : null}
        </div>
      </div>

      <div className="ap-bar-divider" aria-hidden="true" />

      <div className="ap-bar-center">
        <div className="ap-bar-progress">
          <span className="ap-bar-time">{formatTime(currentTime)}</span>
          <ApTooltip label="Seek">
            <div
              ref={progressRef}
              className="ap-bar-seek"
              onClick={handleProgressClick}
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              tabIndex={0}
            >
              <div className="ap-bar-seek-rail">
                <div className="ap-bar-seek-fill" style={{ width: `${progressPercent}%` }} />
                <div className="ap-bar-seek-thumb" style={{ left: `${progressPercent}%` }} />
              </div>
            </div>
          </ApTooltip>
          <span className="ap-bar-time">{formatTime(duration)}</span>
        </div>

        <div className="ap-bar-transport">
          <div className="ap-repeat-ctrl" role="group" aria-label="Repeat mode">
            {REPEAT_OPTIONS.map(({ id, label, shortLabel, Icon }) => (
              <ApTooltip key={id} label={label}>
                <button
                  type="button"
                  className={`ap-repeat-opt${repeatMode === id ? " is-active" : ""}`}
                  onClick={() => onSetRepeatMode(id)}
                  aria-label={label}
                  aria-pressed={repeatMode === id}
                >
                  <Icon aria-hidden="true" />
                  <span>{shortLabel}</span>
                </button>
              </ApTooltip>
            ))}
          </div>
          <ApTooltip label="Previous track">
            <button type="button" className="ap-icon-btn" onClick={onPrev} aria-label="Previous track">
              <FaStepBackward />
            </button>
          </ApTooltip>
          <ApTooltip label={isPlaying ? "Pause" : "Play"}>
            <button
              type="button"
              className="ap-play-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
          </ApTooltip>
          <ApTooltip label="Next track">
            <button type="button" className="ap-icon-btn" onClick={onNext} aria-label="Next track">
              <FaStepForward />
            </button>
          </ApTooltip>
          <ApTooltip label={isShuffleEnabled ? "Shuffle on" : "Shuffle off"}>
            <button
              type="button"
              className={`ap-icon-btn${isShuffleEnabled ? " is-active" : ""}`}
              onClick={onShuffle}
              aria-label={isShuffleEnabled ? "Shuffle on" : "Shuffle off"}
              aria-pressed={isShuffleEnabled}
            >
              <FaRandom />
            </button>
          </ApTooltip>
        </div>
      </div>

      <div className="ap-bar-divider" aria-hidden="true" />

      <div className="ap-bar-volume-section">
        <ApTooltip label={isMuted || volumeLevel === 0 ? "Unmute" : "Mute"}>
          <button
            type="button"
            className="ap-icon-btn"
            onClick={toggleMute}
            aria-label={isMuted || volumeLevel === 0 ? "Unmute" : "Mute"}
          >
            <VolumeIcon />
          </button>
        </ApTooltip>
        <ApTooltip label={`Volume ${volumePercent}%`} className="ap-volume-tip">
          <div className="ap-volume-track">
            <div className="ap-volume-rail" aria-hidden="true">
              <div className="ap-volume-fill" style={{ width: `${volumePercent}%` }} />
            </div>
            <input
              type="range"
              className="ap-volume-range"
              min="0"
              max="1"
              step="0.01"
              value={volumeLevel}
              onChange={handleVolumeChange}
              aria-label="Volume"
            />
          </div>
        </ApTooltip>
        <span className="ap-volume-pct">{volumePercent}%</span>
        <div className="ap-bar-window-btns">
          <ApTooltip label="Minimize">
            <button
              type="button"
              className="ap-icon-btn ap-minimize-btn"
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize player"
            >
              <FaMinus />
            </button>
          </ApTooltip>
          <ApTooltip label="Close player">
            <button
              type="button"
              className="ap-icon-btn ap-close-btn"
              onClick={handleClose}
              aria-label="Close player"
            >
              <FaTimes />
            </button>
          </ApTooltip>
        </div>
      </div>
        </div>
      )}
    </>
  );
};

export default AudioPlayerModal;
