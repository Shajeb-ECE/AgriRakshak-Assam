
import { useState } from "react";
import API from "./api";
import "./DiseaseDetection.css";

function DiseaseDetection() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [savingObservation, setSavingObservation] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [fieldDetails, setFieldDetails] = useState({
  field_name: "",
  latitude: "",
  longitude: "",
  notes: "",
});

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);

    setSelectedImage(null);
    setPreview("");
    setResult(null);
    setError("");
  };
    const handleSaveObservation = async (event) => {
  event.preventDefault();

  if (!result || !fieldDetails.field_name.trim()) {
    setError("Please enter a field name.");
    return;
  }

  if (
    fieldDetails.latitude === "" ||
    fieldDetails.longitude === ""
  ) {
    setError("Actual field latitude and longitude are required.");
    return;
  }

  setSavingObservation(true);
  setError("");
  setSaveMessage("");

  const notes =
    `AI screening result: ${result.predicted_class}. ` +
    `Model confidence: ${result.confidence}%. ` +
    `Field verification is pending. ` +
    `${fieldDetails.notes}`.trim();


try {
  // First: create the field observation
  const observationResponse = await API.post("/observations", {
    field_name: fieldDetails.field_name.trim(),
    crop: "rice",
    growth_stage: "unknown",
    latitude: Number(fieldDetails.latitude),
    longitude: Number(fieldDetails.longitude),
    notes,
  });

  const observationId = observationResponse.data.id;

  // Second: save the original image and AI assessment
  const assessmentData = new FormData();

  assessmentData.append("file", selectedImage);
  assessmentData.append("predicted_class", result.predicted_class);
  assessmentData.append("confidence", String(result.confidence));

  await API.post(
    `/observations/${observationId}/disease-assessments`,
    assessmentData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  setSaveMessage(
    "Field observation, AI prediction and original image saved successfully."
  );

  setShowSaveForm(false);

  setFieldDetails({
    field_name: "",
    latitude: "",
    longitude: "",
    notes: "",
  });

} catch (err) {
  setError(
    err.response?.data?.detail ||
    "Unable to save the observation and disease assessment."
  );

} finally {
  setSavingObservation(false);
}

};
  const handlePrediction = async () => {
    if (!selectedImage) {
      setError("Please select a rice leaf image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const response = await API.post(
        "/disease/predict",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data.success) {
        throw new Error("Prediction could not be completed.");
      }

      setResult(response.data);
    } catch (err) {
      console.error("Disease prediction error:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to analyse image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const diseaseClasses = [
    "Healthy",
    "Blast",
    "Brown Spot",
    "Leaf Smut",
    "Rice Tungro",
    "Sheath Blight",
  ];

  return (
    <section className="content disease-page">
      <div className="welcome">
        <div>
          <p className="eyebrow">
            AGRIRAKSHAK / AI-POWERED CROP HEALTH
          </p>

          <h1>Disease Detection</h1>

          <p className="subtitle">
            Upload a rice leaf image for AI-assisted disease
            classification using the AgriRakshak model.
          </p>
        </div>
      </div>

      <div className="disease-info-grid">
        <div className="disease-info-card">
          <span>AI</span>
          <div>
            <h3>MobileNetV3-Small</h3>
            <p>Classification model</p>
          </div>
        </div>

        <div className="disease-info-card">
          <span>🌾</span>
          <div>
            <h3>6 Disease Classes</h3>
            <p>Rice leaf classification</p>
          </div>
        </div>

        <div className="disease-info-card">
          <span>📷</span>
          <div>
            <h3>Image Analysis</h3>
            <p>AI-powered prediction</p>
          </div>
        </div>
      </div>

      <div className="panel disease-upload-panel">
        <div className="disease-section-heading">
          <h2>Upload Rice Leaf Image</h2>
          <p>
            Select a clear photograph of a rice leaf for analysis.
          </p>
        </div>

        {!preview ? (
          <label className="disease-upload-area">
            <span className="upload-icon">📤</span>
            <h3>Choose a rice leaf image</h3>
            <p>Click here to browse images from your device</p>

            <span className="upload-format">
              Supported formats: JPG, JPEG, PNG, WEBP
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              hidden
            />
          </label>
        ) : (
          <div className="disease-preview">
            <img src={preview} alt="Selected rice leaf" />

            <div className="disease-preview-details">
              <h3>Image selected successfully</h3>
              <p>{selectedImage?.name}</p>

              <p>
                {(selectedImage.size / 1024).toFixed(1)} KB
              </p>

              <button
                type="button"
                className="remove-image-button"
                onClick={removeImage}
                disabled={loading}
              >
                Remove Image
              </button>
            </div>
          </div>
        )}

        {selectedImage && (
          <button
            type="button"
            className="analyze-image-button"
            onClick={handlePrediction}
            disabled={loading}
          >
            {loading ? "Analysing Image..." : "Analyse Image"}
          </button>
        )}

        {loading && (
          <p className="prediction-loading">
            Please wait. The AI model is processing your image.
          </p>
        )}

        {error && (
          <div className="prediction-error" role="alert">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="panel disease-result-panel">
          <h2>AI Prediction Result</h2>

          <div className="prediction-main-result">
            <p>Predicted Classification</p>

            <h3>{result.predicted_class}</h3>

            <p>
              Confidence: <strong>{result.confidence}%</strong>
            </p>
          </div>

          <h3>Class Probability Distribution</h3>

          <div className="probability-list">
            {diseaseClasses.map((name) => {
              const probability =
                result.class_probabilities?.[name] ?? 0;

              return (
                <div className="probability-item" key={name}>
                  <div className="probability-label">
                    <span>{name}</span>
                    <strong>{probability}%</strong>
                  </div>

                  <div className="probability-track">
                    <div
                      className="probability-fill"
                      style={{ width: `${probability}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {(() => {
  const probabilities = Object.entries(
    result.class_probabilities || {}
  ).sort((a, b) => b[1] - a[1]);

  const topScore = probabilities[0]?.[1] ?? 0;
  const secondScore = probabilities[1]?.[1] ?? 0;
  const gap = topScore - secondScore;

  const uncertain = topScore < 60 || gap < 10;

  return (
    <div className={`prediction-interpretation ${
      uncertain ? "interpretation-warning" : "interpretation-normal"
    }`}>
      <h3>
        {uncertain
          ? "⚠ Uncertain Prediction"
          : "✓ Prediction Interpretation"}
      </h3>

      <p>
        {uncertain
          ? `The model's top prediction is ${result.predicted_class}, but the result has limited confidence.`
          : `The model's top prediction is ${result.predicted_class}.`}
      </p>

      {uncertain && (
        <p>
          Please capture another clear image and seek field verification
          before taking disease-specific action.
        </p>
      )}

      <small>
        This interpretation is based on model scores and is not a
        confirmed agricultural diagnosis.
      </small>
    </div>
  );
})()}

          <div className="disease-disclaimer">
            <strong>Important:</strong>{" "}
            {result.disclaimer}
          </div>
          <div className="save-observation-section">
  <button
    type="button"
    className="analyze-image-button"
    onClick={() => {
      setShowSaveForm(!showSaveForm);
      setError("");
      setSaveMessage("");
    }}
  >
    {showSaveForm ? "Cancel" : "Save as Field Observation"}
  </button>

  {saveMessage && (
    <p className="save-success-message">{saveMessage}</p>
  )}

  {showSaveForm && (
    <form onSubmit={handleSaveObservation} className="save-observation-form">
      <h3>Record Field Details</h3>

      <label>
        Field Name *
        <input
          required
          value={fieldDetails.field_name}
          onChange={(e) =>
            setFieldDetails({
              ...fieldDetails,
              field_name: e.target.value,
            })
          }
          placeholder="Enter actual field name"
        />
      </label>

      <label>
        Latitude *
        <input
          type="number"
          step="any"
          min="-90"
          max="90"
          required
          value={fieldDetails.latitude}
          onChange={(e) =>
            setFieldDetails({
              ...fieldDetails,
              latitude: e.target.value,
            })
          }
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
          value={fieldDetails.longitude}
          onChange={(e) =>
            setFieldDetails({
              ...fieldDetails,
              longitude: e.target.value,
            })
          }
        />
      </label>

      <label>
        Additional Field Notes
        <textarea
          rows="3"
          value={fieldDetails.notes}
          onChange={(e) =>
            setFieldDetails({
              ...fieldDetails,
              notes: e.target.value,
            })
          }
          placeholder="Optional field observations..."
        />
      </label>

      <button
        type="submit"
        className="analyze-image-button"
        disabled={savingObservation}
      >
        {savingObservation ? "Saving..." : "Submit Field Observation"}
      </button>
    </form>
  )}
</div>
        </div>
      )}

      <div className="panel disease-classes-panel">
        <h2>Supported Rice Disease Classes</h2>

        <p>
          The current classification model is configured for these
          six categories.
        </p>

        <div className="model-scope-notice">
  <strong>Current AI model coverage</strong>

  <p>
    The active disease classification model is trained for rice
    leaf images and supports the six categories listed below.
  </p>

  <p>
    Tea, mustard and other crops are part of the broader
    AgriRakshak monitoring platform. Their AI disease detection
    modules require crop-specific datasets, training and validation.
  </p>

  <span>Model status: Rice prototype implemented</span>
</div>

        <div className="disease-class-grid">
          {diseaseClasses.map((name) => (
            <div className="disease-class-item" key={name}>
              <span>🌿</span>
              <strong>{name}</strong>
            </div>
          ))}
        </div>
      </div>

      {!result && (
        <div className="disease-disclaimer">
          <strong>Prototype notice:</strong>{" "}
          AI predictions are intended for preliminary screening
          and are not confirmed agricultural diagnoses.
        </div>
      )}
    </section>
  );
}

export default DiseaseDetection;
