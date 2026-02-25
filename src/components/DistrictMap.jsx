import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { getStateGeo, INDIA_BOUNDS, INDIA_CENTER } from '../constants/indiaGeo';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hashString = (value) => {
  let hash = 0;
  const text = String(value ?? '');
  for (let idx = 0; idx < text.length; idx += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(idx);
    hash |= 0;
  }
  return hash;
};

const toNormalized = (value) => {
  const x = Math.sin(value) * 10000;
  return x - Math.floor(x);
};

const districtCoordinate = (stateName, districtName) => {
  const { center, spread } = getStateGeo(stateName);
  const latSeed = hashString(`${stateName}|${districtName}|lat`);
  const lngSeed = hashString(`${stateName}|${districtName}|lng`);

  const latOffset = (toNormalized(latSeed) - 0.5) * spread * 1.5;
  const lngOffset = (toNormalized(lngSeed) - 0.5) * spread * 1.9;

  return [
    clamp(center[0] + latOffset, INDIA_BOUNDS[0][0], INDIA_BOUNDS[1][0]),
    clamp(center[1] + lngOffset, INDIA_BOUNDS[0][1], INDIA_BOUNDS[1][1]),
  ];
};

function MapViewport({ points, selectedState, selectedDistrict }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      if (selectedState) {
        const { center } = getStateGeo(selectedState);
        map.setView(center, 6, { animate: true });
      } else {
        map.setView(INDIA_CENTER, 5, { animate: true });
      }
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], selectedDistrict ? 9 : 7, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, {
      padding: [35, 35],
      maxZoom: selectedDistrict ? 9 : 7,
    });
  }, [map, points, selectedState, selectedDistrict]);

  return null;
}

function DistrictMap({ rows, selectedState, selectedDistrict, onSelectDistrict }) {
  const mapRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const districtPoints = useMemo(() => {
    const grouped = rows.reduce((acc, row) => {
      const key = `${row.state}||${row.district}`;
      if (!acc[key]) {
        const [lat, lng] = districtCoordinate(row.state, row.district);
        acc[key] = {
          state: row.state,
          district: row.district,
          lat,
          lng,
          distributorCount: 0,
          retailerCount: 0,
          salesFY: 0,
          salesCurrent: 0,
          growth: 0,
        };
      }

      acc[key].distributorCount += row.distributorCount;
      acc[key].retailerCount += row.retailerCount;
      acc[key].salesFY += row.salesFY;
      acc[key].salesCurrent += row.salesCurrent;
      acc[key].growth += row.growth;

      return acc;
    }, {});

    return Object.values(grouped);
  }, [rows]);

  const points = useMemo(() => districtPoints.map((item) => [item.lat, item.lng]), [districtPoints]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      setTimeout(() => mapRef.current?.invalidateSize(), 120);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;

    if (!document.fullscreenElement) {
      await wrapperRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const mapHeightClass = isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[520px]';

  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">India Client Coverage Map</h2>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {isFullscreen ? 'Exit Full Screen' : 'Full Screen Map'}
        </button>
      </div>

      <div ref={wrapperRef} className="map-shell rounded-xl border border-slate-200 bg-white p-2">
        <div className={`${mapHeightClass} overflow-hidden rounded-lg`}>
          <MapContainer
            center={INDIA_CENTER}
            zoom={5}
            minZoom={4}
            maxZoom={12}
            maxBounds={INDIA_BOUNDS}
            maxBoundsViscosity={1}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => {
              mapRef.current = map;
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewport points={points} selectedState={selectedState} selectedDistrict={selectedDistrict} />

            {districtPoints.map((point) => {
              const markerRadius = Math.max(6, Math.min(16, 5 + Math.sqrt(point.retailerCount || 0)));
              const isPositive = point.growth >= 0;

              return (
                <CircleMarker
                  key={`${point.state}-${point.district}`}
                  center={[point.lat, point.lng]}
                  radius={markerRadius}
                  pathOptions={{
                    color: isPositive ? '#0f766e' : '#be123c',
                    fillColor: isPositive ? '#14b8a6' : '#f43f5e',
                    fillOpacity: 0.75,
                    weight: 1,
                  }}
                  eventHandlers={{
                    click: () => onSelectDistrict(point.state, point.district),
                  }}
                >
                  <Popup>
                    <div className="text-sm leading-6">
                      <div><strong>State:</strong> {point.state}</div>
                      <div><strong>District:</strong> {point.district}</div>
                      <div><strong>Clients (Retailers):</strong> {point.retailerCount.toLocaleString()}</div>
                      <div><strong>Distributors:</strong> {point.distributorCount.toLocaleString()}</div>
                      <div><strong>Sales FY 2024-25:</strong> {point.salesFY.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      <div><strong>Sales 24 Feb 2026:</strong> {point.salesCurrent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Marker size is based on client count (retailers). Click a marker to focus that district. District points are
        visual placement references generated from state and district names.
      </p>
    </section>
  );
}

export default DistrictMap;
