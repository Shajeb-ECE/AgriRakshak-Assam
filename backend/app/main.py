import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from uuid import uuid4
from backend.app.disease_model import rice_model
from fastapi.middleware.cors import CORSMiddleware
from backend.app.schemas import ObservationCreate
import urllib.request
import urllib.parse
import json

DB = Path(__file__).resolve().parents[2] / "agri_rakshak.db"
IMAGE_DIR = Path(__file__).resolve().parents[2] / "data" / "disease_images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

def connect():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    with connect() as con:

        # Create observations table
        con.execute("""
            CREATE TABLE IF NOT EXISTS observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                field_name TEXT,
                crop TEXT,
                growth_stage TEXT,
                latitude REAL,
                longitude REAL,
                temperature_c REAL,
                humidity_pct REAL,
                rainfall_7d_mm REAL,
                ndvi REAL,
                previous_ndvi REAL,
                notes TEXT,
                created_at TEXT,
                verification_status TEXT DEFAULT 'pending'
            )
        """)

        # Create inspections table
        con.execute("""
            CREATE TABLE IF NOT EXISTS inspections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                observation_id INTEGER NOT NULL,
                inspector_name TEXT NOT NULL,
                status TEXT NOT NULL,
                notes TEXT,
                evidence_filename TEXT,
                evidence_path TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (observation_id)
                    REFERENCES observations(id)
            )
        """)

        # Create disease assessments table
        con.execute("""
            CREATE TABLE IF NOT EXISTS disease_assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                observation_id INTEGER NOT NULL,
                predicted_class TEXT NOT NULL,
                confidence REAL NOT NULL,
                image_filename TEXT,
                image_path TEXT,
                verification_status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                FOREIGN KEY (observation_id)
                    REFERENCES observations(id)
            )
        """)
        con.commit()

app = FastAPI(title="AgriRakshak Assam API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    init_db()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/observations", status_code=201)
def add_observation(item: ObservationCreate):
    data = item.model_dump()
    cols = list(data.keys())
    now = datetime.now(timezone.utc).isoformat()
    marks = ",".join(["?"] * len(cols))
    with connect() as con:
        cur = con.execute(
            f"INSERT INTO observations ({','.join(cols)},created_at) VALUES ({marks},?)",
            [data[k] for k in cols] + [now])
        con.commit()
        return {"id": cur.lastrowid, **data, "created_at": now, "verification_status": "pending"}

