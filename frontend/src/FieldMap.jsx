

import L from "leaflet";
import { useState, useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icons in Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const getMarkerColor = (status) => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "#f59e0b"; // Orange

    case "confirmed":
      return "#16a34a"; // Green

    case "not_confirmed":
    case "rejected":
      return "#dc2626"; // Red

    default:
      return "#64748b"; // Grey
  }
};

function MapResizeHandler({ isExpanded }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [map, isExpanded]);

  return null;
}


function RiskAssessment({ itemId }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadRisk = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://127.0.0.1:8001/observations/${itemId}/risk`
        );

        if (!response.ok) {
          throw new Error("Unable to load risk assessment.");
        }

        const data = await response.json();

        if (!cancelled) {
          setRisk(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRisk();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  if (loading) {
    return <p>Loading risk assessment...</p>;
  }

  if (error) {
    return <p>Risk assessment unavailable: {error}</p>;
  }

  if (!risk) return null;

  return (
    <div className="field-risk-section">
      <strong>Illustrative Risk Assessment</strong>

      <div className={`risk-level ${risk.level}`}>
        {risk.level.toUpperCase()} RISK
      </div>

      <p>
        Demo risk score: <strong>{risk.score}/100</strong>
      </p>


<div className="risk-score-track">
  <div
    className={`risk-score-fill ${risk.level}`}
    style={{ width: `${risk.score}%` }}
  />
</div>


      <strong>Assessment reasons</strong>

      <ul>
        {risk.explanation.map((reason, index) => (
          <li key={index}>{reason}</li>
        ))}
      </ul>

      <small>{risk.disclaimer}</small>
    </div>
  );
}


function FieldMap({ observations = [], onOpenDetails }) {
    const [isExpanded, setIsExpanded] = useState(false);
  const validObservations = observations.filter((item) => {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);

    return (
      item.latitude !== null &&
      item.latitude !== undefined &&
      item.latitude !== "" &&
      item.longitude !== null &&
      item.longitude !== undefined &&
      item.longitude !== "" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  });

  return (
    <section
  className={`field-map-section ${isExpanded ? "map-expanded" : ""}`}
>
      <div className="field-map-heading">
        <button
  className="map-expand-button"
  onClick={() => setIsExpanded(!isExpanded)}
>
  {isExpanded ? "✕ Restore Map" : "⛶ Maximize Map"}
</button>
        <div>
          <h2>Field Locations</h2>
          <p>Geographical distribution of submitted field reports</p>
        </div>

        <span>{validObservations.length} mapped fields</span>
      </div>

      {validObservations.length === 0 ? (
        <div className="field-map-empty">
          No field observations with valid coordinates are available.
        </div>
      ) : (
        <MapContainer
          center={[26.2, 92.9]}
          zoom={7}
          scrollWheelZoom={true}
          className="field-map"
        >
            <MapResizeHandler isExpanded={isExpanded} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
<div className="field-map-legend">
  <strong>Marker Status</strong>

  <div><span className="legend-dot pending-dot"></span> Pending</div>
  <div><span className="legend-dot confirmed-dot"></span> Confirmed</div>
  <div><span className="legend-dot rejected-dot"></span> Not confirmed</div>
  <div><span className="legend-dot other-dot"></span> Other / Inconclusive</div>
</div>


         
{validObservations.map((item) => {
  const duplicateIndex = validObservations
    .filter(
      (other) =>
        Number(other.latitude) === Number(item.latitude) &&
        Number(other.longitude) === Number(item.longitude)
    )
    .findIndex((other) => other.id === item.id);

  const offset = duplicateIndex * 0.0008;

  return (
    <CircleMarker
      key={item.id}
      center={[
        Number(item.latitude) + offset,
        Number(item.longitude) + offset,
      ]}
      radius={10}
      pathOptions={{
        color: "#ffffff",
        weight: 2,
        fillColor: getMarkerColor(item.verification_status),
        fillOpacity: 0.95,
      }}
    >
      <Popup maxHeight={420} maxWidth={360} autoPan={true}>
        
<div className="field-popup">
  <div className="field-popup-header">
    <strong>{item.field_name || "Unnamed field"}</strong>
    <span className={`popup-status ${item.verification_status || "unknown"}`}>
      {(item.verification_status || "Unknown").replaceAll("_", " ")}
    </span>
  </div>

  <p className="field-popup-subtitle">
    {item.crop || "Unknown crop"} · {item.growth_stage || "Unknown stage"}
  </p>

  <div className="field-popup-grid">
    <div>
      <small>Temperature</small>
      <strong>{item.temperature_c ?? "Not recorded"}{item.temperature_c != null ? " °C" : ""}</strong>
    </div>

    <div>
      <small>Humidity</small>
      <strong>{item.humidity_pct ?? "Not recorded"}{item.humidity_pct != null ? " %" : ""}</strong>
    </div>

    <div>
      <small>7-day rainfall</small>
      <strong>{item.rainfall_7d_mm ?? "Not recorded"}{item.rainfall_7d_mm != null ? " mm" : ""}</strong>
    </div>

    <div>
      <small>Current NDVI</small>
      <strong>{item.ndvi ?? "Not recorded"}</strong>
    </div>

    <div>
      <small>Previous NDVI</small>
      <strong>{item.previous_ndvi ?? "Not recorded"}</strong>
    </div>

    <div>
      <small>Observation date</small>
      <strong>
        {item.created_at
          ? new Date(item.created_at).toLocaleDateString()
          : "Not recorded"}
      </strong>
    </div>
  </div>

  <div className="field-popup-notes">
    <strong>Field notes</strong>
    <p>{item.notes || "No additional notes provided."}</p>
  </div>
  <RiskAssessment itemId={item.id} />
  <button
  className="view-full-report-button"
  onClick={() => onOpenDetails?.(item)}
>
  View Full Report →
</button>

  <small className="field-popup-coordinates">
    Coordinates: {item.latitude}, {item.longitude}
  </small>
</div>

      </Popup>
    </CircleMarker>
  );
})}

        </MapContainer>
      )}
    </section>
  );
}

export default FieldMap;
