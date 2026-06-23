/**
 * SearchBar – input + filter selector + autocomplete suggestions.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { getSuggestions } from "../api/service";
import Spinner from "./Spinner";

export type SearchFilter = "songs" | "albums" | "artists" | "playlists" | "videos" | "";

interface SearchBarProps {
  onSearch: (q: string, filter: SearchFilter) => void;
  loading: boolean;
}

const FILTERS: { label: string; value: SearchFilter }[] = [
  { label: "All", value: "" },
  { label: "Songs", value: "songs" },
  { label: "Albums", value: "albums" },
  { label: "Artists", value: "artists" },
  { label: "Playlists", value: "playlists" },
  { label: "Videos", value: "videos" },
];

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const data = await getSuggestions(query.trim());
        setSuggestions(data.suggestions ?? []);
        setShowSuggestions(true);
      } catch {
        // Non-critical – swallow suggestion errors
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Hide suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submit = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      setShowSuggestions(false);
      onSearch(q.trim(), filter);
    },
    [filter, onSearch]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit(query);
  };

  const pickSuggestion = (s: string) => {
    setQuery(s);
    setShowSuggestions(false);
    onSearch(s, filter);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search songs, artists, albums…"
            className="w-full bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 pr-8 outline-none focus:border-neutral-400 placeholder-neutral-500"
          />
          {suggestLoading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">
              <Spinner size={14} />
            </span>
          )}
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as SearchFilter)}
          className="bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-2 py-2 outline-none focus:border-neutral-400"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => submit(query)}
          disabled={loading || !query.trim()}
          className="bg-white text-black text-sm font-medium px-4 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {loading ? <Spinner size={14} /> : null}
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-600 rounded shadow-lg z-50 max-h-60 overflow-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                className="w-full text-left px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-700 transition-colors"
                onClick={() => pickSuggestion(s)}
              >
                🔍 {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
