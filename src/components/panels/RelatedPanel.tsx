/**
 * RelatedPanel – /api/related/:videoId and /api/yt_search
 */
import { useState } from "react";
import { getRelated, ytSearch, type SearchResult } from "../../api/service";
import ErrorBox from "../ErrorBox";
import Spinner from "../Spinner";
import SongRow from "../SongRow";

interface RelatedPanelProps {
  onPlay: (result: SearchResult) => void;
  playingId: string | null;
  loadingId: string | null;
}

type Mode = "related" | "ytSearch";

export default function RelatedPanel({ onPlay, playingId, loadingId }: RelatedPanelProps) {
  const [mode, setMode] = useState<Mode>("related");
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      if (mode === "related") {
        const data = await getRelated(input.trim());
        setResults(data.results ?? []);
      } else {
        const data = await ytSearch(input.trim(), filter || undefined);
        setResults(data.results ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(["related","ytSearch"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              mode === m ? "bg-white text-black" : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetch()}
          placeholder={mode === "related" ? "Video ID" : "YouTube search query"}
          className="flex-1 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
        />
        {mode === "ytSearch" && (
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter (optional)"
            className="w-28 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
          />
        )}
        <button
          onClick={fetch}
          disabled={loading || !input.trim()}
          className="bg-white text-black text-sm font-medium px-3 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {loading && <Spinner size={14} />}
          Fetch
        </button>
      </div>

      {error && <ErrorBox message={error} onRetry={fetch} onDismiss={() => setError(null)} />}

      {results.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">{results.length} results</p>
          {results.map((r, i) => {
            const id = r.videoId ?? r.fallbackVideoId ?? "";
            return (
              <SongRow
                key={`${id}-${i}`}
                result={r}
                isPlaying={playingId === id}
                isLoading={loadingId === id}
                onPlay={onPlay}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
