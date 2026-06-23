/**
 * Verome API Tester
 * ─────────────────
 * A lightweight music streaming client to test every endpoint of the Verome API.
 *
 * Architecture:
 *  - src/api/client.ts       – axios instance with logging & error normalisation
 *  - src/api/service.ts      – all API endpoint functions + TypeScript types
 *  - src/hooks/usePlayer.ts  – HTML5 Audio state management
 *  - src/components/         – small, focused UI components
 *  - .env                    – VITE_API_BASE_URL (change to proxy if needed)
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  search,
  getStream,
  type SearchResult,
} from "./api/service";
import type { SearchFilter } from "./components/SearchBar";
import { usePlayer } from "./hooks/usePlayer";
import { pickBestStream, thumbUrl } from "./utils/format";

import SearchBar from "./components/SearchBar";
import SongRow from "./components/SongRow";
import PlayerBar from "./components/PlayerBar";
import ErrorBox from "./components/ErrorBox";
import Spinner from "./components/Spinner";

import StreamPanel from "./components/panels/StreamPanel";
import LyricsPanel from "./components/panels/LyricsPanel";
import DiscoverPanel from "./components/panels/DiscoverPanel";
import ContentPanel from "./components/panels/ContentPanel";
import InfoPanel from "./components/panels/InfoPanel";
import RelatedPanel from "./components/panels/RelatedPanel";

// ─── Tab definitions ──────────────────────────────────────────────────────────
type Tab = "search" | "discover" | "content" | "stream" | "lyrics" | "info" | "related";

const TABS: { id: Tab; label: string }[] = [
  { id: "search",   label: "🔍 Search" },
  { id: "discover", label: "🌐 Discover" },
  { id: "content",  label: "📁 Content" },
  { id: "stream",   label: "📡 Stream" },
  { id: "lyrics",   label: "🎵 Lyrics" },
  { id: "info",     label: "ℹ Info" },
  { id: "related",  label: "🔗 Related" },
];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("search");

  // Search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState({ q: "", filter: "" as SearchFilter });

  // Per-song loading tracking
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { state: playerState, loadTrack, togglePlay, seek, setVolume, setQueue, playNext, playPrev, clearError, setState: setPlayerState } = usePlayer();

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (q: string, filter: SearchFilter) => {
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);
    setContinuationToken(null);
    setLastQuery({ q, filter });
    try {
      const data = await search(q, filter || undefined);
      setSearchResults(data.results ?? []);
      setContinuationToken(data.continuationToken ?? null);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : String(e));
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!continuationToken || searchLoading) return;
    setSearchLoading(true);
    try {
      const data = await search(lastQuery.q, lastQuery.filter || undefined, continuationToken);
      setSearchResults((prev) => [...prev, ...(data.results ?? [])]);
      setContinuationToken(data.continuationToken ?? null);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : String(e));
    } finally {
      setSearchLoading(false);
    }
  }, [continuationToken, searchLoading, lastQuery]);

  // ── Play a song from any panel ─────────────────────────────────────────────
  /**
   * Resolves stream URL for a given song result, then starts playback.
   * Strategy:
   *   1. Call /api/stream?id=videoId
   *   2. If streamingUrls is empty AND fallbackVideoId exists, retry with fallback
   *   3. Pick best URL (prefer mp4/itag 140)
   *   4. Try direct URL first; on error fall back to the Invidious proxy URL
   */
  const handlePlay = useCallback(
    async (result: SearchResult) => {
      const effectiveId = result.videoId ?? result.fallbackVideoId;
      if (!effectiveId) {
        console.warn("[App] No playable ID for", result.title);
        return;
      }

      setLoadingId(effectiveId);

      try {
        // Fetch stream info
        let streamData = await getStream(effectiveId);

        // If empty and a fallback exists, try the fallback
        if (
          (!streamData.streamingUrls || streamData.streamingUrls.length === 0) &&
          result.fallbackVideoId &&
          result.fallbackVideoId !== effectiveId
        ) {
          console.warn("[App] Primary stream empty, trying fallbackVideoId:", result.fallbackVideoId);
          streamData = await getStream(result.fallbackVideoId);
        }

        if (!streamData.streamingUrls?.length) {
          throw new Error("No streaming URLs returned by the API for this track.");
        }

        // Pick best format (mp4 preferred for browser compat)
        const bestUrl = pickBestStream(streamData.streamingUrls);
        if (!bestUrl) throw new Error("Could not select a stream URL.");

        const track = {
          videoId: effectiveId,
          title: result.title,
          artist: result.artists?.map((a) => a.name).join(", ") ?? "Unknown Artist",
          thumbnail: thumbUrl(result.thumbnails),
          duration: result.duration ? parseInt(result.duration, 10) : undefined,
        };

        loadTrack(track, bestUrl);

        // Build queue from current search results (songs only)
        const playableSongs = searchResults.filter((r) => r.videoId ?? r.fallbackVideoId);
        const queueIdx = playableSongs.findIndex(
          (r) => (r.videoId ?? r.fallbackVideoId) === effectiveId
        );
        if (queueIdx !== -1) {
          setQueue(
            playableSongs.map((r) => ({
              videoId: r.videoId ?? r.fallbackVideoId ?? "",
              title: r.title,
              artist: r.artists?.map((a) => a.name).join(", ") ?? "Unknown Artist",
              thumbnail: thumbUrl(r.thumbnails),
              duration: r.duration ? parseInt(r.duration, 10) : undefined,
            })),
            queueIdx
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[App] Stream fetch failed:", e);
        setPlayerState((s) => ({ ...s, error: msg, loading: false }));
      } finally {
        setLoadingId(null);
      }
    },
    [loadTrack, searchResults, setQueue, setPlayerState]
  );

  // ── Play raw URL from StreamPanel ──────────────────────────────────────────
  const handlePlayUrl = useCallback(
    (url: string, label: string) => {
      const track = {
        videoId: "__direct__",
        title: label,
        artist: "Direct URL",
        thumbnail: undefined,
      };
      loadTrack(track, url);
    },
    [loadTrack]
  );

  // ── Handle queue-driven track changes (Prev/Next buttons) ──────────────────
  // We track the previous index via a ref so we only re-fetch when it changes.
  const prevQueueIndexRef = useRef(-1);
  useEffect(() => {
    const idx = playerState.queueIndex;
    if (idx !== -1 && idx !== prevQueueIndexRef.current && playerState.queue[idx]) {
      prevQueueIndexRef.current = idx;
      const qTrack = playerState.queue[idx];
      handlePlay({
        title: qTrack.title,
        videoId: qTrack.videoId,
        artists: [{ name: qTrack.artist }],
        thumbnails: qTrack.thumbnail ? [{ url: qTrack.thumbnail }] : [],
        resultType: "song",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerState.queueIndex]);

  const currentId = playerState.track?.videoId ?? null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">Verome</span>
          <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">API Tester</span>
        </div>
        <a
          href="https://verome-api.deno.dev"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          API Docs ↗
        </a>
      </header>

      {/* Tab bar */}
      <nav className="bg-neutral-900 border-b border-neutral-800 px-4 flex gap-1 overflow-x-auto shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-3 py-3 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-white text-white"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 pb-24">
        {/* ── Search Tab ── */}
        {activeTab === "search" && (
          <div className="space-y-4 max-w-2xl">
            <SearchBar onSearch={handleSearch} loading={searchLoading} />

            {searchError && (
              <ErrorBox
                message={searchError}
                onRetry={() => handleSearch(lastQuery.q, lastQuery.filter)}
                onDismiss={() => setSearchError(null)}
              />
            )}

            {searchLoading && searchResults.length === 0 && (
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <Spinner size={16} />
                Searching…
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">{searchResults.length} results</p>
                {searchResults.map((r, i) => {
                  const id = r.videoId ?? r.fallbackVideoId ?? r.browseId ?? `result-${i}`;
                  const effectiveId = r.videoId ?? r.fallbackVideoId;
                  return (
                    <SongRow
                      key={`${id}-${i}`}
                      result={r}
                      isPlaying={currentId === effectiveId && !!effectiveId}
                      isLoading={loadingId === effectiveId && !!effectiveId}
                      onPlay={handlePlay}
                    />
                  );
                })}

                {continuationToken && (
                  <button
                    onClick={handleLoadMore}
                    disabled={searchLoading}
                    className="w-full mt-2 text-sm text-neutral-400 hover:text-white py-2 border border-neutral-700 rounded hover:border-neutral-500 transition-colors flex items-center justify-center gap-2"
                  >
                    {searchLoading ? <Spinner size={14} /> : null}
                    {searchLoading ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>
            )}

            {!searchLoading && searchResults.length === 0 && !searchError && (
              <div className="text-neutral-600 text-sm text-center py-12">
                Search for songs, artists, albums, or playlists
              </div>
            )}
          </div>
        )}

        {/* ── Discover Tab ── */}
        {activeTab === "discover" && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-neutral-300 mb-3">Discovery Endpoints</h2>
            <DiscoverPanel
              onPlay={handlePlay}
              playingId={currentId}
              loadingId={loadingId}
            />
          </div>
        )}

        {/* ── Content Tab ── */}
        {activeTab === "content" && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-neutral-300 mb-3">Content Endpoints</h2>
            <ContentPanel
              onPlay={handlePlay}
              playingId={currentId}
              loadingId={loadingId}
            />
          </div>
        )}

        {/* ── Stream Tab ── */}
        {activeTab === "stream" && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-neutral-300 mb-1">Stream Endpoint</h2>
            <p className="text-xs text-neutral-500 mb-3">
              /api/stream?id= · Tests stream URL resolution. Proxy URL routes through the Invidious instance; API Proxy routes through the Verome /api/proxy endpoint.
            </p>
            <StreamPanel onPlayUrl={handlePlayUrl} />
          </div>
        )}

        {/* ── Lyrics Tab ── */}
        {activeTab === "lyrics" && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-neutral-300 mb-1">Lyrics Endpoint</h2>
            <p className="text-xs text-neutral-500 mb-3">/api/lyrics?title=&artist= · Synced LRC lyrics from LRCLib</p>
            <LyricsPanel />
          </div>
        )}

        {/* ── Info Tab ── */}
        {activeTab === "info" && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-neutral-300 mb-1">Info Endpoints</h2>
            <p className="text-xs text-neutral-500 mb-3">/api/artist/info · /api/track/info · Last.fm data</p>
            <InfoPanel />
          </div>
        )}

        {/* ── Related Tab ── */}
        {activeTab === "related" && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-neutral-300 mb-1">Related / YT Search</h2>
            <p className="text-xs text-neutral-500 mb-3">/api/related/:videoId · /api/yt_search</p>
            <RelatedPanel
              onPlay={handlePlay}
              playingId={currentId}
              loadingId={loadingId}
            />
          </div>
        )}
      </main>

      {/* Sticky player */}
      <PlayerBar
        state={playerState}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onVolume={setVolume}
        onNext={playNext}
        onPrev={playPrev}
        onDismissError={clearError}
      />
    </div>
  );
}
