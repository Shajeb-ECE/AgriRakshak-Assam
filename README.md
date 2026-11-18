AgriRakshak Assam 🌾
AI-Powered Crop Health Monitoring, Disease Detection & Advisory Platform
AgriRakshak Assam is an AI-assisted crop health monitoring prototype designed to support agricultural observation, rice leaf disease screening, field monitoring, weather integration, and location-specific advisory generation.
The project combines machine learning, geospatial field records, weather information, and a web-based dashboard to demonstrate how digital tools can support agricultural decision-making.

Project status: Phase 1 prototype


1. Project Objectives

Detect selected rice leaf diseases using deep learning.
Record and monitor agricultural field observations.
Assess illustrative crop-health risk indicators.
Integrate weather conditions and short-term forecasts.
Generate field-specific recommendations.
Support field inspections, temporal monitoring, and reporting.

2. Key Features
AI-Based Rice Disease Detection

Image-based rice leaf disease classification.
MobileNetV3-Small architecture with transfer learning.
Six supported disease/health categories.
Model inference through the FastAPI backend.

Crop and Field Monitoring

Create and manage field observations.
Store crop information and field coordinates.
Monitor field conditions and inspection records.
View temporal changes in available observations.

Risk Assessment

Rule-based screening using available environmental and vegetation indicators.
Displays risk score, risk category, evaluated indicators, and missing information.
Explains the factors contributing to the illustrative assessment.

Weather Integration

Open-Meteo weather data integration.
Current weather information.
Three-day weather forecast.
Weather-aware advisory recommendations.

Advisory and Reporting

Field-specific advisory generation.
Disease assessment information.
Field inspection and verification workflow.
Reports and CSV export functionality.

3. Technology Stack



Component
Technology




Frontend
React 19, Vite


Styling
CSS


Backend
Python, FastAPI


Database
SQLite


Machine Learning
PyTorch, Torchvision


AI Architecture
MobileNetV3-Small


API Communication
Axios


Weather Data
Open-Meteo


Mapping
Leaflet, React-Leaflet


Charts
Recharts



4. AI Model and Dataset
Model: MobileNetV3-Small
The project uses a pretrained MobileNetV3-Small model with transfer learning for six-class rice leaf image classification.
Supported classes:

Healthy
Blast
Brown Spot
Leaf Smut
Rice Tungro
Sheath Blight

Dataset: RiceLeafDiseaseBD — Version 3

Original audited dataset: 9,769 images.
Cleaned candidate dataset: 9,722 unique images.
Image input size: 224 × 224 pixels.
Training environment: Google Colab with NVIDIA Tesla T4 GPU.

The baseline experiment achieved 71.69% test accuracy. A subsequent balanced fine-tuning experiment was also conducted. The baseline result should not be interpreted as the final performance of every model checkpoint.
5. System Architecture
The application follows a frontend–backend architecture.
                 USER
                   |
                   v
          React + Vite Frontend
                   |
                Axios API
                   |
                   v
             FastAPI Backend
                   |
        +----------+----------+
        |          |          |
        v          v          v
      SQLite   MobileNetV3   Open-Meteo
     Database    Model       Weather API
        |          |          |
        +----------+----------+
                   |
                   v
        Risk Assessment & Advisory
                   |
                   v
             Frontend Display

6. Project Structure
AgriRakshak_Assam_Phase1/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── schemas.py
│   │   └── disease_model.py
│   ├── models/
│   │   └── mobilenetv3_small_balanced_ft_best.pt
│   ├── diagnostic_images/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── Advisories.jsx
│   │   ├── CropMonitoring.jsx
│   │   ├── DiseaseDetection.jsx
│   │   ├── FieldInspections.jsx
│   │   ├── FieldObservations.jsx
│   │   ├── Reports.jsx
│   │   ├── TemporalMonitoring.jsx
│   │   └── api.js
│   ├── package.json
│   └── vite.config.js
│
├── dashboard/
├── docs/
├── mobile/
├── scripts/
├── uploads/
├── requirements.txt
├── package.json
├── README.md
└── .gitignore

7. Installation and Setup
Prerequisites

Python 3.10 or later
Node.js 18 or later
npm
Git

Step 1: Clone the Repository
git clone https://github.com/Shajeb-ECE/AgriRakshak-Assam.git
cd AgriRakshak-Assam

Step 2: Set Up the Backend
Create and activate a virtual environment:
Windows PowerShell:
py -m venv .venv
.\.venv\Scripts\Activate.ps1

Install backend dependencies:
pip install -r requirements.txt

If running from a clean environment, install any additional backend dependencies listed in backend/requirements.txt as required by the application.
Start the FastAPI server:
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001

API documentation:
http://127.0.0.1:8001/docs
Step 3: Set Up the Frontend
Open another terminal:
cd frontend
npm install
npm run dev

Open the local Vite URL displayed in the terminal, usually:
http://localhost:5173
The frontend API configuration is located in:
frontend/src/api.js
The local backend address is configured as:
http://127.0.0.1:8001
8. API Documentation
The backend provides API functionality for:

Field observations
Field inspections
Disease image assessments
Risk assessments
Weather information
Advisory generation
Temporal monitoring

Interactive endpoint documentation is available through FastAPI Swagger UI:
http://127.0.0.1:8001/docs
9. Limitations and Responsible Use
AgriRakshak Assam is currently a prototype and requires further field validation.

Demo observation records may be synthetic and must not be treated as actual farm measurements.
Risk scores are based on illustrative prototype rules, not scientifically validated disease probabilities.
Satellite vegetation indicators can show vegetation changes but cannot independently establish a specific disease.
AI disease classifications require validation using expert-labelled local field images.
Weather information is obtained from an external weather service and is not equivalent to on-site sensor measurements.
Recommendations should be reviewed by qualified agricultural experts before being used for actual farming decisions.
The model should not be used to prescribe pesticides or other treatments without expert validation.

10. Future Scope

Validate disease detection using expert-labelled Assam field images.
Improve model accuracy and generalisation.
Integrate satellite-based vegetation monitoring.
Develop more reliable location-specific crop advisories.
Expand disease detection to additional crops.
Improve mobile application functionality.
Conduct field trials with farmers and agricultural experts.

11. Project Information
Project: AgriRakshak Assam
Phase: Phase 1
Domain: Artificial Intelligence, Machine Learning and Smart Agriculture
Developer: Shajeb Ansari
GitHub: https://github.com/Shajeb-ECE/AgriRakshak-Assam

AgriRakshak Assam — Using AI and digital technology to support smarter agricultural monitoring.
