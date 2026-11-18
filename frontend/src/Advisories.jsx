
import { useEffect, useMemo, useState } from "react";
import API from "./api";
import "./Advisories.css";

function getRiskDetails(data) {
  const score = Number(
    data?.score ??
    data?.risk_score ??
    data?.riskScore ??
    0
  );

  const suppliedLevel = String(
    data?.risk_level ??
    data?.level ??
    data?.category ??
    ""
  ).toLowerCase();

  let level = suppliedLevel;

  if (!["low", "moderate", "elevated", "insufficient_data"].includes(level)) {
    level = score >= 50
      ? "elevated"
      : score >= 20
      ? "moderate"
      : "low";
  }

  return {
    score,
    level,

    explanation: Array.isArray(data?.explanation)
      ? data.explanation.join(" ")
      : data?.explanation ??
        data?.reason ??
        data?.message ??
        "Risk assessment information is available for this field.",

    assessment_completeness: data?.assessment_completeness ?? null,
    missing_fields: data?.missing_fields ?? [],
    evaluated_fields: data?.evaluated_fields ?? [],
  };
}
function WeatherCard({ weather }) {
  const current = weather?.current;
  const forecast = weather?.forecast_3_days;

  if (!current) {
    return (
      <div className="advisory-weather">
        <h4>🌦️ Weather Information</h4>
        <p>Weather data is currently unavailable.</p>
      </div>
    );
  }

  return (
    <div className="advisory-weather">
      <h4>🌦️ Location-Based Weather</h4>

      <div className="weather-current-grid">
        <div className="weather-item">
          <span>🌡️ Temperature</span>
          <strong>{current.temperature_2m ?? "N/A"}°C</strong>
        </div>

        <div className="weather-item">
          <span>💧 Humidity</span>
          <strong>{current.relative_humidity_2m ?? "N/A"}%</strong>
        </div>

        <div className="weather-item">
          <span>🌧️ Rainfall</span>
          <strong>{current.precipitation ?? "N/A"} mm</strong>
        </div>

        <div className="weather-item">
          <span>💨 Wind Speed</span>
          <strong>{current.wind_speed_10m ?? "N/A"} km/h</strong>
        </div>
      </div>

      {forecast?.time && (
        <>
          <h5>3-Day Forecast</h5>

          <div className="weather-forecast">
            {forecast.time.map((date, index) => (
              <div className="forecast-day" key={date}>
                <strong>
  {new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  })}
</strong>

                <p>
                  ↑ {forecast.temperature_2m_max?.[index] ?? "N/A"}°C
                </p>

                <p>
                  ↓ {forecast.temperature_2m_min?.[index] ?? "N/A"}°C
                </p>

                <p>
                  🌧️ {forecast.precipitation_sum?.[index] ?? "N/A"} mm
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="weather-source">
        Source: {weather.source || "External weather service"}
      </p>
    </div>
  );
}
function AdvisoryCard({ item }) {

  const recommendations =
    item.advisory?.recommendations || [];

  const priority =
    item.advisory?.priority === "high"
      ? "High"
      : item.advisory?.priority === "medium"
      ? "Medium"
      : item.advisory?.priority === "data_collection"
      ? "Data Collection"
      : "Routine";

  return (
    <article className="advisory-card">

      <div className="advisory-card-top">
        <div>
          <span className="advisory-field-label">
            FIELD OBSERVATION
          </span>

          <h3>
            {item.observation.field_name || "Unnamed Field"}
          </h3>

          <p className="advisory-crop">
            Crop: {item.observation.crop || "Not specified"}
          </p>
        </div>

        <span className={`risk-badge ${item.risk.level}`}>
          {item.risk.level.replace("_", " ")}
        </span>
      </div>

      <div className="advisory-score-row">
        <div>
          <span className="advisory-muted">
            Illustrative risk score
          </span>

          <h2>{item.risk.score}/100</h2>
        </div>

        <span className={`priority-badge ${item.risk.level}`}>
          {priority} Priority
        </span>
      </div>

      <div className="advisory-explanation">
        <strong>Assessment explanation</strong>

        <p>{item.risk.explanation}</p>
      </div>

      <div className="advisory-explanation">
  <strong>Data Assessment</strong>

  <p>
    Data completeness:{" "}
    {item.risk.assessment_completeness?.percentage ?? "N/A"}%
  </p>

  <p>
    Indicators evaluated:{" "}
    {item.risk.assessment_completeness?.evaluated_count ?? "N/A"} /{" "}
    {item.risk.assessment_completeness?.total_indicators ?? "N/A"}
  </p>

  {item.risk.missing_fields?.length > 0 && (
    <p>
      Missing measurements:{" "}
      {item.risk.missing_fields.join(", ")}
    </p>
  )}
</div>

<div className="advisory-explanation">
  <strong>AI Disease Assessment</strong>
      <WeatherCard
        weather={item.advisory?.weather}
      />
  {item.advisory?.latest_disease_assessment ? (
    <>
      <p>
        Predicted Disease:{" "}
        <strong>
          {item.advisory.latest_disease_assessment.predicted_class ||
           item.advisory.latest_disease_assessment.disease ||
           "Unknown"}
        </strong>
      </p>

      <p>
        Confidence:{" "}
        {item.advisory.latest_disease_assessment.confidence != null
          ? `${item.advisory.latest_disease_assessment.confidence}%`
          : "N/A"}
      </p>

      <p>
        Verification Status:{" "}
        {item.advisory.latest_disease_assessment.verification_status ||
          "Pending"}
      </p>
    </>
  ) : (
    <p>No AI disease assessment available for this observation.</p>
  )}
</div>

      <div className="recommendation-list">
        <h4>Recommended Actions</h4>

        {recommendations.length > 0 ? (
          recommendations.map((recommendation, index) => (
            <div className="recommendation-item" key={index}>
              <span>{index + 1}</span>
              <p>{recommendation}</p>
            </div>
          ))
        ) : (
          <p>No recommendations are available.</p>
        )}
      </div>

      <div className="advisory-footer">
        Observation ID: #{item.observation.id}
      </div>

    </article>
  );
}


function Advisories() {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [failedAssessments, setFailedAssessments] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAdvisories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/observations?limit=100");

        const observations = Array.isArray(response.data)
          ? response.data
          : response.data.items || [];

       const results = await Promise.all(
  observations.map(async (observation) => {
    try {
      const [riskResponse, advisoryResponse] = await Promise.all([
        API.get(`/observations/${observation.id}/risk`),
        API.get(`/observations/${observation.id}/advisory`)
      ]);

      return {
        observation,
        risk: getRiskDetails(riskResponse.data),
        advisory: advisoryResponse.data
      };

    } catch (err) {
      console.error(
        `Advisory assessment failed for observation ${observation.id}:`,
        err
      );

      return null;
    }
  })
);

        if (!cancelled) {
  const successfulResults = results.filter(Boolean);

  setAdvisories(successfulResults);
  setFailedAssessments(results.length - successfulResults.length);
}
      } catch (err) {
        console.error("Advisory loading error:", err);

        if (!cancelled) {
          setError(
            "Unable to load advisory information. Please check that the backend is running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAdvisories();

    return () => {
      cancelled = true;
    };
 }, [refreshKey]);

const counts = useMemo(() => ({
  total: advisories.length,

  elevated: advisories.filter(
    (item) => item.risk.level === "elevated"
  ).length,

  moderate: advisories.filter(
    (item) => item.risk.level === "moderate"
  ).length,

  low: advisories.filter(
    (item) => item.risk.level === "low"
  ).length,

  insufficient: advisories.filter(
    (item) => item.risk.level === "insufficient_data"
  ).length,
}), [advisories]);
  const filteredAdvisories = advisories.filter(
    (item) =>
      filter === "all" || item.risk.level === filter
  );

  return (
    <section className="content advisories-page">
      <div className="welcome advisory-welcome">
  <div>
    <p className="eyebrow">
      AGRICULTURE INTELLIGENCE PLATFORM
    </p>

    <h1>Crop Advisories</h1>

    <p className="subtitle">
      Field-based recommendations for crop monitoring
      and agricultural decision-making.
    </p>
  </div>

  <button
    className="advisory-refresh-btn"
    onClick={() => setRefreshKey((prev) => prev + 1)}
    disabled={loading}
  >
    {loading ? "Refreshing..." : "↻ Refresh Advisories"}
  </button>
</div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
      {!loading && failedAssessments > 0 && (
  <div className="advisory-disclaimer">
    <strong>⚠️ Incomplete assessment:</strong>{" "}
    Risk assessments could not be loaded for {failedAssessments} field(s).
    The statistics below include only successfully assessed fields.
  </div>
)}

      <div className="advisory-stats">


        <div className="advisory-stat-card">
          <span>Total Assessed Fields</span>
          <h2>{loading ? "..." : counts.total}</h2>
        </div>

        <div className="advisory-stat-card elevated-stat">
          <span>High Priority</span>
          <h2>{loading ? "..." : counts.elevated}</h2>
        </div>

        <div className="advisory-stat-card moderate-stat">
          <span>Medium Priority</span>
          <h2>{loading ? "..." : counts.moderate}</h2>
        </div>

        <div className="advisory-stat-card low-stat">
          <span>Low Priority</span>
          <h2>{loading ? "..." : counts.low}</h2>
        </div>
      </div>

      <div className="advisory-stat-card">
  <span>Insufficient Data</span>
  <h2>{loading ? "..." : counts.insufficient}</h2>
</div>

      <div className="advisory-disclaimer">
        <strong>Prototype notice:</strong> Risk scores and priority
        levels are illustrative outputs from the current backend
        demonstration. Recommendations are general monitoring
        guidance, not confirmed diagnoses or pesticide prescriptions.
      </div>

      <div className="advisory-section-heading">
        <div>
          <h2>Field Recommendations</h2>
          <p>Review recommended actions for assessed fields.</p>
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="advisory-filter"
        >
          <option value="all">All priorities</option>
          <option value="elevated">High priority</option>
          <option value="moderate">Medium priority</option>
          <option value="low">Low priority</option>
          <option value="insufficient_data">
  Insufficient Data
</option>
        </select>
      </div>

      {loading ? (
        <div className="panel">
          Loading field risk assessments...
        </div>
      ) : filteredAdvisories.length === 0 ? (
        <div className="panel advisory-empty">
          <h3>No advisory records found</h3>
          <p>
            {advisories.length === 0
              ? "No successful risk assessments are available yet."
              : "No fields match the selected priority filter."}
          </p>
        </div>
      ) : (
        <div className="advisory-grid">
          {filteredAdvisories.map((item) => (
            <AdvisoryCard
              key={item.observation.id}
              item={item}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Advisories;
