
import { useEffect, useMemo, useState } from "react";
import API from "./api";
import "./FieldObservations.css";
import FieldMap from "./FieldMap";

function FieldObservations() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedObservation, setSelectedObservation] = useState(null);
  const [risk, setRisk] = useState(null);
  const [inspections, setInspections] = useState([]);
const [diseaseAssessments, setDiseaseAssessments] = useState([]);
const [selectedDiseaseImage, setSelectedDiseaseImage] = useState(null);
const [imageLoading, setImageLoading] = useState(false);
const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [inspectorName, setInspectorName] = useState("");
  const [inspectionStatus, setInspectionStatus] = useState("confirmed");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [showObservationForm, setShowObservationForm] = useState(false);
const [observationSubmitting, setObservationSubmitting] = useState(false);
const [observationMessage, setObservationMessage] = useState("");
const [observationError, setObservationError] = useState("");

const [gpsLoading, setGpsLoading] = useState(false);
const [gpsMessage, setGpsMessage] = useState("");
const [gpsAccuracy, setGpsAccuracy] = useState(null);

const [newObservation, setNewObservation] = useState({
  field_name: "",
  crop: "rice",
  growth_stage: "unknown",
  latitude: "",
  longitude: "",
  temperature_c: "",
  humidity_pct: "",
  rainfall_7d_mm: "",
  ndvi: "",
  previous_ndvi: "",
  notes: "",
});

  const loadObservations = async () => {
    try {
      const response = await API.get("/observations?limit=100");
      console.table(
  response.data.map((item) => ({
    id: item.id,
    field: item.field_name,
    latitude: item.latitude,
    longitude: item.longitude,
    crop: item.crop,
  }))
);
      const records = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];

      setObservations(records);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load observations. Check the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObservations();
  }, []);

  const crops = useMemo(
    () => [...new Set(observations.map((item) => item.crop).filter(Boolean))],
    [observations]
  );

  const pendingCount = observations.filter(
    (item) => (item.verification_status || "").toLowerCase() === "pending"
  ).length;

  const confirmedCount = observations.filter(
    (item) => (item.verification_status || "").toLowerCase() === "confirmed"
  ).length;

  const filteredObservations = observations.filter((item) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (item.field_name || "").toLowerCase().includes(searchText) ||
      String(item.id || "").includes(searchText);

    const matchesCrop = cropFilter === "all" || item.crop === cropFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (item.verification_status || "").toLowerCase() === statusFilter;

    return matchesSearch && matchesCrop && matchesStatus;
  });


const openDetails = async (item) => {
  setSelectedObservation(item);
  setRisk(null);
  setInspections([]);
  setDiseaseAssessments([]);
  setDetailError("");
  setActionMessage("");
  setDetailLoading(true);

  try {
    const [
      riskResponse,
      inspectionResponse,
      diseaseResponse
    ] = await Promise.all([
      API.get(`/observations/${item.id}/risk`),
      API.get(`/observations/${item.id}/inspections`),
      API.get(`/observations/${item.id}/disease-assessments`)
    ]);

    setRisk(riskResponse.data);
    setInspections(inspectionResponse.data);
    setDiseaseAssessments(diseaseResponse.data);

  } catch (err) {
    console.error(err);
    setDetailError("Could not load all report details. Please try again.");
  } finally {
    setDetailLoading(false);
  }
};

