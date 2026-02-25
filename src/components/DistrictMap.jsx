import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { GeoJSON, MapContainer, Marker, Pane, Popup, TileLayer, useMap } from 'react-leaflet';
import { getStateGeo, INDIA_BOUNDS, INDIA_CENTER, normalizeStateName } from '../constants/indiaGeo';

const STATE_GEOJSON_SOURCES = [
  '/data/india-states.geojson',
  'https://cdn.jsdelivr.net/gh/divya-akula/GeoJson-Data-India@master/India_State.geojson',
  'https://raw.githubusercontent.com/divya-akula/GeoJson-Data-India/master/India_State.geojson',
];

const DISTRICT_GEOJSON_SOURCES = [
  'https://cdn.jsdelivr.net/gh/divya-akula/GeoJson-Data-India@master/India_State_District.geojson',
  'https://raw.githubusercontent.com/divya-akula/GeoJson-Data-India/master/India_State_District.geojson',
];

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

const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeDistrictName = (value) =>
  normalizeText(value)
    .replace(/\b(district|dist|zila|zone|division|dt)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeStateForMatch = (value) =>
  normalizeStateName(value)
    .replace(/\b(state|total|union territory|ut)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const valuesFromProperties = (properties = {}) =>
  Object.values(properties)
    .filter((value) => ['string', 'number'].includes(typeof value))
    .map((value) => String(value))
    .filter(Boolean);

const toGeoJsonFeature = (input) => {
  if (!input || typeof input !== 'object') return null;

  if (input.type === 'Feature' && input.geometry) {
    return {
      ...input,
      properties: input.properties || {},
    };
  }

  if (input.geometry) {
    return {
      type: 'Feature',
      id: input.id,
      properties: input.properties || {},
      geometry: input.geometry,
    };
  }

  if (['Polygon', 'MultiPolygon'].includes(input.type)) {
    return {
      type: 'Feature',
      properties: {},
      geometry: input,
    };
  }

  return null;
};

const hasValidGeometry = (feature) => {
  const geometry = feature?.geometry;
  if (!geometry?.type || !geometry?.coordinates) return false;
  if (!['Polygon', 'MultiPolygon'].includes(geometry.type)) return false;

  try {
    return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0;
  } catch {
    return false;
  }
};

const isRenderableFeature = (feature) => {
  if (!hasValidGeometry(feature)) return false;

  try {
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();
    return Boolean(bounds?.isValid?.());
  } catch {
    return false;
  }
};

const getFeatureKey = (feature, fallback) => {
  const props = feature?.properties || {};
  const candidate =
    props.ST_NM ||
    props.DISTRICT ||
    props.DIST_NAME ||
    props.NAME_1 ||
    props.NAME_2 ||
    props.NAME ||
    '';
  return `${String(candidate || 'feature').replace(/\s+/g, '_')}-${fallback}`;
};

const looseMatch = (candidate, target) => {
  if (!candidate || !target) return false;
  return candidate === target || candidate.includes(target) || target.includes(candidate);
};

const featureMatchesState = (feature, targetStateName) => {
  const target = normalizeStateForMatch(targetStateName);
  if (!target) return false;

  const candidates = valuesFromProperties(feature?.properties).map((value) => normalizeStateForMatch(value));
  return candidates.some((candidate) => looseMatch(candidate, target));
};

const featureMatchesDistrict = (feature, targetDistrictName, targetStateName) => {
  const districtTarget = normalizeDistrictName(targetDistrictName);
  if (!districtTarget) return false;

  const values = valuesFromProperties(feature?.properties);
  const districtCandidates = values.map((value) => normalizeDistrictName(value));
  const districtMatch = districtCandidates.some((candidate) => looseMatch(candidate, districtTarget));

  if (!districtMatch) return false;
  if (!targetStateName) return true;

  const stateTarget = normalizeStateName(targetStateName);
  const stateCandidates = values.map((value) => normalizeStateName(value));
  return stateCandidates.some((candidate) => looseMatch(candidate, stateTarget));
};

const getStateFeatureName = (feature) => {
  const props = feature?.properties || {};
  const direct =
    props.ST_NM ||
    props.st_nm ||
    props.STATE ||
    props.State ||
    props.STATE_NAME ||
    props.State_Name ||
    props.NAME_1 ||
    props.NAME ||
    '';
  const normalized = normalizeStateForMatch(direct);
  if (normalized) {
    return String(direct).trim();
  }

  const fromValues = valuesFromProperties(props).find((value) => normalizeStateForMatch(value));
  return fromValues ? String(fromValues).trim() : '';
};

const getFeatureCenter = (feature) => {
  try {
    const layer = L.geoJSON(feature);
    const center = layer.getBounds()?.getCenter?.();
    if (!center) return null;
    return [center.lat, center.lng];
  } catch {
    return null;
  }
};

const loadGeoJsonFromSources = async (sources) => {
  let lastError = null;

  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Boundary file request failed: ${response.status}`);
      }

      const json = await response.json();
      if (!json || !Array.isArray(json.features)) {
        throw new Error('Boundary file is not a valid FeatureCollection.');
      }

      const normalizedFeatures = json.features
        .map((feature) => toGeoJsonFeature(feature))
        .filter(Boolean);

      return {
        type: 'FeatureCollection',
        features: normalizedFeatures,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Boundary files could not be loaded.');
};

const pinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130" width="42" height="54">
  <path d="M50 4C26 4 7 23 7 47c0 31 43 79 43 79s43-48 43-79C93 23 74 4 50 4z" fill="#ef4444"/>
  <circle cx="50" cy="47" r="17" fill="#ffffff"/>
  <circle cx="50" cy="47" r="10" fill="#f97316"/>
</svg>`;

const pinIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
  iconSize: [34, 44],
  iconAnchor: [17, 42],
  popupAnchor: [0, -36],
});

const buildStateLabelIcon = (name) =>
  L.divIcon({
    className: 'state-label-icon',
    html: `<span>${String(name ?? '').trim()}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

function MapViewport({ points, boundaryFeatures, selectedState, selectedDistrict }) {
  const map = useMap();

  useEffect(() => {
    if (boundaryFeatures.length > 0) {
      try {
        const layer = L.geoJSON({ type: 'FeatureCollection', features: boundaryFeatures });
        const bounds = layer.getBounds();

        if (bounds?.isValid()) {
          map.fitBounds(bounds, {
            padding: [30, 30],
            maxZoom: selectedDistrict ? 9 : 7,
          });
          return;
        }
      } catch {
        // Fallback to point-based zoom if boundary geometry is malformed.
      }
    }

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
  }, [map, points, boundaryFeatures, selectedState, selectedDistrict]);

  return null;
}

function DistrictMap({ rows, selectedState, selectedDistrict, onSelectDistrict }) {
  const mapRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [stateGeoJson, setStateGeoJson] = useState(null);
  const [districtGeoJson, setDistrictGeoJson] = useState(null);
  const [stateBoundaryError, setStateBoundaryError] = useState('');
  const [districtBoundaryError, setDistrictBoundaryError] = useState('');

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
    let cancelled = false;

    const loadStateBoundaries = async () => {
      try {
        const json = await loadGeoJsonFromSources(STATE_GEOJSON_SOURCES);
        if (!cancelled) {
          setStateGeoJson(json);
          setStateBoundaryError('');
        }
      } catch (error) {
        if (!cancelled) {
          setStateBoundaryError('State boundary data could not be loaded in this network.');
        }
      }
    };

    loadStateBoundaries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDistrict || districtGeoJson) return;

    let cancelled = false;

    const loadDistrictBoundaries = async () => {
      try {
        const json = await loadGeoJsonFromSources(DISTRICT_GEOJSON_SOURCES);
        if (!cancelled) {
          setDistrictGeoJson(json);
          setDistrictBoundaryError('');
        }
      } catch (error) {
        if (!cancelled) {
          setDistrictBoundaryError('District boundary data could not be loaded in this network.');
        }
      }
    };

    loadDistrictBoundaries();

    return () => {
      cancelled = true;
    };
  }, [selectedDistrict, districtGeoJson]);

  const visibleStates = useMemo(() => {
    if (selectedState) return [selectedState];
    return [...new Set(rows.map((row) => row.state))];
  }, [rows, selectedState]);

  const baseStateFeatures = useMemo(() => {
    const features = stateGeoJson?.features || [];
    if (!features.length || !visibleStates.length) return [];

    return features
      .filter((feature) => hasValidGeometry(feature))
      .map((feature) => {
        const matchedState = visibleStates.find((stateName) => featureMatchesState(feature, stateName)) || '';
        if (!matchedState) return null;

        const labelName = getStateFeatureName(feature) || matchedState;
        const center = getFeatureCenter(feature) || getStateGeo(matchedState).center;

        return {
          stateKey: normalizeStateForMatch(matchedState),
          feature,
          labelName,
          center,
        };
      })
      .filter(Boolean);
  }, [stateGeoJson, visibleStates]);

  const stateFeatures = baseStateFeatures;

  const districtFeatures = useMemo(() => {
    if (!selectedDistrict) return [];

    const features = districtGeoJson?.features || [];
    if (!features.length) return [];

    return features.filter(
      (feature) =>
        isRenderableFeature(feature) &&
        featureMatchesDistrict(feature, selectedDistrict, selectedState)
    );
  }, [districtGeoJson, selectedDistrict, selectedState]);

  const boundaryFocusFeatures =
    districtFeatures.length > 0 ? districtFeatures : stateFeatures.map((item) => item.feature);

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
  const hasStateBoundaries = stateFeatures.length > 0;
  const hasDistrictBoundaryForSelection = !selectedDistrict || districtFeatures.length > 0;
  const noStateBoundaryMatchWarning = visibleStates.length > 0 && stateFeatures.length === 0;
  const boundaryDebug = `Matched state boundaries: ${stateFeatures.length}/${visibleStates.length}`;
  const hasBoundaryWarning =
    (!hasStateBoundaries && (stateBoundaryError || noStateBoundaryMatchWarning)) ||
    (!hasDistrictBoundaryForSelection && districtBoundaryError);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">India State & District Boundary Map</h2>
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            <MapViewport
              points={points}
              boundaryFeatures={boundaryFocusFeatures}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
            />

            <Pane name="state-boundary-pane" style={{ zIndex: 650 }}>
              {stateFeatures.length > 0 &&
                stateFeatures.map((item, index) => (
                  <GeoJSON
                    key={getFeatureKey(item.feature, index)}
                    data={item.feature}
                    style={{
                      color: '#1d4ed8',
                      weight: selectedState ? 3 : 2.6,
                      fillColor: '#bfdbfe',
                      fillOpacity: 0.18,
                    }}
                    interactive={false}
                  />
                ))}
            </Pane>

            <Pane name="district-boundary-pane" style={{ zIndex: 660 }}>
              {districtFeatures.length > 0 &&
                districtFeatures.map((feature, index) => (
                  <GeoJSON
                    key={getFeatureKey(feature, `district-${index}`)}
                    data={feature}
                    style={{
                      color: '#f97316',
                      weight: 3,
                      fillColor: '#fdba74',
                      fillOpacity: 0.25,
                    }}
                    interactive={false}
                  />
                ))}
            </Pane>

            <Pane name="state-label-pane" style={{ zIndex: 690 }}>
              {stateFeatures.map((item, index) => (
                <Marker
                  key={`state-label-${normalizeText(item.labelName)}-${index}`}
                  position={item.center}
                  icon={buildStateLabelIcon(item.labelName)}
                  interactive={false}
                />
              ))}
            </Pane>

            {districtPoints.map((point) => (
              <Marker
                key={`${point.state}-${point.district}`}
                icon={pinIcon}
                position={[point.lat, point.lng]}
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
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {hasBoundaryWarning ? (
        <p className="mt-3 text-xs text-amber-700">
          {stateBoundaryError ||
            districtBoundaryError ||
            'State boundaries are not matching uploaded state names in boundary data.'}{' '}
          Markers remain available. {boundaryDebug}
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Red pin markers represent district client points. Blue boundaries show complete state area, and orange boundary highlights the selected district.{' '}
          {boundaryDebug}
        </p>
      )}
    </section>
  );
}

export default DistrictMap;
