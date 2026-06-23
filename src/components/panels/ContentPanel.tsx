/**
 * ContentPanel – inspect /api/songs, /api/albums, /api/artists, /api/playlists, /api/chain
 */
import { useState } from "react";
import {
  getSong, getAlbum, getArtist, getPlaylist, getChain,
  type AlbumTrack, type SearchResult,
} from "../../api/service";
import ErrorBox from "../ErrorBox";
import Spinner from "../Spinner";
import SongRow from "../SongRow";

interface ContentPanelProps {
  onPlay: (result: SearchResult) => void;
  playingId: string | null;
  loadingId: string | null;
}

type ContentMode = "song" | "album" | "artist" | "playlist" | "chain";

export default function ContentPanel({ onPlay, playingId, loadingId }: ContentPanelProps) {
  const [mode, setMode] = useState<ContentMode>("song");
  const [id, setId] = useState("");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      let res: unknown;
      if (mode === "song") res = await getSong(id.trim());
      else if (mode === "album") res = await getAlbum(id.trim());
      else if (mode === "artist") res = await getArtist(id.trim());
      else if (mode === "playlist") res = await getPlaylist(id.trim());
      else res = await getChain(id.trim());
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  /** Extract playable tracks from any content response */
  const extractTracks = (raw: unknown): SearchResult[] => {
    if (!raw || typeof raw !== "object") return [];
    const d = raw as Record<string, unknown>;

    const tracks: AlbumTrack[] =
      ((d.album as Record<string, unknown>)?.tracks as AlbumTrack[]) ??
      ((d.playlist as Record<string, unknown>)?.tracks as AlbumTrack[]) ??
      (d.tracks as AlbumTrack[]) ??
      [];

    return tracks
      .filter((t) => t.videoId)
      .map((t) => ({
        title: t.title,
        videoId: t.videoId,
        duration: t.duration,
        artists: t.artists,
        thumbnails: [],
        resultType: "song" as const,
      }));
  };

  const tracks = data ? extractTracks(data) : [];

  const placeholders: Record<ContentMode, string> = {
    song: "videoId (e.g. H3Kzh6RrnMc)",
    album: "browseId (e.g. MPREb_...)",
    artist: "browseId (e.g. UCIaFw5...)",
    playlist: "playlistId (e.g. PLxx...)",
    chain: "videoId (e.g. H3Kzh6RrnMc)",
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {(["song","album","artist","playlist","chain"] as ContentMode[]).map((m) => (
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

      <div className="flex gap-2">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetch()}
          placeholder={placeholders[mode]}
          className="flex-1 bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-neutral-400 placeholder-neutral-500"
        />
        <button
          onClick={fetch}
          disabled={loading || !id.trim()}
          className="bg-white text-black text-sm font-medium px-3 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {loading && <Spinner size={14} />}
          Fetch
        </button>
      </div>

      {error && <ErrorBox message={error} onRetry={fetch} onDismiss={() => setError(null)} />}

      {/* Tracks */}
      {tracks.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">{tracks.length} playable tracks</p>
          {tracks.map((r, i) => (
            <SongRow
              key={`${r.videoId}-${i}`}
              result={r}
              isPlaying={playingId === r.videoId}
              isLoading={loadingId === r.videoId}
              onPlay={onPlay}
            />
          ))}
        </div>
      )}

      {/* Raw JSON */}
      {data != null && tracks.length === 0 && (
        <pre className="bg-neutral-800 rounded p-3 text-xs text-neutral-300 overflow-auto max-h-64 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
