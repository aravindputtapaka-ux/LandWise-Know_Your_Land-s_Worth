import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import "./LocationMapPicker.css";

type Coordinates = { lat: number; lon: number };
type SelectedPlace = Coordinates & { display_name: string; market_location: string };

type OSMAddress = Record<string, string | undefined>;
function marketLocation(address: OSMAddress | undefined, displayName: string): string {
  if (!address) return displayName;
  // Omit road and house numbers: these are pin-specific, not market localities.
  const locality = address.village || address.town || address.city || address.municipality || address.suburb || address.hamlet || address.county;
  const district = address.state_district || address.county;
  const pieces = [locality, district, address.state, address.postcode, address.country]
    .filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index);
  return pieces.length >= 2 ? pieces.join(", ") : displayName;
}
type LeafletMap = { setView: (center: number[], zoom: number) => LeafletMap; on: (event: string, cb: (event: { latlng: { lat: number; lng: number } }) => void) => void; remove: () => void; invalidateSize: () => void };
type LeafletMarker = { setLatLng: (coords: number[]) => void; addTo: (map: LeafletMap) => LeafletMarker; on: (event: string, cb: (event: { target: { getLatLng: () => { lat: number; lng: number } } }) => void) => void };
type LeafletAPI = { map: (el: HTMLElement, options: object) => LeafletMap; tileLayer: (url: string, options: object) => { addTo: (map: LeafletMap) => void }; marker: (coords: number[], options: object) => LeafletMarker };
declare global { interface Window { L?: LeafletAPI } }

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
let leafletLoader: Promise<LeafletAPI> | undefined;
function loadLeaflet(): Promise<LeafletAPI> {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletLoader) {
    leafletLoader = new Promise<LeafletAPI>((resolve, reject) => {
      if (!document.querySelector('link[data-landwise-leaflet]')) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = LEAFLET_CSS;
        css.dataset.landwiseLeaflet = "true";
        document.head.appendChild(css);
      }
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = () => window.L ? resolve(window.L) : reject(new Error("Map library unavailable"));
      script.onerror = () => reject(new Error("Could not load the map. Check your internet connection."));
      document.head.appendChild(script);
    }).catch((error) => { leafletLoader = undefined; throw error; });
  }
  return leafletLoader!;
}

async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<{display_name: string; market_location: string}> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Address lookup unavailable. Try another location.");
  const data = await response.json();
  if (!data.display_name) throw new Error("No named location found at this point.");
  return { display_name: data.display_name as string, market_location: marketLocation(data.address, data.display_name) };
}

export default function LocationMapPicker({ initial, onSelect, onClose }: {
  initial: Coordinates | null;
  onSelect: (place: SelectedPlace) => void;
  onClose: () => void;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const mounted = useRef(true);
  const requestRef = useRef(0);
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState("");

  const placeMarker = async (lat: number, lon: number, knownName?: string) => {
    const request = ++requestRef.current;
    setFinding(true);
    setError("");
    setSelected(null);
    markerRef.current?.setLatLng([lat, lon]);
    mapRef.current?.setView([lat, lon], 13);
    try {
      const resolved = await reverseGeocode(lat, lon);
      if (mounted.current && request === requestRef.current) setSelected({ lat, lon, display_name: knownName || resolved.display_name, market_location: resolved.market_location });
    } catch (e) {
      if (mounted.current && request === requestRef.current) setError(e instanceof Error ? e.message : "Unable to identify location");
    } finally {
      if (mounted.current && request === requestRef.current) setFinding(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    let map: LeafletMap | null = null;
    loadLeaflet().then(L => {
      if (cancelled || !mapNode.current) return;
      const center = initial ? [initial.lat, initial.lon] : [17.385, 78.4867];
      map = L.map(mapNode.current, { zoomControl: true }).setView(center, initial ? 12 : 6);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        maxZoom: 19,
      }).addTo(map);
      markerRef.current = L.marker(center, { draggable: true }).addTo(map);
      map.on("click", event => { void placeMarker(event.latlng.lat, event.latlng.lng); });
      markerRef.current.on("dragend", event => {
        const point = event.target.getLatLng();
        void placeMarker(point.lat, point.lng);
      });
      setLoading(false);
      if (initial) void placeMarker(initial.lat, initial.lon);
      window.setTimeout(() => { if (!cancelled) map?.invalidateSize(); }, 80);
    }).catch(e => { if (!cancelled) { setLoading(false); setError(e instanceof Error ? e.message : "Map unavailable"); } });
    return () => { cancelled = true; mounted.current = false; requestRef.current++; map?.remove(); mapRef.current = null; markerRef.current = null; };
    // The map must be created once per modal opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [onClose]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 3) return;
    setFinding(true);
    setError("");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query.trim())}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Location search is temporarily unavailable");
      const places = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
      if (!places.length) throw new Error("No location found. Try adding a district or state.");
      await placeMarker(Number(places[0].lat), Number(places[0].lon), places[0].display_name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Location search failed");
    } finally { setFinding(false); }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setError("Your browser does not support geolocation"); return; }
    setFinding(true);
    navigator.geolocation.getCurrentPosition(
      p => { void placeMarker(p.coords.latitude, p.coords.longitude); },
      () => { setFinding(false); setError("Location access denied or unavailable"); },
      { enableHighAccuracy: false, timeout: 12000 }
    );
  };

  return <div className="lw-map-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="lw-map-dialog" role="dialog" aria-modal="true" aria-label="Select property location on map">
      <header className="lw-map-header"><div><h2><MapPin size={19}/> Select property location</h2><p>Search, click the map, or drag the marker to choose a locality.</p></div><button type="button" className="lw-map-close" onClick={onClose} aria-label="Close map"><X size={20}/></button></header>
      <form className="lw-map-search" onSubmit={search}><Search size={17}/><input aria-label="Search location on map" value={query} onChange={e => setQuery(e.target.value)} placeholder="Village, mandal, district, or landmark..."/><button type="submit" disabled={finding || query.trim().length < 3}>{finding ? <Loader2 className="spin" size={16}/> : "Search"}</button><button type="button" className="lw-map-current" onClick={useCurrentLocation} title="Use current location" aria-label="Use current location"><Crosshair size={17}/></button></form>
      <div className="lw-map-canvas-wrap"><div ref={mapNode} className="lw-map-canvas"/>{loading && <div className="lw-map-loading"><Loader2 size={22} className="spin"/> Loading OpenStreetMap...</div>}</div>
      <div className="lw-map-bottom"><div className="lw-map-selection">{selected ? <><strong>{selected.display_name}</strong><small>{selected.lat.toFixed(6)}, {selected.lon.toFixed(6)}</small></> : <span>{finding ? "Identifying selected location..." : "Select a location on the map"}</span>}{error && <span className="lw-map-error" role="alert">{error}</span>}</div><button type="button" className="lw-map-confirm" disabled={!selected || finding} onClick={() => { if (selected) onSelect(selected); }}>Use this location</button></div>
    </section>
  </div>;
}
