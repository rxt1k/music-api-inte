/**
 * PlayerBar – sticky bottom player with play/pause, seek, volume, prev/next.
 */
import { useCallback } from "react";
import type { PlayerState } from "../hooks/usePlayer";
import { formatTime } from "../utils/format";
import Spinner from "./Spinner";

interface PlayerBarProps {
  state: PlayerState;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onVolume: (v: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onDismissError: () => void;
}

export default function PlayerBar({
  state,
  onTogglePlay,
  onSeek,
  onVolume,
  onNext,
  onPrev,
  onDismissError,
}: PlayerBarProps) {
  const { track, playing, loading, currentTime, duration, volume, error, queue, queueIndex } = state;

  const hasPrev = queueIndex > 0;
  const hasNext = queueIndex < queue.length - 1;

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSeek(parseFloat(e.target.value));
    },
    [onSeek]
  );

  const handleVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolume(parseFloat(e.target.value));
    },
    [onVolume]
  );

  if (!track && !error) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 z-50 px-4 py-2">
      {error && (
        <div className="text-xs text-red-400 bg-red-950/60 border border-red-800 rounded px-2 py-1 mb-2 flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={onDismissError} className="ml-2 hover:text-red-200">✕</button>
        </div>
      )}

      {track && (
        <div className="flex items-center gap-3">
          {/* Artwork */}
          {track.thumbnail ? (
            <img
              src={track.thumbnail}
              alt={track.title}
              className="w-10 h-10 rounded object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-neutral-700 shrink-0 flex items-center justify-center text-neutral-400 text-lg">♪</div>
          )}

          {/* Track info */}
          <div className="min-w-0 w-36 shrink-0">
            <p className="text-white text-xs font-medium truncate">{track.title}</p>
            <p className="text-neutral-400 text-xs truncate">{track.artist}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="text-neutral-400 hover:text-white disabled:opacity-30 transition-colors text-lg leading-none"
              title="Previous"
            >
              ⏮
            </button>

            <button
              onClick={onTogglePlay}
              disabled={loading}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-60"
              title={playing ? "Pause" : "Play"}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
              ) : playing ? (
                <span className="text-sm">⏸</span>
              ) : (
                <span className="text-sm">▶</span>
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasNext}
              className="text-neutral-400 hover:text-white disabled:opacity-30 transition-colors text-lg leading-none"
              title="Next"
            >
              ⏭
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-neutral-400 text-xs w-10 text-right shrink-0">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-white h-1 cursor-pointer"
              style={{ minWidth: 60 }}
            />
            <span className="text-neutral-400 text-xs w-10 shrink-0">{formatTime(duration)}</span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1 shrink-0 w-24">
            <span className="text-neutral-400 text-xs">
              {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolume}
              className="flex-1 accent-white h-1 cursor-pointer"
            />
          </div>

          {/* Loading badge */}
          {loading && (
            <div className="shrink-0 flex items-center gap-1 text-xs text-neutral-400">
              <Spinner size={12} />
              <span>Loading</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
