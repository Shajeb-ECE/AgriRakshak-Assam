
import { useEffect, useState } from "react";
import API from "./api";
import "./FieldInspections.css";

function FieldInspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadInspections = async () => {
      try {
        setLoading(true);
        setError("");

        const observationResponse = await API.get("/observations?limit=100");

        const observations = Array.isArray(observationResponse.data)
          ? observationResponse.data
          : observationResponse.data.items || [];

        const results = await Promise.all(
          observations.map(async (observation) => {
            const response = await API.get(
              `/observations/${observation.id}/inspections`
            );

            return response.data.map((inspection) => ({
              ...inspection,
              field_name: observation.field_name,
              crop: observation.crop,
              report_id: observation.id,
            }));
          })
        );

        if (!cancelled) {
          const records = results
            .flat()
            .sort(
              (a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );

          setInspections(records);
        }
      } catch (err) {
        console.error("Inspection loading error:", err);

        if (!cancelled) {
          setError("Unable to load inspection records. Check the backend.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInspections();

    return () => {
      cancelled = true;
    };
  }, []);

  const confirmedCount = inspections.filter(
    (item) => item.status === "confirmed"
  ).length;

  const notConfirmedCount = inspections.filter(
    (item) => item.status === "not_confirmed"
  ).length;

  const inconclusiveCount = inspections.filter(
    (item) => item.status === "inconclusive"
  ).length;

  return (
    <section className="content">
      <div className="welcome">
        <div>
          <p className="eyebrow">FIELD MANAGEMENT / INSPECTION CENTRE</p>
          <h1>Field Inspections</h1>
          <p className="subtitle">
            Review inspection records submitted by field inspectors
            across monitored agricultural fields.
          </p>
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">📋</div>
          <p>Total Inspections</p>
          <h2>{loading ? "..." : inspections.length}</h2>
          <span>Saved inspection records</span>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">✓</div>
          <p>Confirmed</p>
          <h2>{loading ? "..." : confirmedCount}</h2>
          <span>Confirmed inspections</span>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">✕</div>
          <p>Not Confirmed</p>
          <h2>{loading ? "..." : notConfirmedCount}</h2>
          <span>Unconfirmed inspections</span>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">?</div>
          <p>Inconclusive</p>
          <h2>{loading ? "..." : inconclusiveCount}</h2>
          <span>Inspections needing clarity</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Inspection History</h3>
            <p>All inspection records retrieved from the backend</p>
          </div>

          <span>{inspections.length} records</span>
        </div>

        {loading ? (
          <p className="loading-message">
            Loading inspection records...
          </p>
        ) : inspections.length === 0 ? (
          <div className="observations-empty">
            <span>📋</span>
            <h3>No inspections recorded yet</h3>
            <p>Submitted field inspections will appear here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>INSPECTION ID</th>
                  <th>FIELD NAME</th>
                  <th>CROP</th>
                  <th>INSPECTOR</th>
                  <th>RESULT</th>
                  <th>NOTES</th>
                  <th>DATE</th>
                </tr>
              </thead>

              <tbody>
                {inspections.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{item.field_name || "Unnamed field"}</td>
                    <td>{item.crop || "Unknown"}</td>
                    <td>{item.inspector_name}</td>
                    <td>
                      <span className={`status ${item.status}`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{item.notes || "No notes"}</td>
                    <td>
                      {new Date(item.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default FieldInspections;
