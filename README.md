🌾 AgriRakshak Assam
AI-Assisted Crop Health Monitoring, Rice Disease Screening & Field Advisory Platform

  Bridging Machine Learning, Field Intelligence and Smart Agriculture


  
  
  
  


  GitHub Repository •
  Features •
  Architecture •
  Installation


1. Overview
AgriRakshak Assam is an AI-assisted agricultural monitoring prototype developed to demonstrate how machine learning, field observations, weather information and digital advisory workflows can support crop-health monitoring.
The project currently focuses on rice leaf disease screening while providing a broader platform for recording field conditions, monitoring observations, reviewing inspections and generating location-specific advisory information.
Rather than relying on a single prediction, the system brings together multiple information sources:

Deep-learning-based rice leaf image classification.
Field-level crop observations and inspection records.
Weather information and short-term forecasts.
Transparent, rule-based preliminary risk screening.
Field-specific advisory generation.
Temporal monitoring and report generation.

Project status: Phase 1 — Working prototype.
2. Project Objectives

Develop an image-based rice leaf disease screening system.
Build a digital platform for recording and monitoring agricultural field observations.
Integrate geographical field information and external weather data.
Demonstrate transparent preliminary crop-health risk indicators.
Generate field-specific recommendations using available observations and weather conditions.
Support field inspection, verification, monitoring and reporting workflows.

3. Features
AI-Based Rice Disease Detection

Upload a rice leaf image for classification.
MobileNetV3-Small model with transfer learning.
Six supported health/disease categories.
Prediction and confidence information through the FastAPI backend.

Crop and Field Monitoring

Create and manage field observations.
Record crop information and field coordinates.
View field records and associated measurements.
Track available observations over time.

Field Inspection and Verification

Submit field inspection records.
Maintain inspection history and notes.
Support observation verification and review workflows.

Weather Integration

Open-Meteo weather API integration.
Current weather information.
Three-day forecast.
Weather-aware advisory recommendations.

Preliminary Risk Assessment

Rule-based screening using available environmental and vegetation indicators.
Displays illustrative risk scores and categories.
Shows evaluated indicators and missing information.
Explains the factors contributing to each assessment.

Advisory Generation

Field-specific recommendations.
Weather-aware advisory information.
Disease assessment information where available.
Clear distinction between preliminary screening and verified field findings.

Dashboard and Reporting

Dashboard with field and observation summaries.
Field risk overview and attention alerts.
Recent field observations and quick actions.
Temporal monitoring.
Reports and CSV export functionality.

4. Application Preview
Screenshots of the application will be maintained in docs/screenshots/.



Dashboard
Field Monitoring




docs/screenshots/dashboard.png
docs/screenshots/field-monitoring.png






Disease Detection
Advisories




docs/screenshots/disease-detection.png
docs/screenshots/advisories.png






Temporal Monitoring
Reports




docs/screenshots/temporal-monitoring.png
docs/screenshots/reports.png



These image paths are placeholders until the corresponding screenshots are added to the repository.
5. Machine Learning Model and Dataset
Model Architecture
MobileNetV3-Small
The project uses a pretrained MobileNetV3-Small architecture with transfer learning for rice leaf image classification.
The model was implemented using PyTorch and Torchvision, with a modified classification head for six output classes.
Dataset
RiceLeafDiseaseBD — Version 3



Dataset information
Value




Original audited images
9,769


Cleaned candidate unique images
9,722


Image input size
224 × 224


Number of classes
6


Training environment
Google Colab


GPU used for training
NVIDIA Tesla T4



Supported Classes

Healthy
Blast
Brown Spot
Leaf Smut
Rice Tungro
Sheath Blight

Dataset Split
The cleaned candidate dataset was divided into training, validation and testing sets.



Split
Images




Training
6,805


Validation
1,458


Testing
1,459


Total
9,722



Model Training and Evaluation
The development process included dataset auditing, duplicate and conflicting-label checks, baseline training, balanced fine-tuning and evaluation.
The reported baseline experiment achieved:
71.69% test accuracy
A subsequent balanced fine-tuning experiment was also conducted, and its best checkpoint was saved as:
backend/models/mobilenetv3_small_balanced_ft_best.pt
The 71.69% figure refers specifically to the baseline experiment. It should not be interpreted as the final performance of every checkpoint.
Further evaluation using expert-labelled local field images is required before real-world deployment.
6. System Architecture
The application follows a frontend–backend architecture. The React interface communicates with the FastAPI backend, which manages data, model inference, weather retrieval and advisory generation.
flowchart TD
    A[User / Field Operator] --> B[React + Vite Frontend]

    B -->|Axios API Requests| C[FastAPI Backend]

    C --> D[(SQLite Database)]
    C --> E[MobileNetV3-Small Model]
    C --> F[Open-Meteo Weather API]

    D --> G[Field Observations & Inspections]
    E --> H[AI Disease Assessment]
    F --> I[Current Weather & Forecast]

    G --> J[Risk Screening & Advisory Engine]
    H --> J
    I --> J

    J --> K[Dashboard, Monitoring & Reports]
    K --> B