@app.get("/observations")
def observations(limit: int = 100):
    limit = max(1, min(limit, 500))
    with connect() as con:
        rows = con.execute("SELECT * FROM observations ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(row) for row in rows]

@app.get("/observations/{item_id}/risk")
def risk(item_id: int):

    with connect() as con:
        row = con.execute(
            "SELECT * FROM observations WHERE id=?",
            (item_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Observation not found")

    x = dict(row)

    score = 0
    reasons = []
    evaluated_fields = []

    # Check data availability
    required_fields = [
        "humidity_pct",
        "rainfall_7d_mm",
        "ndvi",
        "previous_ndvi"
    ]

    missing_fields = [
        field for field in required_fields
        if x[field] is None
    ]

    # Humidity risk indicator
    if x["humidity_pct"] is not None:
        evaluated_fields.append("humidity_pct")

        if x["humidity_pct"] >= 85:
            score += 20
            reasons.append("High humidity input (demo threshold).")

    # Rainfall risk indicator
    if x["rainfall_7d_mm"] is not None:
        evaluated_fields.append("rainfall_7d_mm")

        if x["rainfall_7d_mm"] >= 50:
            score += 15
            reasons.append("High 7-day rainfall input (demo threshold).")

    # NDVI decline indicator
    if x["ndvi"] is not None and x["previous_ndvi"] is not None:

        evaluated_fields.append("ndvi")
        evaluated_fields.append("previous_ndvi")
        

        delta = x["ndvi"] - x["previous_ndvi"]

        if delta <= -0.10:
            score += 35
            reasons.append("NDVI decreased by at least 0.10.")

        elif delta <= -0.05:
            score += 20
            reasons.append("NDVI decreased by at least 0.05.")

    # Handle missing data
    if missing_fields:

        level = "insufficient_data"

        reasons.append(
            "Risk assessment is incomplete because some measurements are missing."
        )

        if not score:
            reasons.append(
                "No risk indicators could be evaluated from the available data."
            )

    else:

        level = (
            "elevated" if score >= 50
            else "moderate" if score >= 20
            else "low"
        )                                               

        if not reasons:
            reasons.append(
                "No configured demo risk triggers detected."
            )

    return {
        "observation_id": item_id,
        "score": min(score, 100),
        "level": level,
        "missing_fields": missing_fields,
        "evaluated_fields": evaluated_fields,

        "assessment_completeness": {
    "evaluated_count": len(evaluated_fields),
    "total_indicators": len(required_fields),
    "percentage": round(
        (len(evaluated_fields) / len(required_fields)) * 100,
        2
    ),
},
        
        "explanation": reasons,
        "disclaimer": (
            "Illustrative demo score only. "
            "Not a disease probability, diagnosis, or validated forecast. "
            "Synthetic data must not be interpreted as real field measurements."
        )
    }
@app.get("/observations/{item_id}/advisory")
def advisory(item_id: int):

    with connect() as con:
        row = con.execute(
            "SELECT * FROM observations WHERE id=?",
            (item_id,)
        ).fetchone()

        disease_row = con.execute(
            """
            SELECT
                predicted_class,
                confidence,
                verification_status,
                created_at
            FROM disease_assessments
            WHERE observation_id = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (item_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Observation not found"
        )

    x = dict(row)
    risk_data = risk(item_id)
        # Fetch location-specific weather
    weather_data = None

    if x["latitude"] is not None and x["longitude"] is not None:

        params = {
            "latitude": x["latitude"],
            "longitude": x["longitude"],
            "current": (
                "temperature_2m,"
                "relative_humidity_2m,"
                "precipitation,"
                "wind_speed_10m"
            ),
            "daily": (
                "temperature_2m_max,"
                "temperature_2m_min,"
                "precipitation_sum"
            ),
            "forecast_days": 3,
            "timezone": "Asia/Kolkata"
        }

        weather_url = (
            "https://api.open-meteo.com/v1/forecast?"
            + urllib.parse.urlencode(params)
        )

        try:
            request = urllib.request.Request(
                weather_url,
                headers={"User-Agent": "AgriRakshak-Assam/1.0"}
            )

            with urllib.request.urlopen(
                request,
                timeout=10
            ) as response:

                weather_data = json.loads(
                    response.read().decode("utf-8")
                )

        except Exception:
            weather_data = None
    disease_data = dict(disease_row) if disease_row else None

    recommendations = []
    priority = "routine"

    # Missing data
    if risk_data["level"] == "insufficient_data":

        priority = "data_collection"

        recommendations.append(
            "Collect missing environmental and vegetation measurements "
            "before making a field risk assessment."
        )

        recommendations.append(
            "Conduct a field inspection and record visible crop symptoms."
        )

    # Elevated risk
    elif risk_data["level"] == "elevated":

        priority = "high"

        recommendations.append(
            "Inspect the field promptly for visible crop stress, "
            "pest activity, or disease symptoms."
        )

        recommendations.append(
            "Capture clear photographs of affected plants "
            "for further assessment."
        )

        recommendations.append(
            "Avoid applying pesticides until the suspected problem "
            "is properly identified."
        )

    # Moderate risk
    elif risk_data["level"] == "moderate":

        priority = "medium"

        recommendations.append(
            "Monitor the field closely for changes in crop condition."
        )

        recommendations.append(
            "Inspect affected areas and record new symptoms "
            "or changes in vegetation."
        )

    # Low risk
    else:

        priority = "routine"

        recommendations.append(
            "Continue routine field monitoring."
        )

        recommendations.append(
            "Record updated crop observations periodically."
        )

    # AI disease assessment guidance
    if disease_data:

        recommendations.append(
            f"Latest AI image assessment: {disease_data['predicted_class']} "
            f"with {disease_data['confidence']:.2f}% confidence. "
            "Treat this as a preliminary result requiring field verification."
        )

        if disease_data["verification_status"] == "pending":
            recommendations.append(
                "The AI disease assessment is pending field verification."
            )

    else:

        recommendations.append(
            "No AI disease image assessment is available for this observation."
        )

    # Verification guidance
    if x["verification_status"] in ["pending", "inconclusive"]:

        recommendations.append(
            "Field verification is pending or inconclusive. "
            "An agricultural field inspection is recommended."
        )

    elif x["verification_status"] == "not_confirmed":

        recommendations.append(
            "The reported condition was not confirmed. "
            "Continue monitoring and reassess if symptoms appear."
        )

    return {
        "observation_id": item_id,
        "field_name": x["field_name"],
        "crop": x["crop"],
        "location": {
            "latitude": x["latitude"],
            "longitude": x["longitude"]
        },
        "risk_level": risk_data["level"],
        "risk_score": risk_data["score"],
        "priority": priority,
        "latest_disease_assessment": disease_data,
                "weather": {
            "current": (
                weather_data.get("current")
                if weather_data else None
            ),
            "forecast_3_days": (
                weather_data.get("daily")
                if weather_data else None
            ),
            "source": "Open-Meteo" if weather_data else None
        },
        "recommendations": recommendations,
               "disclaimer": (
            "Prototype advisory generated using illustrative rules, "
            "AI image predictions, and external weather forecast data. "
            "Weather data is model-based and may differ from actual "
            "field conditions. This is not an expert-validated "
            "agricultural prescription."
        )
    }

@app.get("/observations/{item_id}/weather")
def field_weather(item_id: int):

    # Retrieve field coordinates
    with connect() as con:
        row = con.execute(
            "SELECT latitude, longitude, field_name FROM observations WHERE id=?",
            (item_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Observation not found."
        )

    latitude = row["latitude"]
    longitude = row["longitude"]

    if latitude is None or longitude is None:
        raise HTTPException(
            status_code=400,
            detail="Field coordinates are missing."
        )

    # Open-Meteo API parameters
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "wind_speed_10m"
        ),
        "daily": (
            "temperature_2m_max,"
            "temperature_2m_min,"
            "precipitation_sum"
        ),
        "forecast_days": 3,
        "timezone": "Asia/Kolkata"
    }

    url = (
        "https://api.open-meteo.com/v1/forecast?"
        + urllib.parse.urlencode(params)
    )

    try:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "AgriRakshak-Assam/1.0"}
        )

        with urllib.request.urlopen(
            request,
            timeout=10
        ) as response:

            weather_data = json.loads(
                response.read().decode("utf-8")
            )

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Weather service unavailable: {str(e)}"
        )

    return {
        "observation_id": item_id,
        "field_name": row["field_name"],
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "current_weather": weather_data.get("current"),
        "current_weather_units": weather_data.get("current_units"),
        "forecast_3_days": weather_data.get("daily"),
        "forecast_units": weather_data.get("daily_units"),
        "source": "Open-Meteo",
        "disclaimer": (
            "Weather information is obtained from an external "
            "weather model and may differ from actual field conditions. "
            "It is not a direct measurement from the field."
        )
    }

@app.patch("/observations/{item_id}/verification")
def verify(item_id: int, status: str):

    if status not in {"pending", "confirmed", "not_confirmed", "inconclusive"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification status"
        )

    with connect() as con:

        observation = con.execute(
            "SELECT id FROM observations WHERE id=?",
            (item_id,)
        ).fetchone()

        if observation is None:
            raise HTTPException(
                status_code=404,
                detail="Observation not found"
            )

        # Update observation
        con.execute(
            "UPDATE observations SET verification_status=? WHERE id=?",
            (status, item_id)
        )

        # Synchronize linked AI disease assessments
        con.execute(
            """
            UPDATE disease_assessments
            SET verification_status=?
            WHERE observation_id=?
            """,
            (status, item_id)
        )

        con.commit()

    return {
        "id": item_id,
        "verification_status": status,
        "message": "Observation and linked disease assessments updated successfully."
    }

@app.post("/observations/{item_id}/inspections", status_code=201)
def add_inspection(
    item_id: int,
    inspector_name: str,
    status: str,
    notes: str = ""
):
    if status not in {"confirmed", "not_confirmed", "inconclusive"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid inspection status"
        )

    now = datetime.now(timezone.utc).isoformat()

    with connect() as con:
        observation = con.execute(
            "SELECT id FROM observations WHERE id = ?",
            (item_id,)
        ).fetchone()

        if observation is None:
            raise HTTPException(
                status_code=404,
                detail="Observation not found"
            )

        cur = con.execute(
            """
            INSERT INTO inspections (
                observation_id,
                inspector_name,
                status,
                notes,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (item_id, inspector_name, status, notes, now)
        )

        # Keep the observation's verification status in sync.
        con.execute(
            """
            UPDATE observations
            SET verification_status = ?
            WHERE id = ?
            """,
            (status, item_id)
        )
                # Also synchronize linked AI disease assessments.
        con.execute(
            """
            UPDATE disease_assessments
            SET verification_status = ?
            WHERE observation_id = ?
            """,
            (status, item_id)
        )
        con.commit()

        return {
            "inspection_id": cur.lastrowid,
            "observation_id": item_id,
            "inspector_name": inspector_name,
            "status": status,
            "notes": notes,
            "created_at": now
        }


@app.get("/observations/{item_id}/inspections")
def get_inspections(item_id: int):
    with connect() as con:
        observation = con.execute(
            "SELECT id FROM observations WHERE id = ?",
            (item_id,)
        ).fetchone()

        if observation is None:
            raise HTTPException(status_code=404, detail="Observation not found")

        rows = con.execute(
            """
            SELECT * FROM inspections
            WHERE observation_id = ?
            ORDER BY id DESC
            """,
            (item_id,)
        ).fetchall()

    return [dict(row) for row in rows]


@app.post("/disease/predict")
async def predict_disease(file: UploadFile = File(...)):
    # Validate uploaded file type
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image."
        )

    try:
        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty."
            )

        image = Image.open(BytesIO(image_bytes))
        result = rice_model.predict(image)

        return {
            "success": True,
            "filename": file.filename,
            **result,
            "disclaimer": (
                "AI prediction for preliminary screening only. "
                "Not a confirmed agricultural diagnosis."
            )
        }

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image."
        )
    finally:
        await file.close()


@app.post("/observations/{item_id}/disease-assessments", status_code=201)
async def save_disease_assessment(
    item_id: int,
    predicted_class: str = Form(...),
    confidence: float = Form(...),
    file: UploadFile = File(...)
):
    allowed_classes = {
        "Healthy",
        "Blast",
        "Brown Spot",
        "Leaf Smut",
        "Rice Tungro",
        "Sheath Blight"
    }

    if predicted_class not in allowed_classes:
        raise HTTPException(status_code=400, detail="Invalid disease class.")

    if not 0 <= confidence <= 100:
        raise HTTPException(status_code=400, detail="Invalid confidence value.")

    try:
        image_bytes = await file.read()

        if not image_bytes or len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Image must be non-empty and no larger than 10 MB."
            )

        image = Image.open(BytesIO(image_bytes))
        image.verify()

        format_map = {
            "JPEG": ".jpg",
            "PNG": ".png",
            "WEBP": ".webp"
        }

        extension = format_map.get(image.format)

        if extension is None:
            raise HTTPException(status_code=400, detail="Unsupported image format.")

    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file.")
    finally:
        await file.close()

    filename = f"{uuid4().hex}{extension}"
    image_path = IMAGE_DIR / filename
    now = datetime.now(timezone.utc).isoformat()

    with connect() as con:
        observation = con.execute(
            "SELECT id FROM observations WHERE id = ?",
            (item_id,)
        ).fetchone()

        if observation is None:
            raise HTTPException(status_code=404, detail="Observation not found.")

        try:
            image_path.write_bytes(image_bytes)

            cur = con.execute(
                """
                INSERT INTO disease_assessments (
                    observation_id,
                    predicted_class,
                    confidence,
                    image_filename,
                    image_path,
                    verification_status,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item_id,
                    predicted_class,
                    confidence,
                    filename,
                    str(image_path),
                    "pending",
                    now
                )
            )

            con.commit()

        except Exception:
            image_path.unlink(missing_ok=True)
            raise

    return {
        "success": True,
        "assessment_id": cur.lastrowid,
        "observation_id": item_id,
        "predicted_class": predicted_class,
        "confidence": confidence,
        "image_filename": filename,
        "verification_status": "pending",
        "created_at": now
    }


@app.get("/observations/{item_id}/disease-assessments")
def get_disease_assessments(item_id: int):

    with connect() as con:
        observation = con.execute(
            "SELECT id FROM observations WHERE id = ?",
            (item_id,)
        ).fetchone()

        if observation is None:
            raise HTTPException(
                status_code=404,
                detail="Observation not found."
            )

        rows = con.execute(
            """
            SELECT
                id,
                observation_id,
                predicted_class,
                confidence,
                image_filename,
                verification_status,
                created_at
            FROM disease_assessments
            WHERE observation_id = ?
            ORDER BY id DESC
            """,
            (item_id,)
        ).fetchall()

    return [dict(row) for row in rows]


@app.get("/observations/{item_id}/disease-assessments/{assessment_id}/image")
def get_disease_assessment_image(item_id: int, assessment_id: int):

    with connect() as con:
        row = con.execute(
            """
            SELECT image_path
            FROM disease_assessments
            WHERE id = ? AND observation_id = ?
            """,
            (assessment_id, item_id)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    if not row["image_path"]:
        raise HTTPException(status_code=404, detail="Image not available.")

    image_path = Path(row["image_path"]).resolve()

    if image_path.parent != IMAGE_DIR.resolve():
        raise HTTPException(status_code=403, detail="Invalid image path.")

    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image file not found.")

    media_types = {
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }

    media_type = media_types.get(image_path.suffix.lower())

    if not media_type:
        raise HTTPException(status_code=400, detail="Unsupported image format.")

    return FileResponse(
        image_path,
        media_type=media_type
    )
@app.get("/temporal-monitoring")
def temporal_monitoring(field_name: str, crop: str = None):

    query = """
        SELECT *
        FROM observations
        WHERE TRIM(LOWER(field_name)) = TRIM(LOWER(?))
    """

    params = [field_name]

    if crop:
        query += " AND TRIM(LOWER(crop)) = TRIM(LOWER(?))"
        params.append(crop)

    query += " ORDER BY created_at ASC"

    with connect() as con:
        rows = con.execute(query, params).fetchall()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No observations found for this field."
        )

    observations = [dict(row) for row in rows]

    # Extract available NDVI values
    ndvi_records = [
        obs for obs in observations
        if obs["ndvi"] is not None
    ]

    ndvi_trend = "insufficient_data"
    ndvi_change = None

    if len(ndvi_records) >= 2:

        first_ndvi = ndvi_records[0]["ndvi"]
        latest_ndvi = ndvi_records[-1]["ndvi"]

        ndvi_change = round(latest_ndvi - first_ndvi, 4)

        if ndvi_change >= 0.03:
            ndvi_trend = "improving"

        elif ndvi_change <= -0.03:
            ndvi_trend = "deteriorating"

        else:
            ndvi_trend = "stable"

    elif len(ndvi_records) == 1:
        ndvi_trend = "single_measurement"

    # Track illustrative risk levels over time
    risk_history = []

    for obs in observations:

        risk_data = risk(obs["id"])

        risk_history.append({
            "observation_id": obs["id"],
            "created_at": obs["created_at"],
            "risk_level": risk_data["level"],
            "risk_score": risk_data["score"]
        })

    first_risk = risk_history[0]["risk_level"]
    latest_risk = risk_history[-1]["risk_level"]

    risk_changed = first_risk != latest_risk

    latest = observations[-1]

    return {
        "field_name": field_name,
        "crop": crop or latest["crop"],
        "total_observations": len(observations),

        "first_observation": observations[0]["created_at"],
        "latest_observation": latest["created_at"],

        "ndvi": {
            "first_value": (
                ndvi_records[0]["ndvi"]
                if ndvi_records else None
            ),
            "latest_value": (
                ndvi_records[-1]["ndvi"]
                if ndvi_records else None
            ),
            "change": ndvi_change,
            "trend": ndvi_trend
        },

        "risk": {
            "history": risk_history,
            "first_level": first_risk,
            "latest_level": latest_risk,
            "changed": risk_changed
        },

        "environment": {
            "latest_temperature_c": latest["temperature_c"],
            "latest_humidity_pct": latest["humidity_pct"],
            "latest_rainfall_7d_mm": latest["rainfall_7d_mm"]
        },

        "observations": observations,

        "monitoring_recommendation": (
            "Follow-up observation recommended."
            if ndvi_trend == "deteriorating"
            else "Continue periodic monitoring."
        ),

        "disclaimer": (
            "Temporal trend is based on recorded observations. "
            "NDVI trend thresholds are illustrative and are not "
            "scientifically validated crop-health classifications."
        )
    }