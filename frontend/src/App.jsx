
import { useEffect, useState } from "react";
import API from "./api";
import FieldObservations from "./FieldObservations";
import "./App.css";
import FieldInspections from "./FieldInspections";
import Advisories from "./Advisories";
import Reports from "./Reports";
import CropMonitoring from "./CropMonitoring";
import DiseaseDetection from "./DiseaseDetection";
import TemporalMonitoring from "./TemporalMonitoring";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [observations, setObservations] = useState([]);
const [riskSummary, setRiskSummary] = useState({
  low: 0,
  moderate: 0,
  elevated: 0,
  assessed: 0,
});
const [elevatedAlerts, setElevatedAlerts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Crop Monitoring", icon: "🌱" },
    { name: "Disease Detection", icon: "🔬" },
    { name: "Field Observations", icon: "📋" },
    { name: "Field Inspections", icon: "🧑‍🌾" },
    { name: "Advisories", icon: "📢" },
    { name: "Reports", icon: "📊" },
    { name: "Temporal Monitoring", icon: "📈" },
  ];

  // Fetch observations from FastAPI
  useEffect(() => {
    const fetchObservations = async () => {
      try {
        const response = await API.get("/observations?limit=100");

        const records = Array.isArray(response.data)
          ? response.data
          : response.data.items || [];

        setObservations(records);
        setError("");
      } catch (err) {
        console.error("Backend connection error:", err);
        setError("Unable to load observations. Check whether the backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchObservations();

    const interval = setInterval(fetchObservations, 30000);

    return () => clearInterval(interval);
  }, []);
    // Fetch illustrative risk assessments for recent observations
  useEffect(() => {
    if (observations.length === 0) {
      setRiskSummary({
        low: 0,
        moderate: 0,
        elevated: 0,
        assessed: 0,
      });
      return;
    }

    let cancelled = false;

    const fetchRiskSummary = async () => {
      const recentRecords = [...observations].slice(0, 20);

      const results = await Promise.allSettled(
        recentRecords.map((item) =>
          API.get(`/observations/${item.id}/risk`)
        )
      );

      if (cancelled) return;

      const summary = {
        low: 0,
        moderate: 0,
        elevated: 0,
        assessed: 0,
      };

      const alerts = [];

results.forEach((result, index) => {
  if (result.status !== "fulfilled") return;

  const riskData = result.value.data;
  const level = riskData.level?.toLowerCase();

  if (level === "low") {
    summary.low++;
  } else if (level === "moderate") {
    summary.moderate++;
  } else if (level === "elevated") {
    summary.elevated++;

    alerts.push({
      id: recentRecords[index].id,
      field_name: recentRecords[index].field_name || "Unnamed field",
      crop: recentRecords[index].crop || "Unknown",
      score: riskData.score,
      explanation: riskData.explanation || [],
    });
  } else {
    return;
  }

  summary.assessed++;
});

setRiskSummary(summary);
setElevatedAlerts(alerts);
    };

    fetchRiskSummary();

    return () => {
      cancelled = true;
    };
  }, [observations]);
  // Calculate statistics using actual API records
  const uniqueFields = new Set(
    observations.map((item) => item.field_name).filter(Boolean)
  ).size;

  const pendingCount = observations.filter(
    (item) => item.verification_status?.toLowerCase() === "pending"
  ).length;

  const confirmedCount = observations.filter(
    (item) => item.verification_status?.toLowerCase() === "confirmed"
  ).length;

  const recentObservations = [...observations]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const stats = [
    {
      title: "Fields in Reports",
      value: uniqueFields,
      icon: "🌱",
      color: "green",
      description: "Unique field names",
    },
    {
      title: "Total Observations",
      value: observations.length,
      icon: "🔍",
      color: "orange",
      description: "Records from backend",
    },
    {
      title: "Awaiting Review",
      value: pendingCount,
      icon: "⚠️",
      color: "red",
      description: "Pending verification",
    },
    {
      title: "Confirmed Reports",
      value: confirmedCount,
      icon: "🧑‍🌾",
      color: "blue",
      description: "Verified observations",
    },
  ];

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

 return (
  <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🌾</div>
          <div>
            <h2>AgriRakshak</h2>
            <span>ASSAM AGRITECH</span>
          </div>
        </div>

        <div className="menu-label">MAIN MENU</div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="weather-card">
            <span>ASSAM WEATHER</span>
            <h2>☁️ 28°C</h2>
            <p>Weather demo display</p>
          </div>

          <div className="profile">
            <div className="avatar">A</div>
            <div>
              <strong>Admin User</strong>
              <p>Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">AgriRakshak / </span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <span className="location">📍 Assam, India</span>
            <button className="notification">🔔</button>
          </div>
        </header>
        
        {activePage === "Crop Monitoring" ? (
  <CropMonitoring />
) : activePage === "Field Observations" ? (
  <FieldObservations />
) : activePage === "Disease Detection" ? (
  <DiseaseDetection />
) : activePage === "Field Inspections" ? (
  <FieldInspections />
) : activePage === "Advisories" ? (
  <Advisories />
) : activePage === "Reports" ? (
  <Reports />
) : activePage === "Temporal Monitoring" ? (
  <TemporalMonitoring />
) : (
  <section className="content">  
          <div className="welcome">
            <div>
              <p className="eyebrow">
                AGRICULTURE INTELLIGENCE PLATFORM
              </p>
              <h1>{activePage}</h1>
              <p className="subtitle">
                Monitor crop health, detect diseases and support farmers
                with data-driven insights.
              </p>
            </div>

            <div className="date-chip">📅 {formattedDate}</div>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="stats-grid">
            {stats.map((stat) => (
              <div className="stat-card" key={stat.title}>
                <div className={`stat-icon ${stat.color}`}>
                  {stat.icon}
                </div>
                <p>{stat.title}</p>
                <h2>{loading ? "..." : stat.value}</h2>
                <span>{stat.description}</span>
              </div>
            ))}
          </div>
          <div className="risk-overview">
  <div className="risk-overview-heading">
    <div>
      <h3>Field Risk Overview</h3>
      <p>Illustrative risk levels from recent field observations</p>
    </div>
    <span>{riskSummary.assessed} assessed</span>
  </div>

  <div className="risk-summary-grid">
    <div className="risk-summary-card low-risk">
      <span>🟢</span>
      <p>Low Risk</p>
      <h2>{loading ? "..." : riskSummary.low}</h2>
    </div>

    <div className="risk-summary-card moderate-risk">
      <span>🟡</span>
      <p>Moderate Risk</p>
      <h2>{loading ? "..." : riskSummary.moderate}</h2>
    </div>

    <div className="risk-summary-card elevated-risk">
      <span>🔴</span>
      <p>Elevated Risk</p>
      <h2>{loading ? "..." : riskSummary.elevated}</h2>
    </div>
  </div>

  <p className="risk-disclaimer">
    Demo assessment only. These scores are not disease probabilities,
    diagnoses or validated crop-health forecasts.
  </p>
</div>
{/* Elevated Risk Alerts */}
<div className="elevated-alert-section">
  <div className="elevated-alert-heading">
    <div>
      <h3>⚠️ Fields Requiring Attention</h3>
      <p>Fields with elevated illustrative risk scores</p>
    </div>
    <span>{elevatedAlerts.length} alerts</span>
  </div>

  {loading ? (
    <p>Loading risk alerts...</p>
  ) : elevatedAlerts.length > 0 ? (
    elevatedAlerts.map((alert) => (
      <div className="elevated-alert-card" key={alert.id}>
        <div className="elevated-alert-info">
          <h4>{alert.field_name}</h4>
          <p>Crop: {alert.crop}</p>
          <strong>Illustrative risk score: {alert.score}/100</strong>

          <ul>
            {alert.explanation.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>

        <button
          className="alert-view-button"
          onClick={() => setActivePage("Field Observations")}
        >
          View Field Reports →
        </button>
      </div>
    ))
  ) : (
    <p className="no-risk-alerts">
      No elevated-risk fields in the assessed observations.
    </p>
  )}

  <p className="risk-disclaimer">
    Illustrative demo alerts only. Field inspection is required for
    actual crop-health verification.
  </p>
</div>
          <div className="section-grid">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent Field Observations</h3>
                  <p>Latest submitted crop-health reports</p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setActivePage("Field Observations")}
                >
                  View all →
                </button>
              </div>

              {loading ? (
                <p className="loading-message">
                  Loading observations...
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>FIELD</th>
                        <th>CROP</th>
                        <th>GROWTH STAGE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentObservations.length > 0 ? (
                        recentObservations.map((item) => {
                          const status = (
                            item.verification_status || "unknown"
                          ).toLowerCase();

                          return (
                            <tr key={item.id}>
                              <td>{item.field_name || "Unnamed field"}</td>
                              <td>{item.crop || "—"}</td>
                              <td>{item.growth_stage || "Unknown"}</td>
                              <td>
                                <span
                                  className={`status ${
                                    status === "pending"
                                      ? "pending"
                                      : status === "confirmed"
                                      ? "confirmed"
                                      : ""
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4">
                            No observations found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="demo-note">
                Statistics and observations are fetched from the backend.
              </p>
            </div>

            <div className="panel quick-panel">
              <h3>Quick Actions</h3>
              <p>Access important platform features</p>

              <button onClick={() => setActivePage("Crop Monitoring")}>
                <span>🌾</span>
                <div>
                  <strong>Monitor Crops</strong>
                  <small>View crop observations</small>
                </div>
                <b>→</b>
              </button>

              <button onClick={() => setActivePage("Disease Detection")}>
                <span>🔬</span>
                <div>
                  <strong>Disease Detection</strong>
                  <small>Analyse rice leaf images</small>
                </div>
                <b>→</b>
              </button>

              <button onClick={() => setActivePage("Advisories")}>
                <span>📢</span>
                <div>
                  <strong>Farmer Advisory</strong>
                  <small>View crop recommendations</small>
                </div>
                <b>→</b>
              </button>
            </div>
          </div>

          <footer>
            <strong>AgriRakshak Assam</strong>
            <span>
              Crop Health Monitoring & Intelligence Platform
            </span>
          </footer>
          </section>
  )}
      </main>
    </div>
  );
}

export default App;
