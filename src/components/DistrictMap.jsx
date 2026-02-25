import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icon paths in Vite builds.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FitMapToData({ rows }) {
  const map = useMap();

  useEffect(() => {
    if (!rows.length) return;

    const points = rows.map((row) => [row.Latitude, row.Longitude]);

    if (points.length === 1) {
      map.setView(points[0], 8, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, rows]);

  return null;
}

function DistrictMap({ rows }) {
  const center = rows.length ? [rows[0].Latitude, rows[0].Longitude] : [22.9734, 78.6569];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <h2 className="text-xl font-semibold text-slate-900">District Map</h2>
      <div className="mt-4 h-[380px] overflow-hidden rounded-xl border border-slate-200">
        <MapContainer center={center} zoom={5} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitMapToData rows={rows} />

          {rows.map((row, index) => (
            <Marker key={`${row.State}-${row.District}-${index}`} position={[row.Latitude, row.Longitude]}>
              <Popup>
                <div className="text-sm">
                  <div>
                    <span className="font-semibold">State:</span> {row.State}
                  </div>
                  <div>
                    <span className="font-semibold">District:</span> {row.District}
                  </div>
                  <div>
                    <span className="font-semibold">Cases:</span> {row.Cases.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-semibold">Population:</span> {row.Population.toLocaleString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

export default DistrictMap;
