/**
 * StreamPanel – test /api/stream directly with a video ID.
 * Shows raw stream response and lets user pick which URL to play.
 */
import { useState } from "react";
import { getStream, buildProxyUrl, type StreamResponse } from "../../api/service";
import ErrorBox from "../ErrorBox";
import Spinner from "../Spinner";

interface StreamPanelProps {
  onPlayUrl: (url: string, label: string) => void;
}

export default function StreamPanel({ onPlayUrl }: StreamPanelProps) {
  const [videoId, setVideoId] = useState("");
  const [data, setData] = useState<StreamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStream = async () => {
    if (!videoId.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getStream(videoId.trim());
      setData(res);
      if (!res.streamingUrls?.length) {
        setError("API returned success but no streaming URLs. The stream may be unavailable.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchStream()}
          placeholder="Video ID (e.g. H3Kzh6RrnMc)"
          className="flex-1 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
        />
        <button
          onClick={fetchStream}
          disabled={loading || !videoId.trim()}
          className="bg-white text-black text-sm font-medium px-3 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {loading && <Spinner size={14} />}
          Fetch
        </button>
      </div>

      {error && <ErrorBox message={error} onRetry={fetchStream} onDismiss={() => setError(null)} />}

      {data && (
        <div className="space-y-2">
          <div className="text-xs text-neutral-400 space-y-0.5">
            <p><span className="text-neutral-500">Service:</span> {data.service ?? "—"}</p>
            <p><span className="text-neutral-500">Instance:</span> {data.instance ?? "—"}</p>
            <p><span className="text-neutral-500">Streams:</span> {data.streamingUrls?.length ?? 0}</p>
            <p><span className="text-neutral-500">Timestamp:</span> {data.timestamp ?? "—"}</p>
          </div>

          {(data.streamingUrls ?? []).map((u, i) => (
            <div key={i} className="bg-neutral-800 rounded p-2 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-neutral-300 font-mono">
                  itag:{u.itag ?? "?"} · {u.type ?? "unknown"} · {u.audioQuality ?? "?"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onPlayUrl(u.url, `Stream ${i + 1} (proxy)`)}
                    className="bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded text-white transition-colors"
                  >
                    ▶ Proxy URL
                  </button>
                  {u.directUrl && (
                    <button
                      onClick={() => onPlayUrl(u.directUrl!, `Stream ${i + 1} (direct)`)}
                      className="bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded text-white transition-colors"
                    >
                      ▶ Direct URL
                    </button>
                  )}
                  <button
                    onClick={() => onPlayUrl(buildProxyUrl(u.url), `Stream ${i + 1} (API proxy)`)}
                    className="bg-blue-900 hover:bg-blue-800 px-2 py-1 rounded text-white transition-colors"
                  >
                    ▶ API Proxy
                  </button>
                </div>
              </div>
              <p className="text-neutral-500 truncate font-mono">{u.url}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
