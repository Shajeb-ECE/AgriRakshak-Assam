
import { useEffect, useMemo, useState } from "react";
import API from "./api";
import "./CropMonitoring.css";

function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `${number.toFixed(2)}${suffix}`
    : "N/A";
}

function average(records, field) {
  const values = records
    .map((item) => Number(item[field]))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return null;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getNDVITrend(current, previous) {
  const currentValue = Number(current);
  const previousValue = Number(previous);

  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    !Number.isFinite(currentValue) ||
    !Number.isFinite(previousValue)
  ) {
    return { label: "Insufficient data", className: "neutral" };
  }

  const difference = currentValue - previousValue;

  if (difference > 0.01) {
    return { label: "Increased", className: "positive" };
  }

  if (difference < -0.01) {
    return { label: "Decreased", className: "negative" };
  }

  return { label: "Relatively stable", className: "neutral" };
}

function CropMonitoring() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cropFilter, setCropFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadObservations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/observations?limit=100");

        const records = Array.isArray(response.data)
          ? response.data
          : response.data.items || [];

        if (!cancelled) {
          setObservations(records);
        }
      } catch (err) {
        console.error("Crop monitoring data error:", err);

        if (!cancelled) {
          setError(
            "Unable to load crop monitoring data. Please check the backend."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadObservations();

    return () => {
      cancelled = true;
    };
  }, []);

  const cropSummary = useMemo(() => {
    const summary = {};

    observations.forEach((item) => {
      const crop = item.crop || "Unspecified";

      if (!summary[crop]) {
        summary[crop] = 0;
      }

      summary[crop] += 1;
    });

    return Object.entries(summary).map(([crop, count]) => ({
      crop,
      count,
    }));
  }, [observations]);

  const filteredObservations = useMemo(() => {
    return observations.filter((item) => {
      const crop = String(item.crop || "").toLowerCase();
      const field = String(item.field_name || "").toLowerCase();
      const query = search.toLowerCase();

      const matchesCrop =
        cropFilter === "all" || crop === cropFilter.toLowerCase();

      const matchesSearch =
        field.includes(query) || crop.includes(query);

      return matchesCrop && matchesSearch;
    });
  }, [observations, cropFilter, search]);

  const environmentalSummary = useMemo(() => ({
    temperature: average(observations, "temperature_c"),
    humidity: average(observations, "humidity_pct"),
    rainfall: average(observations, "rainfall_7d_mm"),
    ndvi: average(observations, "ndvi"),
    previousNdvi: average(observations, "previous_ndvi"),
  }), [observations]);

  const ndviTrend = getNDVITrend(
    environmentalSummary.ndvi,
    environmentalSummary.previousNdvi
  );

  return (
    <section className="content crop-monitoring-page">
      <div className="welcome">
        <div>
          <p className="eyebrow">
            AGRICULTURE INTELLIGENCE PLATFORM
          </p>
          <h1>Crop Monitoring</h1>
          <p className="subtitle">
            Monitor recorded crop conditions and environmental
            observations across agricultural plots.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="panel">
          Loading crop monitoring records...
        </div>
      ) : (
        <>
          <div className="crop-summary-grid">
            <div className="crop-summary-card">
              <span>Total Observations</span>
              <h2>{observations.length}</h2>
              <small>Recorded field reports</small>
            </div>

            <div className="crop-summary-card">
              <span>Crop Types</span>
              <h2>{cropSummary.length}</h2>
              <small>Different recorded crops</small>
            </div>

            <div className="crop-summary-card">
              <span>Average Temperature</span>
              <h2>{formatValue(environmentalSummary.temperature, "°C")}</h2>
              <small>Across available observations</small>
            </div>

            <div className="crop-summary-card">
              <span>Average Humidity</span>
              <h2>{formatValue(environmentalSummary.humidity, "%")}</h2>
              <small>Across available observations</small>
            </div>
          </div>

          <div className="crop-section-heading">
            <div>
              <h2>Environmental Monitoring</h2>
              <p>Average recorded environmental measurements.</p>
            </div>
          </div>

          <div className="environment-grid">
            <div className="environment-card">
              <span className="environment-icon">🌡️</span>
              <div>
                <p>Temperature</p>
                <h3>{formatValue(environmentalSummary.temperature, "°C")}</h3>
              </div>
            </div>

            <div className="environment-card">
              <span className="environment-icon">💧</span>
              <div>
                <p>Humidity</p>
                <h3>{formatValue(environmentalSummary.humidity, "%")}</h3>
              </div>
            </div>

            <div className="environment-card">
              <span className="environment-icon">🌧️</span>
              <div>
                <p>7-Day Rainfall</p>
                <h3>{formatValue(environmentalSummary.rainfall, " mm")}</h3>
              </div>
            </div>

            <div className="environment-card">
              <span className="environment-icon">🌿</span>
              <div>
                <p>Average NDVI</p>
                <h3>{formatValue(environmentalSummary.ndvi)}</h3>
              </div>
            </div>
          </div>

          <div className="ndvi-panel panel">
            <div>
              <h3>Vegetation Index Monitoring (NDVI)</h3>
              <p>
                Comparison of average current and previous NDVI
                values from recorded observations.
              </p>
            </div>

            <div className="ndvi-values">
              <div>
                <span>Current Average NDVI</span>
                <strong>{formatValue(environmentalSummary.ndvi)}</strong>
              </div>

              <div>
                <span>Previous Average NDVI</span>
                <strong>{formatValue(environmentalSummary.previousNdvi)}</strong>
              </div>

              <div>
                <span>Overall Trend</span>
                <strong className={`ndvi-trend ${ndviTrend.className}`}>
                  {ndviTrend.label}
                </strong>
              </div>
            </div>

            <p className="ndvi-note">
              NDVI is a vegetation indicator. Changes should be interpreted
              alongside field conditions and other observations; NDVI alone
              cannot confirm crop disease or overall crop health.
            </p>
          </div>

          <div className="crop-section-heading">
            <div>
              <h2>Crop-wise Overview</h2>
              <p>Number of observations recorded for each crop.</p>
            </div>
          </div>

          <div className="crop-type-grid">
            {cropSummary.map((item) => (
              <div className="crop-type-card" key={item.crop}>
                <span>🌱</span>
                <div>
                  <h3>{item.crop}</h3>
                  <p>{item.count} observation(s)</p>
                </div>
              </div>
            ))}
          </div>

          <div className="crop-section-heading field-heading">
            <div>
              <h2>Field Monitoring Records</h2>
              <p>Environmental and vegetation data for individual fields.</p>
            </div>
          </div>

          <div className="crop-filter-bar">
            <input
              type="text"
              placeholder="Search field or crop..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={cropFilter}
              onChange={(event) => setCropFilter(event.target.value)}
            >
              <option value="all">All crops</option>
              {cropSummary.map((item) => (
                <option key={item.crop} value={item.crop.toLowerCase()}>
                  {item.crop}
                </option>
              ))}
            </select>
          </div>

          {filteredObservations.length === 0 ? (
            <div className="panel crop-empty">
              <h3>No matching records</h3>
              <p>Try changing the search term or crop filter.</p>
            </div>
          ) : (
            <div className="crop-record-grid">
              {filteredObservations.map((item) => {
                const trend = getNDVITrend(item.ndvi, item.previous_ndvi);

                return (
                  <article className="crop-record-card" key={item.id}>
                    <div className="crop-record-header">
                      <div>
                        <span className="crop-record-label">
                          FIELD OBSERVATION
                        </span>
                        <h3>{item.field_name || "Unnamed Field"}</h3>
                        <p>{item.crop || "Crop not specified"}</p>
                      </div>

                      <span className={`ndvi-trend ${trend.className}`}>
                        {trend.label}
                      </span>
                    </div>

                    <div className="crop-record-details">
                      <div>
                        <span>Growth Stage</span>
                        <strong>{item.growth_stage || "N/A"}</strong>
                      </div>

                      <div>
                        <span>Temperature</span>
                        <strong>{formatValue(item.temperature_c, "°C")}</strong>
                      </div>

                      <div>
                        <span>Humidity</span>
                        <strong>{formatValue(item.humidity_pct, "%")}</strong>
                      </div>

                      <div>
                        <span>7-Day Rainfall</span>
                        <strong>{formatValue(item.rainfall_7d_mm, " mm")}</strong>
                      </div>

                      <div>
                        <span>Current NDVI</span>
                        <strong>{formatValue(item.ndvi)}</strong>
                      </div>

                      <div>
                        <span>Previous NDVI</span>
                        <strong>{formatValue(item.previous_ndvi)}</strong>
                      </div>

                      <div>
                        <span>Latitude</span>
                        <strong>{formatValue(item.latitude)}</strong>
                      </div>

                      <div>
                        <span>Longitude</span>
                        <strong>{formatValue(item.longitude)}</strong>
                      </div>
                    </div>

                    <div className="crop-record-footer">
                      <span>Observation #{item.id}</span>
                      <span>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("en-IN")
                          : "Date unavailable"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default CropMonitoring;
