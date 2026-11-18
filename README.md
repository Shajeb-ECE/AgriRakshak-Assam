🌾 AgriRakshak Assam
AI-Assisted Rice Crop Monitoring, Disease Screening & Field Advisory Platform
An academic smart-agriculture prototype combining Machine Learning, field observations and weather intelligence to support preliminary crop-health monitoring and decision-making.





📌 1. Project Overview
AgriRakshak Assam is a smart-agriculture prototype developed to explore how machine learning, weather information and digital field observations can support rice crop monitoring.
Phase 1 Objectives

Develop an AI-based rice leaf disease screening system.
Build a digital platform for recording agricultural field observations.
Integrate weather information and short-term forecasts.
Generate preliminary weather-aware field advisories.
Support temporal monitoring, inspection and report generation.


Project Status: Phase 1 — Working Prototype


🚀 2. Key Features



Feature
Description




AI Disease Screening
Classifies uploaded rice leaf images into six health/disease categories.


Field Monitoring
Records and displays agricultural field observations.


Field Inspections
Supports field inspection records and verification.


Weather Integration
Retrieves current weather conditions and a three-day forecast using Open-Meteo.


Weather-Aware Advisories
Combines weather information with field context to generate preliminary advisories.


Temporal Monitoring
Tracks observations, vegetation indicators and risk assessments over time.


Dashboard
Provides a consolidated view of crop-monitoring information.


Reports & Analytics
Supports report viewing and CSV exports.




🖥️ 3. Application Screenshots
3.1 Dashboard

3.2 AI Disease Detection
Prediction Result

Uncertain Prediction Warning

3.3 Weather-Based Advisories

3.4 Temporal Monitoring

3.5 Field Inspections

3.6 Reports & Analytics


🧠 4. Machine Learning Model
The project uses MobileNetV3-Small, a lightweight Convolutional Neural Network (CNN), with transfer learning for rice leaf image classification.
4.1 Model Configuration



Parameter
Details




Architecture
MobileNetV3-Small


Framework
PyTorch


Input Image Size
224 × 224 pixels


Number of Classes
6


Training Environment
Google Colab


Training GPU
NVIDIA Tesla T4



4.2 Classification Categories

Healthy
Blast
Brown Spot
Leaf Smut
Rice Tungro
Sheath Blight

4.3 Dataset Information
Dataset: RiceLeafDiseaseBD — Version 3



Dataset Split
Number of Images




Original Audited Dataset
9,769


Cleaned Candidate Unique Images
9,722


Training Set
6,805


Validation Set
1,458


Testing Set
1,459



4.4 Model Performance
Baseline Experiment Test Accuracy: 71.69%
This result belongs to the baseline experiment and should not be interpreted as the performance of every subsequent model checkpoint.

🏗️ 5. System Architecture
The application connects the frontend, backend, database, machine-learning model and external weather service.
flowchart TD
    A["User"] --> B["React + Vite Frontend"]
    B --> C["FastAPI Backend"]
    C --> D["SQLite Database"]
    C --> E["MobileNetV3-Small Model"]
    C --> F["Open-Meteo Weather API"]
    C --> G["Risk Assessment & Advisory Logic"]
    D --> H["Dashboard & Reports"]
    E --> H
    F --> G
    G --> H
    H --> B


⚙️ 6. Technology Stack



Component
Technology




Frontend
React, Vite


Backend
Python, FastAPI


Database
SQLite


Machine Learning
PyTorch, Torchvision


Deep Learning Model
MobileNetV3-Small


Weather Data
Open-Meteo API


Development Tools
VS Code, Google Colab, Git




💻 7. Installation & Local Setup
7.1 Prerequisites
Make sure the following tools are installed:

Python 3.10 or later
Node.js and npm
Git

7.2 Clone the Repository
git clone https://github.com/Shajeb-ECE/AgriRakshak-Assam.git
cd AgriRakshak-Assam

7.3 Set Up the Python Environment
Windows PowerShell:
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

7.4 Start the Backend
From the project root, with the virtual environment activated:
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001

Backend API Documentation:
http://127.0.0.1:8001/docs
7.5 Start the Frontend
Open a second terminal:
cd frontend
npm install
npm run dev

Open the local URL displayed by Vite, usually:
http://localhost:5173

Important: Keep both the backend and frontend terminals running while using the application.


⚠️ 8. Limitations & Responsible Use

AI predictions are preliminary screening results, not confirmed diagnoses.
Model performance depends on dataset quality and image conditions.
Demo or synthetic records must not be treated as real farm observations.
Weather information is obtained from an external service, not directly measured by field sensors.
Risk scores and vegetation trend indicators are illustrative and are not scientifically validated outbreak predictions.
Expert agricultural verification is necessary before making crop-treatment decisions.
The system must not be used to prescribe pesticides or other chemical treatments.


🔮 9. Future Scope
Potential improvements for subsequent development phases include:

Improving model accuracy and generalisation using more diverse field images.
Collecting expert-verified local rice leaf datasets.
Exploring satellite-based crop monitoring.
Integrating field-level IoT sensors.
Developing a mobile application.
Adding multilingual support for local farmers.
Validating risk assessment and advisory logic with agricultural experts.


👨‍💻 10. Project Information



Detail
Information




Project Name
AgriRakshak Assam — Phase 1


Developer
Shajeb Ansari


Academic Programme
B.Tech ECE + MBA Dual Degree


Institution
Tezpur University, Assam


GitHub Repository
AgriRakshak Assam





AgriRakshak Assam
Exploring AI-assisted crop monitoring and smarter agricultural decision support.

