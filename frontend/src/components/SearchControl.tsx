import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { useMap } from "react-leaflet";
import L from "leaflet";

type SearchResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
};

export default function SearchControl() {
  const map = useMap();
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent map clicks from propagating when interacting with search
  useEffect(() => {
    if (searchRef.current) {
      L.DomEvent.disableClickPropagation(searchRef.current);
      L.DomEvent.disableScrollPropagation(searchRef.current);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&viewbox=74.0,13.08,75.612,12.55&bounded=1&limit=5`;
        const response = await fetch(url);
        const data = await response.json();
        setResults(data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Fly to location
    map.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
    
    // Close dropdown and set query without triggering a refetch
    skipSearchRef.current = true;
    setShowDropdown(false);
    setQuery(result.display_name.split(',')[0]);
  };

  return (
    <div className="search-control-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <Search className="search-icon" />
        <input 
          type="text" 
          placeholder="Search locations (exact spelling)..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(results.length > 0) setShowDropdown(true); }}
        />
        {query && (
          <button 
            className="clear-search-btn"
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowDropdown(false);
            }}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
        {isLoading && <Loader2 className="spinner loading-icon" />}
      </div>
      
      {showDropdown && results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map((result) => (
            <button 
              key={result.place_id} 
              className="search-result-item"
              onClick={() => handleSelect(result)}
            >
              <MapPin size={16} className="result-icon" />
              <div className="result-text">
                <span className="result-name">{result.display_name.split(',')[0]}</span>
                <span className="result-address">{result.display_name.split(',').slice(1).join(',')}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {showDropdown && query.length > 0 && !isLoading && results.length === 0 && (
        <div className="search-results-dropdown empty">
          <div>No locations found in Mangaluru area.</div>
          <div className="search-helper-text">Try using the exact spelling (e.g., "Kavoor" instead of "ka kavo").</div>
        </div>
      )}
    </div>
  );
}