Main Components



Component
Responsibility




React + Vite
User interface and application pages


Axios
Frontend-to-backend communication


FastAPI
API endpoints and application logic


SQLite
Local application data storage


PyTorch
Model inference


MobileNetV3-Small
Rice leaf image classification


Open-Meteo
External weather information


Leaflet / React-Leaflet
Field map functionality


Recharts
Data visualization



7. Development Stages
The project was developed incrementally, moving from dataset preparation to a working integrated prototype.
Stage 1 — Dataset Preparation

Audited the RiceLeafDiseaseBD v3 dataset.
Examined class distribution and image dimensions.
Checked missing images, duplicates and conflicting labels.
Prepared the cleaned candidate dataset and data splits.

Stage 2 — Model Development

Implemented MobileNetV3-Small transfer learning.
Conducted baseline training and balanced fine-tuning experiments.
Evaluated classification performance and inspected misclassifications.
Saved the trained model checkpoint.

Stage 3 — Backend Development

Implemented the FastAPI backend.
Integrated SQLite for application records.
Added observation, inspection, disease assessment and risk-related APIs.
Exposed interactive API documentation through Swagger UI.

Stage 4 — Frontend Development

Developed the React and Vite application.
Implemented dashboard, crop monitoring and disease detection pages.
Added field observation and inspection workflows.
Implemented advisories, temporal monitoring and reporting pages.

Stage 5 — Weather and Advisory Integration

Integrated Open-Meteo weather information.
Added current conditions and a three-day forecast.
Connected weather information to advisory generation.
Added transparent preliminary risk screening.

Stage 6 — Integration and Testing

Connected the frontend to the backend.
Tested API responses and application workflows.
Verified observation, advisory and weather integration.
Tested refresh, filtering and report functionality.

8. Technology Stack



Area
Technologies




Frontend
React 19, Vite, JavaScript, CSS


API Communication
Axios


Backend
Python, FastAPI


Database
SQLite


Machine Learning
PyTorch, Torchvision


Model
MobileNetV3-Small


Weather
Open-Meteo


Maps
Leaflet, React-Leaflet


Charts
Recharts


Development
VS Code, Git, GitHub


Model Training
Google Colab, NVIDIA Tesla T4



9. Project Structure
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

10. Installation and Setup
Prerequisites

Python 3.10 or later
Node.js 18 or later
npm
Git

Step 1 — Clone the Repository
git clone https://github.com/Shajeb-ECE/AgriRakshak-Assam.git

cd AgriRakshak-Assam

Step 2 — Set Up the Backend
Create a virtual environment:
py -m venv .venv

.\.venv\Scripts\Activate.ps1

Install dependencies:
pip install -r requirements.txt

Start the backend:
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001

Backend API:
http://127.0.0.1:8001
Interactive API documentation:
http://127.0.0.1:8001/docs
Step 3 — Set Up the Frontend
Open a second terminal:
cd frontend

npm install

npm run dev

Open the local URL shown by Vite, usually:
http://localhost:5173
The frontend API configuration is located at:
frontend/src/api.js
Important: Keep the backend terminal running while using the frontend. The frontend depends on the FastAPI service for live application data.
11. Responsible Use and Limitations
AgriRakshak Assam is a Phase 1 prototype and is not a certified agricultural diagnostic or forecasting system.

Some sample observation records are synthetic demonstration data, not real farm measurements.
Risk scores use transparent illustrative prototype rules; they are not scientifically validated disease probabilities or outbreak forecasts.
Vegetation indicators can show changes in vegetation conditions but cannot independently identify a specific disease.
Weather information comes from an external service and is not equivalent to on-site sensor measurements.
AI predictions require validation using expert-labelled local field images.
Recommendations should be reviewed by qualified agricultural experts before real farming decisions are made.
The prototype should not be used to prescribe pesticides or treatments without expert validation.

12. Future Scope

Validate the disease model using expert-labelled rice leaf images collected in Assam.
Improve model generalization and per-class performance.
Integrate satellite-based vegetation monitoring.
Develop more reliable location-specific crop advisories.
Expand validated disease detection to additional crops.
Improve mobile application functionality.
Conduct field trials with farmers, agricultural experts and local institutions.
Evaluate the risk and advisory logic using real field data.

13. Project Information



Detail
Information




Project
AgriRakshak Assam


Phase
Phase 1 Prototype


Domain
Artificial Intelligence, Machine Learning, Smart Agriculture


Developer
Shajeb Ansari


Institution
Tezpur University


Repository
GitHub — AgriRakshak Assam





  AgriRakshak Assam
  Using AI and digital technology to support smarter agricultural monitoring.

