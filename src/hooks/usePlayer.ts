/**
 * usePlayer – manages the HTML5 Audio element lifecycle.
 * Returns refs and state for the player bar.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface PlayerTrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnail?: string;
  duration?: number; // seconds
}

export interface PlayerState {
  track: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  playing: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
}

export function usePlayer() {
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  const [state, setState] = useState<PlayerState>({
    track: null,
    queue: [],
    queueIndex: -1,
    playing: false,
    loading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    error: null,
  });

  // Keep volume in sync with audio element
  useEffect(() => {
    audioRef.current.volume = state.volume;
  }, [state.volume]);

  // Wire up audio events once
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () =>
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    const onDurationChange = () =>
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    const onPlay = () => setState((s) => ({ ...s, playing: true, loading: false }));
    const onPause = () => setState((s) => ({ ...s, playing: false }));
    const onWaiting = () => setState((s) => ({ ...s, loading: true }));
    const onCanPlay = () => setState((s) => ({ ...s, loading: false }));
    const onEnded = () => {
      // auto-advance to next track
      setState((s) => {
        const nextIndex = s.queueIndex + 1;
        if (nextIndex < s.queue.length) {
          return { ...s, queueIndex: nextIndex, track: s.queue[nextIndex] };
        }
        return { ...s, playing: false };
      });
    };
    const onError = () => {
      const err = audio.error;
      let msg = "Audio playback error.";
      if (err) {
        if (err.code === MediaError.MEDIA_ERR_NETWORK)
          msg = "Network error while loading audio stream.";
        else if (err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
          msg = "Audio format not supported by this browser.";
        else if (err.code === MediaError.MEDIA_ERR_DECODE)
          msg = "Audio stream could not be decoded.";
        else msg = `Playback error (code ${err.code}): ${err.message}`;
      }
      console.error("[Player] Audio error:", err);
      setState((s) => ({ ...s, loading: false, playing: false, error: msg }));
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
    };
  }, []);

  // When track changes, load and play it
  const loadAndPlayRef = useRef<((track: PlayerTrack, url: string) => void) | null>(null);
  loadAndPlayRef.current = (track: PlayerTrack, url: string) => {
    const audio = audioRef.current;
    audio.pause();
    audio.src = url;
    audio.load();
    setState((s) => ({ ...s, track, playing: false, loading: true, error: null, currentTime: 0, duration: 0 }));
    audio.play().catch((e) => {
      console.error("[Player] play() rejected:", e);
      setState((s) => ({ ...s, loading: false, error: `Could not start playback: ${e.message}` }));
    });
  };

  const loadTrack = useCallback((track: PlayerTrack, url: string) => {
    loadAndPlayRef.current?.(track, url);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio.src) return;
    if (audio.paused) {
      audio.play().catch((e) => {
        console.error("[Player] play() rejected:", e);
        setState((s) => ({ ...s, error: `Could not resume: ${e.message}` }));
      });
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!isNaN(audio.duration)) {
      audio.currentTime = time;
      setState((s) => ({ ...s, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    audioRef.current.volume = v;
    setState((s) => ({ ...s, volume: v }));
  }, []);

  const setQueue = useCallback((tracks: PlayerTrack[], startIndex = 0) => {
    setState((s) => ({ ...s, queue: tracks, queueIndex: startIndex }));
  }, []);

  const playNext = useCallback(() => {
    setState((s) => {
      const nextIndex = s.queueIndex + 1;
      if (nextIndex < s.queue.length) {
        return { ...s, queueIndex: nextIndex, track: s.queue[nextIndex] };
      }
      return s;
    });
  }, []);

  const playPrev = useCallback(() => {
    setState((s) => {
      const prevIndex = s.queueIndex - 1;
      if (prevIndex >= 0) {
        return { ...s, queueIndex: prevIndex, track: s.queue[prevIndex] };
      }
      return s;
    });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    state,
    setState,
    loadTrack,
    togglePlay,
    seek,
    setVolume,
    setQueue,
    playNext,
    playPrev,
    clearError,
  };
}
