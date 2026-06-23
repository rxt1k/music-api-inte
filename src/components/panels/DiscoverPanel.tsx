/**
 * DiscoverPanel – charts, trending, radio, similar, moods, top artists/tracks.
 */
import { useState } from "react";
import {
  getCharts, getTrending, getRadio, getSimilar,
  getMoods, getTopArtists, getTopTracks,
  type SearchResult,
} from "../../api/service";
import ErrorBox from "../ErrorBox";
import Spinner from "../Spinner";
import SongRow from "../SongRow";

interface DiscoverPanelProps {
  onPlay: (result: SearchResult) => void;
  playingId: string | null;
  loadingId: string | null;
}

const COUNTRIES = ["US", "GB", "DE", "FR", "JP", "IN", "BR", "AU", "CA", "KR"];

type Mode = "charts" | "trending" | "radio" | "similar" | "moods" | "topArtists" | "topTracks";

export default function DiscoverPanel({ onPlay, playingId, loadingId }: DiscoverPanelProps) {
  const [mode, setMode] = useState<Mode>("charts");
  const [country, setCountry] = useState("US");
  const [videoId, setVideoId] = useState("");
  const [simTitle, setSimTitle] = useState("");
  const [simArtist, setSimArtist] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normaliseToSongs = (data: unknown): SearchResult[] => {
    if (!data || typeof data !== "object") return [];
    const d = data as Record<string, unknown>;

    // Try various array fields
    const arr =
      (d.results as SearchResult[]) ??
      (d.charts as SearchResult[]) ??
      (d.tracks as SearchResult[]) ??
      (d.artists as SearchResult[]) ??
      (d.moods as SearchResult[]) ??
      [];
    return Array.isArray(arr) ? arr : [];
  };

  const fetch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setRaw(null);
    try {
      let data: unknown;
      if (mode === "charts") data = await getCharts(country);
      else if (mode === "trending") data = await getTrending(country);
      else if (mode === "radio") data = await getRadio(videoId.trim());
      else if (mode === "similar") data = await getSimilar(simTitle.trim(), simArtist.trim());
      else if (mode === "moods") data = await getMoods();
      else if (mode === "topArtists") data = await getTopArtists(country);
      else data = await getTopTracks(country);

      setRaw(data);
      setResults(normaliseToSongs(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const needsVideoId = mode === "radio";
  const needsSimilar = mode === "similar";
  const needsCountry = ["charts", "trending", "topArtists", "topTracks"].includes(mode);

  return (
    <div className="space-y-3">
      {/* Mode buttons */}
      <div className="flex flex-wrap gap-1">
        {(["charts","trending","radio","similar","moods","topArtists","topTracks"] as Mode[]).map((m) => (
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

      {/* Parameters */}
      <div className="flex flex-wrap gap-2 items-end">
        {needsCountry && (
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-2 py-2 outline-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        {needsVideoId && (
          <input
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Seed Video ID"
            className="flex-1 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
          />
        )}
        {needsSimilar && (
          <>
            <input
              value={simTitle}
              onChange={(e) => setSimTitle(e.target.value)}
              placeholder="Title"
              className="flex-1 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
            />
            <input
              value={simArtist}
              onChange={(e) => setSimArtist(e.target.value)}
              placeholder="Artist"
              className="flex-1 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
            />
          </>
        )}
        <button
          onClick={fetch}
          disabled={loading}
          className="bg-white text-black text-sm font-medium px-3 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {loading && <Spinner size={14} />}
          Fetch
        </button>
      </div>

      {error && <ErrorBox message={error} onRetry={fetch} onDismiss={() => setError(null)} />}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">{results.length} items</p>
          {results.map((r, i) => {
            const id = r.videoId ?? r.fallbackVideoId ?? r.browseId ?? "";
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

      {/* Raw JSON for non-song data (moods etc.) */}
      {raw != null && results.length === 0 && (
        <pre className="bg-neutral-800 rounded p-3 text-xs text-neutral-300 overflow-auto max-h-64 whitespace-pre-wrap">
          {JSON.stringify(raw, null, 2)}
        </pre>
      )}
    </div>
  );
}
