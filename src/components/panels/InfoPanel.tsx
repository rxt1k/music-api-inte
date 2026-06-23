/**
 * InfoPanel – test /api/artist/info and /api/track/info (Last.fm data)
 */
import { useState } from "react";
import { getArtistInfo, getTrackInfo } from "../../api/service";
import ErrorBox from "../ErrorBox";
import Spinner from "../Spinner";

type InfoMode = "artist" | "track";

export default function InfoPanel() {
  const [mode, setMode] = useState<InfoMode>("artist");
  const [name, setName] = useState("");
  const [artist, setArtist] = useState("");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      if (mode === "artist") {
        const res = await getArtistInfo(name.trim());
        setData(res);
      } else {
        const res = await getTrackInfo(name.trim(), artist.trim());
        setData(res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const d = data as Record<string, string | string[] | boolean | number | null | undefined> | null;

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(["artist","track"] as InfoMode[]).map((m) => (
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetch()}
          placeholder={mode === "artist" ? "Artist name" : "Track title"}
          className="flex-1 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
        />
        {mode === "track" && (
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetch()}
            placeholder="Artist name"
            className="flex-1 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
          />
        )}
        <button
          onClick={fetch}
          disabled={loading || !name.trim()}
          className="bg-white text-black text-sm font-medium px-3 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {loading && <Spinner size={14} />}
          Fetch
        </button>
      </div>

      {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

      {d && (
        <div className="space-y-2 text-sm text-neutral-200">
          {d.bio != null && (
            <p className="text-neutral-300 text-xs leading-relaxed bg-neutral-800 rounded p-3 max-h-40 overflow-y-auto">
              {String(d.bio)}
            </p>
          )}
          {d.wiki != null && (
            <p className="text-neutral-300 text-xs leading-relaxed bg-neutral-800 rounded p-3 max-h-40 overflow-y-auto">
              {String(d.wiki)}
            </p>
          )}
          <div className="text-xs text-neutral-400 space-y-0.5">
            {d.listeners != null && <p>Listeners: {String(d.listeners)}</p>}
            {d.playcount != null && <p>Play count: {String(d.playcount)}</p>}
            {Array.isArray(d.tags) && <p>Tags: {(d.tags as string[]).join(", ")}</p>}
            {d.url != null && (
              <p>
                <a href={String(d.url)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                  View on Last.fm ↗
                </a>
              </p>
            )}
          </div>
          {/* Fallback: raw JSON */}
          {!d.bio && !d.wiki && (
            <pre className="bg-neutral-800 rounded p-3 text-xs text-neutral-300 overflow-auto max-h-64 whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
