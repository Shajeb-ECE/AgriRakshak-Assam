import { useState } from "react";
import API from "./api";
import "./TemporalMonitoring.css";

function TemporalMonitoring() {
  const [fieldName, setFieldName] = useState("");
  const [crop, setCrop] = useState("rice");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMonitoring = async (e) => {
    e.preventDefault();

    if (!fieldName.trim()) {
      setError("Please enter a field name.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await API.get("/temporal-monitoring", {
        params: {
          field_name: fieldName.trim(),
          crop: crop || undefined,
        },
      });

      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to fetch temporal monitoring data."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getTrendClass = (trend) => {
    if (trend === "improving") return "trend-improving";
    if (trend === "deteriorating") return "trend-deteriorating";
    if (trend === "stable") return "trend-stable";

    return "trend-neutral";
  };

  const getRiskClass = (level) => {
    if (level === "low") return "risk-low";
    if (level === "moderate") return "risk-moderate";
    if (level === "elevated") return "risk-elevated";

    return "risk-neutral";
  };

  return (
    <section className="temporal-page">
      <div className="temporal-header">
        <div>
          <p className="temporal-eyebrow">CROP HEALTH INTELLIGENCE</p>
          <h1>Temporal Monitoring</h1>
          <p>
            Track crop-health changes and illustrative risk levels
            across field observations.
          </p>
        </div>
      </div>

      <div className="temporal-search-card">
        <h3>Search Field History</h3>

        <form onSubmit={fetchMonitoring} className="temporal-form">
          <div className="temporal-form-group">
            <label>Field Name</label>

            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Enter exact field name"
            />
          </div>

          <div className="temporal-form-group">
            <label>Crop</label>

            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            >
              <option value="">All crops</option>
              <option value="rice">Rice</option>
              <option value="tea">Tea</option>
              <option value="mustard">Mustard</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "View Monitoring"}
          </button>
        </form>
      </div>

      {error && (
        <div className="temporal-error">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="temporal-loading">
          Fetching field monitoring history...
        </div>
      )}

      {data && (
        <>
          <div className="temporal-field-banner">
            <div>
              <h2>{data.field_name}</h2>
              <span>
                Crop: {data.crop || "Unknown"} ·{" "}
                {data.total_observations} observations
              </span>
            </div>

            <div className="temporal-period">
              <span>Monitoring period</span>
              <strong>
                {formatDate(data.first_observation)}
              </strong>
              <span>to</span>
              <strong>
                {formatDate(data.latest_observation)}
              </strong>
            </div>
          </div>

          {/* NDVI SUMMARY */}
          <div className="temporal-metrics-grid">
            <div className="temporal-metric-card">
              <span className="metric-icon">🌿</span>
              <p>First NDVI</p>
              <h2>
                {data.ndvi.first_value ?? "N/A"}
              </h2>
            </div>

            <div className="temporal-metric-card">
              <span className="metric-icon">📈</span>
              <p>Latest NDVI</p>
              <h2>
                {data.ndvi.latest_value ?? "N/A"}
              </h2>
            </div>

            <div className="temporal-metric-card">
              <span className="metric-icon">↕️</span>
              <p>NDVI Change</p>
              <h2>
                {data.ndvi.change !== null
                  ? data.ndvi.change > 0
                    ? `+${data.ndvi.change}`
                    : data.ndvi.change
                  : "N/A"}
              </h2>
            </div>

            <div className="temporal-metric-card">
              <span className="metric-icon">🌱</span>
              <p>NDVI Trend</p>
              <h2 className={getTrendClass(data.ndvi.trend)}>
                {data.ndvi.trend.replaceAll("_", " ")}
              </h2>
            </div>
          </div>

          {/* RISK PROGRESSION */}
          <div className="temporal-section-card">
            <div className="temporal-section-header">
              <div>
                <h3>Risk Progression</h3>
                <p>Illustrative risk assessment across observations</p>
              </div>

              <span
                className={`risk-badge ${getRiskClass(
                  data.risk.latest_level
                )}`}
              >
                {data.risk.latest_level}
              </span>
            </div>

            <div className="risk-progression">
              {data.risk.history.map((item, index) => (
                <div className="risk-history-item" key={item.observation_id}>
                  <div
                    className={`risk-history-dot ${getRiskClass(
                      item.risk_level
                    )}`}
                  />

                  <div className="risk-history-content">
                    <span>
                      Observation #{item.observation_id}
                    </span>

                    <strong className={getRiskClass(item.risk_level)}>
                      {item.risk_level}
                    </strong>

                    <p>Score: {item.risk_score}/100</p>

                    <small>{formatDate(item.created_at)}</small>
                  </div>

                  {index < data.risk.history.length - 1 && (
                    <div className="risk-history-arrow">→</div>
                  )}
                </div>
              ))}
            </div>

            <div className="risk-change-message">
              {data.risk.changed ? (
                <>
                  ⚠️ Risk level changed from{" "}
                  <strong>{data.risk.first_level}</strong> to{" "}
                  <strong>{data.risk.latest_level}</strong>.
                </>
              ) : (
                <>
                  Risk level remained{" "}
                  <strong>{data.risk.latest_level}</strong> across
                  recorded observations.
                </>
              )}
            </div>
          </div>

          {/* ENVIRONMENT */}
          <div className="temporal-section-card">
            <h3>Latest Environmental Conditions</h3>

            <div className="environment-grid">
              <div>
                <span>🌡️ Temperature</span>
                <strong>
                  {data.environment.latest_temperature_c !== null
                    ? `${data.environment.latest_temperature_c}°C`
                    : "N/A"}
                </strong>
              </div>

              <div>
                <span>💧 Humidity</span>
                <strong>
                  {data.environment.latest_humidity_pct !== null
                    ? `${data.environment.latest_humidity_pct}%`
                    : "N/A"}
                </strong>
              </div>

              <div>
                <span>🌧️ Rainfall (7 days)</span>
                <strong>
                  {data.environment.latest_rainfall_7d_mm !== null
                    ? `${data.environment.latest_rainfall_7d_mm} mm`
                    : "N/A"}
                </strong>
              </div>
            </div>
          </div>

          {/* RECOMMENDATION */}
          <div className="temporal-recommendation">
            <div className="recommendation-icon">🔔</div>

            <div>
              <h3>Monitoring Recommendation</h3>
              <p>{data.monitoring_recommendation}</p>
            </div>
          </div>

          {/* OBSERVATION HISTORY */}
          <div className="temporal-section-card">
            <div className="temporal-section-header">
              <div>
                <h3>Observation History</h3>
                <p>Recorded field monitoring data</p>
              </div>
            </div>

            <div className="temporal-table-wrapper">
              <table className="temporal-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Growth Stage</th>
                    <th>NDVI</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Verification</th>
                  </tr>
                </thead>

                <tbody>
                  {data.observations.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.created_at)}</td>
                      <td>{item.growth_stage || "Unknown"}</td>
                      <td>{item.ndvi ?? "N/A"}</td>
                      <td>
                        {item.temperature_c !== null
                          ? `${item.temperature_c}°C`
                          : "N/A"}
                      </td>
                      <td>
                        {item.humidity_pct !== null
                          ? `${item.humidity_pct}%`
                          : "N/A"}
                      </td>
                      <td>
                        <span className="verification-status">
                          {item.verification_status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="temporal-disclaimer">
            <strong>⚠️ Data interpretation notice</strong>
            <p>{data.disclaimer}</p>
            <p>
              Risk scores are illustrative rule-based assessments.
              They are not validated disease probabilities or
              scientifically validated crop-health forecasts.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

export default TemporalMonitoring;