/**
 * LyricsPanel – fetch and display synced lyrics.
 */
import { useState } from "react";
import { getLyrics, type LyricsResponse } from "../../api/service";
import ErrorBox from "../ErrorBox";
import Spinner from "../Spinner";

export default function LyricsPanel() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [data, setData] = useState<LyricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!title.trim() || !artist.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getLyrics(title.trim(), artist.trim());
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetch()}
          placeholder="Song title"
          className="flex-1 min-w-0 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
        />
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetch()}
          placeholder="Artist"
          className="flex-1 min-w-0 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
        />
        <button
          onClick={fetch}
          disabled={loading || !title.trim() || !artist.trim()}
          className="bg-white text-black text-sm font-medium px-3 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {loading && <Spinner size={14} />}
          Fetch
        </button>
      </div>

      {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

      {data && (
        <div className="space-y-2">
          <p className="text-xs text-neutral-400">
            Synced: {data.lyrics?.synced ? "✅ Yes" : "❌ No"} · Lines: {data.lyrics?.lines?.length ?? 0}
          </p>
          {data.lyrics?.lines && data.lyrics.lines.length > 0 ? (
            <div className="bg-neutral-800 rounded p-3 max-h-72 overflow-y-auto text-sm text-neutral-200 space-y-1">
              {data.lyrics.lines.map((line, i) => (
                <p key={i} className="leading-snug">
                  <span className="text-neutral-500 text-xs mr-2 font-mono">
                    {String(Math.floor(line.time / 60)).padStart(2, "0")}:{String(Math.floor(line.time % 60)).padStart(2, "0")}
                  </span>
                  {line.text || <span className="text-neutral-600">♪</span>}
                </p>
              ))}
            </div>
          ) : data.lyrics?.plain ? (
            <pre className="bg-neutral-800 rounded p-3 max-h-72 overflow-y-auto text-sm text-neutral-200 whitespace-pre-wrap font-sans">
              {data.lyrics.plain}
            </pre>
          ) : (
            <p className="text-neutral-500 text-sm">No lyrics available.</p>
          )}
        </div>
      )}
    </div>
  );
}
