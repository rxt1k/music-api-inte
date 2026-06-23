/**
 * Verome API Service
 * ──────────────────
 * All API endpoints are defined here. To change an endpoint, edit only this file.
 * All functions use async/await and let errors propagate so callers can handle them.
 */
import client from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Thumbnail {
  url: string;
}

export interface Artist {
  name: string;
  id?: string;
  browseId?: string;
}

export interface SearchResult {
  title: string;
  thumbnails: Thumbnail[];
  videoId?: string;
  browseId?: string;
  artists?: Artist[];
  resultType: "song" | "album" | "artist" | "playlist" | "video";
  fallbackVideoId?: string;
  fallbackTitle?: string;
  duration?: string;
  year?: string;
  isTopResult?: boolean;
  subtitle?: string;
}

export interface SearchResponse {
  query: string;
  filter?: string;
  results: SearchResult[];
  continuationToken?: string | null;
}

export interface SuggestionResponse {
  suggestions: string[];
}

export interface StreamingUrl {
  url: string;
  directUrl?: string;
  bitrate?: string;
  type?: string;
  audioQuality?: string;
  itag?: string;
}

export interface StreamResponse {
  success: boolean;
  service?: string;
  instance?: string;
  streamingUrls: StreamingUrl[];
  metadata?: Record<string, unknown>;
  requestedId?: string;
  timestamp?: string;
}

export interface SongDetail {
  videoId: string;
  title: string;
  duration?: string;
  thumbnail?: string;
}

export interface SongResponse {
  success: boolean;
  song: SongDetail;
  artist?: { name: string; browseId: string } | null;
  album?: { name: string; browseId: string } | null;
}

export interface AlbumTrack {
  title: string;
  videoId?: string;
  duration?: string;
  artists?: Artist[];
}

export interface AlbumResponse {
  success: boolean;
  album?: {
    title: string;
    thumbnail?: string;
    year?: string;
    description?: string;
    tracks?: AlbumTrack[];
    artist?: { name: string; browseId: string };
  };
}

export interface ArtistResponse {
  success: boolean;
  artist?: {
    name: string;
    thumbnail?: string;
    description?: string;
    browseId?: string;
  };
  albums?: SearchResult[];
  singles?: SearchResult[];
}

export interface PlaylistResponse {
  success: boolean;
  playlist?: {
    title: string;
    thumbnail?: string;
    tracks?: AlbumTrack[];
  };
}

export interface LyricsLine {
  time: number; // seconds
  text: string;
}

export interface LyricsResponse {
  success: boolean;
  lyrics?: {
    lines?: LyricsLine[];
    plain?: string;
    synced?: boolean;
  };
  error?: string;
}

export interface ChartItem {
  title?: string;
  name?: string;
  thumbnails?: Thumbnail[];
  videoId?: string;
  browseId?: string;
  artists?: Artist[];
  rank?: number;
}

export interface ChartsResponse {
  country?: string;
  charts?: ChartItem[];
  results?: ChartItem[];
}

export interface RadioResponse {
  success: boolean;
  tracks?: SearchResult[];
  results?: SearchResult[];
}

export interface ArtistInfoResponse {
  success?: boolean;
  artist?: string;
  bio?: string;
  tags?: string[];
  listeners?: string;
  playcount?: string;
  url?: string;
}

export interface TrackInfoResponse {
  success?: boolean;
  title?: string;
  artist?: string;
  listeners?: string;
  playcount?: string;
  url?: string;
  tags?: string[];
  wiki?: string;
}

