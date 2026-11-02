'use client';

import { useEffect, useRef, useState } from 'react';
import type { CircleMarker, LatLngExpression, Map as LeafletMap } from 'leaflet';
import { BusLocationData } from '@/hooks/useBusTracking';

const CAIRO: [number, number] = [30.0444, 31.2357];

interface LiveTrackingMapProps {
  locations: BusLocationData[];
  height?: number;
  busNames?: Record<number, string>;
}

function popupNode(loc: BusLocationData, busNames: Record<number, string>): HTMLElement {
  const root = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = busNames[loc.busId] || `Bus ${loc.busId}`;
  const body = document.createElement('div');
  const speed = Math.round(loc.speed || 0);
  body.textContent = `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)} · ${speed} km/h`;
  root.append(title, body);
  return root;
}

export const LiveTrackingMap = ({
  locations,
  height = 500,
  busNames = {},
}: LiveTrackingMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<number, CircleMarker>>(new Map());
  const fittedRef = useRef(false);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;
    const markers = markersRef.current;
    const onResize = () => map?.invalidateSize();

    (async () => {
      const loaded = await import('leaflet');
      const L = (loaded.default ?? loaded) as typeof import('leaflet');
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      map = L.map(containerRef.current).setView(CAIRO, 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      window.addEventListener('resize', onResize);
      map.invalidateSize();
      setReady(true);
    })().catch(() => {
      if (!cancelled) setReady(false);
    });

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      markers.clear();
      fittedRef.current = false;
      mapRef.current = null;
      map?.remove();
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    const seen = new Set<number>();
    const points: LatLngExpression[] = [];

    for (const loc of locations) {
      if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) continue;
      seen.add(loc.busId);
      points.push([loc.latitude, loc.longitude]);

      let marker = markersRef.current.get(loc.busId);
      const fill = loc.isTracking === false ? '#94a3b8' : '#d97706';
      if (!marker) {
        marker = L.circleMarker([loc.latitude, loc.longitude], {
          radius: 9,
          color: '#0f766e',
          weight: 2,
          fillColor: fill,
          fillOpacity: 0.95,
        }).addTo(map);
        markersRef.current.set(loc.busId, marker);
      } else {
        marker.setLatLng([loc.latitude, loc.longitude]);
        marker.setStyle({ fillColor: fill });
      }
      marker.bindPopup(popupNode(loc, busNames));
    }

    markersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    if (!fittedRef.current && points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14 });
      fittedRef.current = true;
    }
  }, [locations, busNames, ready]);

  const active = locations.filter((loc) => loc.isTracking !== false).length;

  return (
    <div className="relative overflow-hidden rounded-xl" dir="ltr" style={{ height }}>
      <div ref={containerRef} dir="ltr" style={{ height: '100%', width: '100%' }} />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-sm shadow">
        <span className="font-semibold text-teal-800">{active} live</span>
        <span className="ml-2 text-slate-500">{locations.length} total</span>
      </div>
    </div>
  );
};
