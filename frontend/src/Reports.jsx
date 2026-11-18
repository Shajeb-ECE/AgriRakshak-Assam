
import { useEffect, useMemo, useState } from "react";
import API from "./api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./Reports.css";

const COLORS = ["#16a34a", "#f59e0b", "#dc2626", "#64748b"];

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

  const level = ["low", "moderate", "elevated"].includes(suppliedLevel)
    ? suppliedLevel
    : score >= 65
    ? "elevated"
    : score >= 35
    ? "moderate"
    : "low";

  return { score, level };
}

function downloadCSV(observations) {
  const headers = [
    "Observation ID",
    "Field Name",
    "Crop",
    "Growth Stage",
    "Latitude",
    "Longitude",
    "Temperature (C)",
    "Humidity (%)",
    "Rainfall 7 Days (mm)",
    "NDVI",
    "Previous NDVI",
    "Verification Status",
    "Risk Score",
    "Risk Level",
    "Date",
  ];

  const escapeCSV = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const getRisk = (item) => {
  const required = [
    item.humidity_pct,
    item.rainfall_7d_mm,
    item.ndvi,
    item.previous_ndvi,
  ];

  if (required.some((value) => value === null || value === undefined || value === "")) {
    return {
      score: 0,
      level: "insufficient_data",
    };
  }

  let score = 0;

  if (item.humidity_pct >= 85) score += 20;
  if (item.rainfall_7d_mm >= 50) score += 15;

  const ndviChange = item.ndvi - item.previous_ndvi;

  if (ndviChange <= -0.10) {
    score += 35;
  } else if (ndviChange <= -0.05) {
    score += 20;
  }

  let level = "low";

  if (score >= 50) {
    level = "elevated";
  } else if (score >= 20) {
    level = "moderate";
  }

  return { score, level };
};
const rows = observations.map((item) => {
  const risk = getRisk(item);

  return [
    item.id,
    item.field_name,
    item.crop,
    item.growth_stage,
    item.latitude,
    item.longitude,
    item.temperature_c,
    item.humidity_pct,
    item.rainfall_7d_mm,
    item.ndvi,
    item.previous_ndvi,
    item.verification_status,
    risk.score,
    risk.level,
    item.created_at,
  ];
});

  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "agrirakshak_field_report.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function Reports() {
  const [observations, setObservations] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadReportData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/observations?limit=100");

        const records = Array.isArray(response.data)
          ? response.data
          : response.data.items || [];

        const results = await Promise.all(
          records.map(async (item) => {
            const [inspectionResult, riskResult] = await Promise.allSettled([
              API.get(`/observations/${item.id}/inspections`),
              API.get(`/observations/${item.id}/risk`),
            ]);

            return {
              ...item,
              inspections:
                inspectionResult.status === "fulfilled"
                  ? inspectionResult.value.data || []
                  : [],
              risk:
                riskResult.status === "fulfilled"
                  ? getRiskDetails(riskResult.value.data)
                  : null,
            };
          })
        );

        if (!cancelled) {
          setObservations(results);
          setInspections(results.flatMap((item) => item.inspections));
        }
      } catch (err) {
        console.error("Report data loading error:", err);

        if (!cancelled) {
          setError(
            "Unable to load report data. Please check the backend."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReportData();

    return () => {
      cancelled = true;
    };
  }, []);

  const statistics = useMemo(() => {
    const confirmed = observations.filter(
      (item) => item.verification_status === "confirmed"
    ).length;

    const pending = observations.filter(
      (item) => item.verification_status === "pending"
    ).length;

    const notConfirmed = observations.filter(
      (item) => item.verification_status === "not_confirmed"
    ).length;

    const inconclusive = observations.filter(
  (item) => item.verification_status === "inconclusive"
).length;

    const assessed = observations.filter((item) => item.risk !== null);

    return {
      totalObservations: observations.length,
      totalInspections: inspections.length,
      confirmed,
      pending,
      notConfirmed,
      inconclusive,
      assessed: assessed.length,
      low: assessed.filter((item) => item.risk.level === "low").length,
      moderate: assessed.filter((item) => item.risk.level === "moderate").length,
      elevated: assessed.filter((item) => item.risk.level === "elevated").length,
    };
  }, [observations, inspections]);

  const cropData = useMemo(() => {
    const counts = {};

    observations.forEach((item) => {
      const crop = item.crop || "Unspecified";
      counts[crop] = (counts[crop] || 0) + 1;
    });

    return Object.entries(counts).map(([crop, count]) => ({
      crop,
      count,
    }));
  }, [observations]);

  const inspectionData = useMemo(() => {
    const statuses = {
      Confirmed: 0,
      "Not Confirmed": 0,
      Inconclusive: 0,
    };

    inspections.forEach((item) => {
      if (item.status === "confirmed") statuses.Confirmed += 1;
      else if (item.status === "not_confirmed") statuses["Not Confirmed"] += 1;
      else if (item.status === "inconclusive") statuses.Inconclusive += 1;
    });

    return Object.entries(statuses).map(([name, value]) => ({
      name,
      value,
    }));
  }, [inspections]);

  const riskData = [
    { name: "Low", value: statistics.low },
    { name: "Moderate", value: statistics.moderate },
    { name: "Elevated", value: statistics.elevated },
  ];

  return (
    <section className="content reports-page">
      <div className="welcome">
        <div>
          <p className="eyebrow">AGRICULTURE INTELLIGENCE PLATFORM</p>
          <h1>Reports & Analytics</h1>
          <p className="subtitle">
            Overview of field observations, inspections and crop monitoring data.
          </p>
        </div>

        <button
          className="report-export-button"
          onClick={() => downloadCSV(observations)}
          disabled={loading || observations.length === 0}
        >
          ↓ Export CSV
        </button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {loading ? (
        <div className="panel">
          Loading report analytics...
        </div>
      ) : (
        <>
          <div className="report-stats-grid">
            <div className="report-stat-card">
              <span>Total Observations</span>
              <h2>{statistics.totalObservations}</h2>
              <small>Field reports recorded</small>
            </div>

            <div className="report-stat-card">
              <span>Total Inspections</span>
              <h2>{statistics.totalInspections}</h2>
              <small>Inspection records saved</small>
            </div>

            <div className="report-stat-card">
              <span>Confirmed Reports</span>
              <h2>{statistics.confirmed}</h2>
              <small>Verified as confirmed</small>
            </div>

            <div className="report-stat-card">
              <span>Awaiting Review</span>
              <h2>{statistics.pending}</h2>
              <small>Pending verification</small>
            </div>
          </div>

          <div className="report-section-title">
            <h2>Crop Monitoring Analytics</h2>
            <p>Distribution of recorded crops and inspection outcomes.</p>
          </div>

          <div className="report-chart-grid">
            <div className="panel report-chart-card">
              <h3>Crop-wise Observations</h3>
              <p>Number of field reports for each crop</p>

              {cropData.length === 0 ? (
                <p>No crop data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={cropData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="crop" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Observations"
                      fill="#16a34a"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel report-chart-card">
              <h3>Inspection Status</h3>
              <p>Distribution of saved inspection outcomes</p>

              {inspections.length === 0 ? (
                <p>No inspection data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={inspectionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={85}
                      label
                    >
                      {inspectionData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index + 1]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel report-chart-card">
              <h3>Risk Distribution</h3>
              <p>Distribution of available illustrative risk assessments</p>

              {statistics.assessed === 0 ? (
                <p>No successful risk assessments available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={riskData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={85}
                      label
                    >
                      {riskData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={["#16a34a", "#f59e0b", "#dc2626"][index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel report-chart-card">
              <h3>Verification Summary</h3>
              <p>Current observation verification statuses</p>

              <div className="verification-summary">
                <div>
                  <span className="verification-dot confirmed-dot" />
                  Confirmed
                  <strong>{statistics.confirmed}</strong>
                </div>

                <div>
                  <span className="verification-dot pending-dot" />
                  Pending
                  <strong>{statistics.pending}</strong>
                </div>

                <div>
                  <span className="verification-dot rejected-dot" />
                  Not Confirmed
                  <strong>{statistics.notConfirmed}</strong>
                </div>
                <div>
  <span className="verification-dot" style={{ background: "#f59e0b" }} />
  Inconclusive
  <strong>{statistics.inconclusive}</strong>
</div>
              </div>
            </div>
          </div>

          <div className="report-disclaimer">
            <strong>Data note:</strong> Charts are calculated from records
            currently returned by the backend, limited to the latest 100
            observations. Risk categories use illustrative prototype scores
            and should not be interpreted as validated disease predictions.
          </div>
        </>
      )}
    </section>
  );
}

export default Reports;