export interface MoodsResponse {
  moods?: Array<{ title: string; params?: string; browseId?: string }>;
  results?: unknown[];
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** Search YouTube Music. filter: songs | albums | artists | playlists | videos */
export async function search(
  q: string,
  filter?: string,
  continuationToken?: string
): Promise<SearchResponse> {
  const params: Record<string, string> = { q };
  if (filter) params.filter = filter;
  if (continuationToken) params.continuationToken = continuationToken;
  const res = await client.get<SearchResponse>("/api/search", { params });
  return res.data;
}

/** YouTube (not YT Music) search */
export async function ytSearch(q: string, filter?: string): Promise<SearchResponse> {
  const params: Record<string, string> = { q };
  if (filter) params.filter = filter;
  const res = await client.get<SearchResponse>("/api/yt_search", { params });
  return res.data;
}

/** Autocomplete suggestions */
export async function getSuggestions(q: string): Promise<SuggestionResponse> {
  const res = await client.get<SuggestionResponse>("/api/search/suggestions", {
    params: { q },
  });
  return res.data;
}

// ─── Content ──────────────────────────────────────────────────────────────────

/** Song detail + artist/album links */
export async function getSong(videoId: string): Promise<SongResponse> {
  const res = await client.get<SongResponse>(`/api/songs/${videoId}`);
  return res.data;
}

/** Album detail + tracks */
export async function getAlbum(browseId: string): Promise<AlbumResponse> {
  const res = await client.get<AlbumResponse>(`/api/albums/${browseId}`);
  return res.data;
}

/** Artist detail + discography */
export async function getArtist(browseId: string): Promise<ArtistResponse> {
  const res = await client.get<ArtistResponse>(`/api/artists/${browseId}`);
  return res.data;
}

/** Playlist tracks */
export async function getPlaylist(playlistId: string): Promise<PlaylistResponse> {
  const res = await client.get<PlaylistResponse>(`/api/playlists/${playlistId}`);
  return res.data;
}

/** Song → Artist → Albums chain */
export async function getChain(videoId: string) {
  const res = await client.get(`/api/chain/${videoId}`);
  return res.data;
}

// ─── Discovery ────────────────────────────────────────────────────────────────

/** Related songs for a videoId */
export async function getRelated(videoId: string): Promise<SearchResponse> {
  const res = await client.get<SearchResponse>(`/api/related/${videoId}`);
  return res.data;
}

/** Radio mix from a seed videoId */
export async function getRadio(videoId: string): Promise<RadioResponse> {
  const res = await client.get<RadioResponse>("/api/radio", { params: { videoId } });
  return res.data;
}

/** Similar tracks by title/artist */
export async function getSimilar(title: string, artist: string): Promise<SearchResponse> {
  const res = await client.get<SearchResponse>("/api/similar", { params: { title, artist } });
  return res.data;
}

/** Music charts by country code (e.g. "US") */
export async function getCharts(country = "US"): Promise<ChartsResponse> {
  const res = await client.get<ChartsResponse>("/api/charts", { params: { country } });
  return res.data;
}

/** Trending music by country code */
export async function getTrending(country = "US"): Promise<ChartsResponse> {
  const res = await client.get<ChartsResponse>("/api/trending", { params: { country } });
  return res.data;
}

/** Mood categories */
export async function getMoods(): Promise<MoodsResponse> {
  const res = await client.get<MoodsResponse>("/api/moods");
  return res.data;
}

/** Top artists by country */
export async function getTopArtists(country = "US") {
  const res = await client.get("/api/top/artists", { params: { country } });
  return res.data;
}

/** Top tracks by country */
export async function getTopTracks(country = "US") {
  const res = await client.get("/api/top/tracks", { params: { country } });
  return res.data;
}

// ─── Streaming & Lyrics ───────────────────────────────────────────────────────

/** Get audio stream URLs for a videoId. Falls back on fallbackVideoId automatically */
export async function getStream(id: string): Promise<StreamResponse> {
  const res = await client.get<StreamResponse>("/api/stream", { params: { id } });
  return res.data;
}

/** Proxy audio through the API server (use when direct URLs have CORS issues) */
export function buildProxyUrl(url: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? "https://verome-api.deno.dev";
  return `${base}/api/proxy?url=${encodeURIComponent(url)}`;
}

/** Synced lyrics (LRC) */
export async function getLyrics(title: string, artist: string): Promise<LyricsResponse> {
  const res = await client.get<LyricsResponse>("/api/lyrics", { params: { title, artist } });
  return res.data;
}

// ─── Info ─────────────────────────────────────────────────────────────────────

/** Artist bio from Last.fm */
export async function getArtistInfo(artist: string): Promise<ArtistInfoResponse> {
  const res = await client.get<ArtistInfoResponse>("/api/artist/info", { params: { artist } });
  return res.data;
}

/** Track info from Last.fm */
export async function getTrackInfo(title: string, artist: string): Promise<TrackInfoResponse> {
  const res = await client.get<TrackInfoResponse>("/api/track/info", { params: { title, artist } });
  return res.data;
}