const openDiseaseImage = async (observationId, assessment) => {
  setImageLoading(true);

  try {
    const response = await API.get(
      `/observations/${observationId}/disease-assessments/${assessment.id}/image`,
      { responseType: "blob" }
    );

    const imageUrl = URL.createObjectURL(response.data);

    setSelectedDiseaseImage({
      url: imageUrl,
      filename: assessment.image_filename
    });

  } catch (err) {
    console.error("Image retrieval error:", err);
    setDetailError("Unable to retrieve the original disease image.");
  } finally {
    setImageLoading(false);
  }
};



  const updateVerification = async (status) => {
    if (!selectedObservation) return;

    setActionLoading(true);
    setActionMessage("");

    try {
      await API.patch(
        `/observations/${selectedObservation.id}/verification`,
        null,
        { params: { status } }
      );

      setObservations((previous) =>
        previous.map((item) =>
          item.id === selectedObservation.id
            ? { ...item, verification_status: status }
            : item
        )
      );

      setSelectedObservation((previous) => ({
        ...previous,
        verification_status: status
      }));

      setActionMessage("Verification status updated successfully.");
    } catch (err) {
      console.error(err);
      setDetailError("Could not update verification status.");
    } finally {
      setActionLoading(false);
    }
  };

  const submitInspection = async (event) => {
    event.preventDefault();

    if (!selectedObservation || !inspectorName.trim()) {
      setDetailError("Please enter the inspector's name.");
      return;
    }

    setActionLoading(true);
    setDetailError("");
    setActionMessage("");

    try {
      await API.post(
        `/observations/${selectedObservation.id}/inspections`,
        null,
        {
          params: {
            inspector_name: inspectorName.trim(),
            status: inspectionStatus,
            notes: inspectionNotes
          }
        }
      );

      const [
  inspectionResponse,
  observationResponse,
  diseaseResponse
] = await Promise.all([
  API.get(`/observations/${selectedObservation.id}/inspections`),
  API.get(`/observations?limit=100`),
  API.get(`/observations/${selectedObservation.id}/disease-assessments`)
]);

setInspections(inspectionResponse.data);
setDiseaseAssessments(diseaseResponse.data);

const updatedObservation = observationResponse.data.find(
  (item) => item.id === selectedObservation.id
);

if (updatedObservation) {
  setSelectedObservation(updatedObservation);

  setObservations((previous) =>
    previous.map((item) =>
      item.id === updatedObservation.id
        ? updatedObservation
        : item
    )
  );
}
      setInspectorName("");
      setInspectionNotes("");
      setActionMessage("Field inspection submitted successfully.");
    } catch (err) {
      console.error(err);
      setDetailError("Could not submit inspection. Please check the details.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleObservationSubmit = async (event) => {
  event.preventDefault();

  setObservationSubmitting(true);
  setObservationError("");
  setObservationMessage("");

  const optionalNumber = (value) =>
    value === "" ? null : Number(value);

  const payload = {
    ...newObservation,
    latitude: Number(newObservation.latitude),
    longitude: Number(newObservation.longitude),
    temperature_c: optionalNumber(newObservation.temperature_c),
    humidity_pct: optionalNumber(newObservation.humidity_pct),
    rainfall_7d_mm: optionalNumber(newObservation.rainfall_7d_mm),
    ndvi: optionalNumber(newObservation.ndvi),
    previous_ndvi: optionalNumber(newObservation.previous_ndvi),
  };

  try {
    await API.post("/observations", payload);

    await loadObservations();

    setObservationMessage("New field observation submitted successfully.");
    setShowObservationForm(false);

    setNewObservation({
      field_name: "",
      crop: "rice",
      growth_stage: "unknown",
      latitude: "",
      longitude: "",
      temperature_c: "",
      humidity_pct: "",
      rainfall_7d_mm: "",
      ndvi: "",
      previous_ndvi: "",
      notes: "",
    });
  } catch (err) {
    console.error(err);
    setObservationError(
      err.response?.data?.detail || "Could not submit the observation."
    );
  } finally {
    setObservationSubmitting(false);
  }
};

const captureGPSLocation = () => {
  setGpsMessage("");

  if (!navigator.geolocation) {
    setGpsMessage("GPS location is not supported by this browser.");
    return;
  }

  setGpsLoading(true);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setNewObservation((previous)  => ({
        ...previous,
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6),
      }));

      setGpsAccuracy(Math.round(position.coords.accuracy));

      setGpsMessage("GPS location captured successfully.");
      setGpsLoading(false);
    },
    (error) => {
      setGpsMessage(
        error.code === 1
          ? "Location permission denied. Please allow location access."
          : "Unable to get your location. Please try again."
      );
      setGpsLoading(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
};

  return (
    <section className="observations-page">
      <div className="observations-heading">
        <div>
          <p className="eyebrow">FIELD MANAGEMENT / REPORT CENTRE</p>
          <h1>Field Observations</h1>
          <p className="observations-subtitle">
            Monitor, review and manage crop-health reports submitted from
            agricultural fields across Assam.
          </p>
        </div>

        <div className="observation-count">
          <span>📋</span>
          <div>
            <strong>{observations.length}</strong>
            <small>Total reports</small>
          </div>
        </div>
      </div>


      <div className="new-observation-toolbar">
        <button
          type="button"
          className="new-observation-button"
          onClick={() => {
            setShowObservationForm(!showObservationForm);
            setObservationError("");
            setObservationMessage("");
          }}
        >
          {showObservationForm ? "Close Form" : "+ New Field Report"}
        </button>
      </div>

      {observationMessage && (
        <div className="success-message">{observationMessage}</div>
      )}

      {observationError && (
        <div className="error-message">{observationError}</div>
      )}

      {showObservationForm && (
        <div className="panel new-observation-panel">
          <h2>Add New Field Observation</h2>
          <p>Enter actual field information. Leave unavailable measurements blank.</p>

          <form onSubmit={handleObservationSubmit}>
            <div className="new-observation-grid">
              <label>
                Field name *
                <input
                  required
                  maxLength="100"
                  value={newObservation.field_name}
                  onChange={(e) => setNewObservation({
                    ...newObservation, field_name: e.target.value
                  })}
                  placeholder="e.g. Field A"
                />
              </label>

              <label>
                Crop *
                <select
                  value={newObservation.crop}
                  onChange={(e) => setNewObservation({
                    ...newObservation, crop: e.target.value
                  })}
                >
                  <option value="rice">Rice</option>
                  <option value="tea">Tea</option>
                  <option value="mustard">Mustard</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label>
                Growth stage
                <select
                  value={newObservation.growth_stage}
                  onChange={(e) => setNewObservation({
                    ...newObservation, growth_stage: e.target.value
                  })}
                >
                  {["unknown", "nursery", "vegetative", "flowering", "reproductive", "maturity"].map(stage => (
                    <option key={stage} value={stage}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="gps-location-control">
  <button
    type="button"
    className="new-observation-button"
    onClick={captureGPSLocation}
    disabled={gpsLoading}
  >
    {gpsLoading ? "Getting Location..." : "📍 Use My Current Location"}
  </button>

  {gpsMessage && (
    <p className="gps-message">{gpsMessage}</p>
  )}
  {gpsAccuracy !== null && (
  <p className="gps-message">
    Estimated GPS accuracy: ±{gpsAccuracy} metres
  </p>
)}

{gpsAccuracy !== null && (
  <p
    className="gps-message"
    style={{
      color:
        gpsAccuracy < 20
          ? "#16834a"
          : gpsAccuracy <= 50
          ? "#b7791f"
          : "#dc2626",
      fontWeight: "600",
    }}
  >
    {gpsAccuracy < 20
      ? "✓ Good GPS accuracy"
      : gpsAccuracy <= 50
      ? "⚠ Moderate GPS accuracy — consider recapturing"
      : "⚠ Low GPS accuracy — recapture recommended"}
  </p>
)}
</div>

              <label>
                Latitude *
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  required
                  value={newObservation.latitude}
                  onChange={(e) => setNewObservation({
                    ...newObservation, latitude: e.target.value
                  })}
                />
              </label>

              <label>
                Longitude *
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  required
                  value={newObservation.longitude}
                  onChange={(e) => setNewObservation({
                    ...newObservation, longitude: e.target.value
                  })}
                />
              </label>

              <label>
                Temperature (°C)
                <input
                  type="number"
                  step="any"
                  value={newObservation.temperature_c}
                  onChange={(e) => setNewObservation({
                    ...newObservation, temperature_c: e.target.value
                  })}
                />
              </label>

              <label>
                Humidity (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={newObservation.humidity_pct}
                  onChange={(e) => setNewObservation({
                    ...newObservation, humidity_pct: e.target.value
                  })}
                />
              </label>

              <label>
                Rainfall — last 7 days (mm)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newObservation.rainfall_7d_mm}
                  onChange={(e) => setNewObservation({
                    ...newObservation, rainfall_7d_mm: e.target.value
                  })}
                />
              </label>

              <label>
                Current NDVI
                <input
                  type="number"
                  min="-1"
                  max="1"
                  step="any"
                  value={newObservation.ndvi}
                  onChange={(e) => setNewObservation({
                    ...newObservation, ndvi: e.target.value
                  })}
                />
              </label>

              <label>
                Previous NDVI
                <input
                  type="number"
                  min="-1"
                  max="1"
                  step="any"
                  value={newObservation.previous_ndvi}
                  onChange={(e) => setNewObservation({
                    ...newObservation, previous_ndvi: e.target.value
                  })}
                />
              </label>
            </div>

            <label className="new-observation-notes">
              Observation notes
              <textarea
                rows="4"
                value={newObservation.notes}
                onChange={(e) => setNewObservation({
                  ...newObservation, notes: e.target.value
                })}
                placeholder="Describe actual field conditions..."
              />
            </label>

            <button
              type="submit"
              className="new-observation-button"
              disabled={observationSubmitting}
            >
              {observationSubmitting ? "Submitting..." : "Submit Observation"}
            </button>
          </form>
        </div>
      )}


      <div className="observation-stats">
        <div className="observation-stat-card">
          <div className="observation-stat-icon green">🌱</div>
          <div>
            <span>Total Reports</span>
            <h2>{loading ? "..." : observations.length}</h2>
            <small>All submitted observations</small>
          </div>
        </div>

        <div className="observation-stat-card">
          <div className="observation-stat-icon orange">⏳</div>
          <div>
            <span>Pending Review</span>
            <h2>{loading ? "..." : pendingCount}</h2>
            <small>Awaiting verification</small>
          </div>
        </div>

        <div className="observation-stat-card">
          <div className="observation-stat-icon blue">✓</div>
          <div>
            <span>Confirmed</span>
            <h2>{loading ? "..." : confirmedCount}</h2>
            <small>Verified observations</small>
          </div>
        </div>

        <div className="observation-stat-card">
          <div className="observation-stat-icon purple">🌾</div>
          <div>
            <span>Crop Types</span>
            <h2>{loading ? "..." : crops.length}</h2>
            <small>Different reported crops</small>
          </div>
        </div>
      </div>
            <div className="field-map-section">
        <div className="observations-toolbar">
          <div>
            <h3>Field Locations</h3>
            <p>Geographical distribution of submitted field reports</p>
          </div>
        </div>

      <FieldMap
  observations={observations}
  onOpenDetails={openDetails}
/>
      </div>

      <div className="observations-toolbar">
        <div>
          <h3>All Field Reports</h3>
          <p>Review the latest submitted observations</p>
        </div>

        <span className="records-count">
          {filteredObservations.length} records found
        </span>
      </div>

      <div className="observation-filters">
        <div className="observation-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Search by field name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={cropFilter}
          onChange={(e) => setCropFilter(e.target.value)}
          aria-label="Filter by crop"
        >
          <option value="all">All Crops</option>
          {crops.map((crop) => (
            <option key={crop} value={crop}>
              {crop}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="not_confirmed">Not Confirmed</option>
          <option value="inconclusive">Inconclusive</option>
        </select>

        <button
          className="clear-filters"
          onClick={() => {
            setSearch("");
            setCropFilter("all");
            setStatusFilter("all");
          }}
        >
          Reset
        </button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {loading ? (
        <div className="observations-empty">
          <span>⏳</span>
          <h3>Loading field reports</h3>
          <p>Connecting to the AgriRakshak backend...</p>
        </div>
      ) : (
        <div className="observations-table panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>REPORT ID</th>
                  <th>FIELD NAME</th>
                  <th>CROP</th>
                  <th>GROWTH STAGE</th>
                  <th>LOCATION</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredObservations.length > 0 ? (
                  filteredObservations.map((item) => {
                    const status = (
                      item.verification_status || "unknown"
                    ).toLowerCase();

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong className="report-id">#{item.id}</strong>
                        </td>
                        <td>
                          <strong className="field-title">
                            {item.field_name || "Unnamed field"}
                          </strong>
                        </td>
                        <td>
                          <span className="crop-label">
                            🌾 {item.crop || "Unknown"}
                          </span>
                        </td>
                        <td>{item.growth_stage || "Unknown"}</td>
                        <td>
                          {item.latitude != null && item.longitude != null
                            ? `${item.latitude}, ${item.longitude}`
                            : "Not provided"}
                        </td>
                        <td>
                          <span className={`status ${status}`}>
                            <span className="status-dot"></span>
                            {status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <button
                            className="view-report-button"
                            onClick={() => openDetails(item)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="observations-empty">
                        <span>🔎</span>
                        <h3>No matching reports</h3>
                        <p>Try changing your search or filter settings.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="observations-table-footer">
            Showing {filteredObservations.length} of {observations.length} reports
            <span>Data retrieved from AgriRakshak backend</span>
          </div>
        </div>
      )}

      {selectedObservation && (
        <div className="report-modal-backdrop">
          <div className="report-modal">
            <div className="report-modal-header">
              <div>
                <p className="eyebrow">FIELD REPORT DETAILS</p>
                <h2>
                  Report #{selectedObservation.id}
                </h2>
              </div>

              <button
                className="report-modal-close"
                onClick={() => setSelectedObservation(null)}
                aria-label="Close report details"
              >
                ×
              </button>
            </div>

            <div className="report-modal-body">
              {detailLoading ? (
                <p>Loading report information...</p>
              ) : (
                <>
                  <h3>Observation information</h3>

                  <div className="report-detail-grid">
                    <p><strong>Field:</strong> {selectedObservation.field_name}</p>
                    <p><strong>Crop:</strong> {selectedObservation.crop}</p>
                    <p><strong>Growth stage:</strong> {selectedObservation.growth_stage}</p>
                    <p><strong>Temperature:</strong> {selectedObservation.temperature_c ?? "N/A"} °C</p>
                    <p><strong>Humidity:</strong> {selectedObservation.humidity_pct ?? "N/A"}%</p>
                    <p><strong>Rainfall (7 days):</strong> {selectedObservation.rainfall_7d_mm ?? "N/A"} mm</p>
                    <p><strong>NDVI:</strong> {selectedObservation.ndvi ?? "N/A"}</p>
                    <p><strong>Previous NDVI:</strong> {selectedObservation.previous_ndvi ?? "N/A"}</p>
                    <p><strong>Coordinates:</strong> {selectedObservation.latitude ?? "N/A"}, {selectedObservation.longitude ?? "N/A"}</p>
                    <p><strong>Notes:</strong> {selectedObservation.notes || "No notes provided"}</p>
                  </div>
                  
<div className="report-risk-panel">
  <h3>AI Disease Assessment History</h3>

  {diseaseAssessments.length === 0 ? (
    <p>No AI disease assessments recorded for this field yet.</p>
  ) : (
    diseaseAssessments.map((assessment) => (
      <div
        key={assessment.id}
        className="inspection-history-item"
      >
        <strong>{assessment.predicted_class}</strong>

        <p>
          Model confidence: {Number(assessment.confidence).toFixed(2)}%
        </p>

        <p>
          Verification:{" "}
          {(assessment.verification_status || "pending").replace("_", " ")}
        </p>

        <p>
          Image: {assessment.image_filename || "Not available"}
        </p>
           {assessment.image_filename && (
  <button
    type="button"
    disabled={imageLoading}
    onClick={() =>
      openDiseaseImage(selectedObservation.id, assessment)
    }
  >
    {imageLoading ? "Loading image..." : "View Original Image"}
  </button>
)}
        <small>
          {new Date(assessment.created_at).toLocaleString()}
        </small>
      </div>
    ))
  )}

  <small>
    AI screening is preliminary and does not replace field verification.
  </small>
</div>

                 <div className="report-risk-panel">
  <h3>Illustrative Field Risk Indicator</h3>

  {risk ? (
    <>
      <p className="risk-score">
        {risk.score}/100 — {risk.level?.toUpperCase()}
      </p>

      <div className="risk-completeness">
        <strong>Assessment Completeness</strong>

        <p>
          {risk.assessment_completeness?.evaluated_count ?? 0}/
          {risk.assessment_completeness?.total_indicators ?? 0} indicators evaluated
          ({risk.assessment_completeness?.percentage ?? 0}%)
        </p>
      </div>

      <h4>Measurements Evaluated</h4>

      {risk.evaluated_fields?.length > 0 ? (
        <ul>
          {risk.evaluated_fields.map((field, index) => (
            <li key={index}>
              {({
  humidity_pct: "Humidity (%)",
  rainfall_7d_mm: "Rainfall (last 7 days)",
  ndvi: "Current NDVI",
  previous_ndvi: "Previous NDVI"
}[field] || field.replaceAll("_", " "))}
            </li>
          ))}
        </ul>
      ) : (
        <p>No measurements evaluated.</p>
      )}

      {risk.missing_fields?.length > 0 && (
        <>
          <h4>Missing Measurements</h4>
          <ul>
            {risk.missing_fields.map((field, index) => (
              <li key={index}>
                {field.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        </>
      )}

      <h4>Risk Explanation</h4>

      <ul>
        {risk.explanation.map((reason, index) => (
          <li key={index}>{reason}</li>
        ))}
      </ul>

      <small>{risk.disclaimer}</small>
    </>
  ) : (
    <p>Risk information unavailable.</p>
  )}
</div>
                  <div className="verification-panel">
                    <h3>Verification status</h3>
                    <p>
                      Current status: <strong>{selectedObservation.verification_status}</strong>
                    </p>

                    <div className="verification-actions">
                      <button
                        disabled={actionLoading}
                        onClick={() => updateVerification("confirmed")}
                      >
                        Confirmed
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => updateVerification("not_confirmed")}
                      >
                        Not Confirmed
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => updateVerification("inconclusive")}
                      >
                        Inconclusive
                      </button>
                    </div>
                  </div>

                  <div className="inspection-panel">
                    <h3>Submit field inspection</h3>

                    <form onSubmit={submitInspection}>
                      <label>Inspector name</label>
                      <input
                        value={inspectorName}
                        onChange={(e) => setInspectorName(e.target.value)}
                        placeholder="Enter field inspector name"
                        required
                      />

                      <label>Inspection result</label>
                      <select
                        value={inspectionStatus}
                        onChange={(e) => setInspectionStatus(e.target.value)}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="not_confirmed">Not Confirmed</option>
                        <option value="inconclusive">Inconclusive</option>
                      </select>

                      <label>Inspection notes</label>
                      <textarea
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                        placeholder="Describe field observations..."
                        rows="3"
                      />

                      <button type="submit" disabled={actionLoading}>
                        {actionLoading ? "Submitting..." : "Submit Inspection"}
                      </button>
                    </form>
                  </div>

                  <div className="inspection-history">
                    <h3>Inspection history ({inspections.length})</h3>

                    {inspections.length === 0 ? (
                      <p>No field inspections recorded yet.</p>
                    ) : (
                      inspections.map((inspection) => (
                        <div className="inspection-history-item" key={inspection.id}>
                          <strong>{inspection.inspector_name}</strong>
                          <span>{inspection.status.replace("_", " ")}</span>
                          <p>{inspection.notes || "No notes"}</p>
                          <small>{inspection.created_at}</small>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {detailError && (
                <div className="error-message">{detailError}</div>
              )}

              {actionMessage && (
                <div className="success-message">{actionMessage}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedDiseaseImage && (

  <div className="report-modal-backdrop">

    <div className="report-modal">

      <div className="report-modal-header">

        <h2>Original Disease Image</h2>


        <button

          className="report-modal-close"

          onClick={() => {

            URL.revokeObjectURL(selectedDiseaseImage.url);

            setSelectedDiseaseImage(null);

          }}

        >

          ×

        </button>

      </div>


      <div className="report-modal-body">

        <p>{selectedDiseaseImage.filename}</p>


        <img

          src={selectedDiseaseImage.url}

          alt="Original uploaded rice leaf"

          style={{

            width: "100%",

            maxHeight: "500px",

            objectFit: "contain",

            borderRadius: "12px"

          }}

        />

      </div>

    </div>

  </div>

)}
    </section>
  );
}



export default FieldObservations;

