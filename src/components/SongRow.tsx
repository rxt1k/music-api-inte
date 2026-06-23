/**
 * SongRow – displays one song in a search-results list.
 * Clicking it calls onPlay with the videoId (or fallbackVideoId).
 */
import type { SearchResult } from "../api/service";
import { thumbUrl, truncate, formatTime } from "../utils/format";

interface SongRowProps {
  result: SearchResult;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: (result: SearchResult) => void;
}

export default function SongRow({ result, isPlaying, isLoading, onPlay }: SongRowProps) {
  const thumb = thumbUrl(result.thumbnails);
  const artistNames = result.artists?.map((a) => a.name).join(", ") ?? "Unknown Artist";
  const duration = result.duration ? formatTime(parseInt(result.duration, 10)) : "";
  const effectiveId = result.videoId ?? result.fallbackVideoId;

  return (
    <button
      onClick={() => onPlay(result)}
      disabled={!effectiveId}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded text-left
        transition-colors
        ${isPlaying ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}
        ${!effectiveId ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Artwork */}
      <div className="relative w-10 h-10 shrink-0">
        {thumb ? (
          <img src={thumb} alt={result.title} className="w-10 h-10 rounded object-cover" />
        ) : (
          <div className="w-10 h-10 rounded bg-neutral-700 flex items-center justify-center text-neutral-400">♪</div>
        )}
        {isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
            <span className="text-white text-xs">▶</span>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isPlaying ? "text-white" : "text-neutral-100"}`}>
          {truncate(result.title, 60)}
        </p>
        <p className="text-xs text-neutral-400 truncate">{artistNames}</p>
      </div>

      {/* Duration */}
      {duration && (
        <span className="text-xs text-neutral-500 shrink-0">{duration}</span>
      )}

      {/* Result type badge */}
      <span className="text-xs text-neutral-600 shrink-0 hidden sm:inline">{result.resultType}</span>
    </button>
  );
}
