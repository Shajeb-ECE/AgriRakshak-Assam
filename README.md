🌾 AgriRakshak Assam — Phase 1
An AI-assisted rice crop monitoring and disease screening platform for smarter agricultural decision-making.

  


  React · FastAPI · SQLite · PyTorch · MobileNetV3-Small


1. Overview
AgriRakshak Assam is a smart agriculture prototype developed to explore how machine learning, weather information and field observations can support rice crop monitoring.
Phase 1 focuses on rice leaf disease screening, field-level observations, weather-aware advisories and temporal monitoring through a web dashboard.
The platform is a prototype for research and demonstration. It is not a replacement for agricultural experts or laboratory diagnosis.
2. Key Features

AI Disease Screening: Classifies uploaded rice leaf images into six disease/health categories.
Field Monitoring: Records and displays field observations.
Field Inspections: Supports field inspection records and verification.
Weather Integration: Retrieves current weather conditions and a three-day forecast using Open-Meteo.
Weather-Aware Advisories: Combines weather information with field context to display preliminary advisories.
Temporal Monitoring: Tracks changes in observations, vegetation indicators and risk assessments over time.
Dashboard: Provides a consolidated view of crop monitoring information.
Reports: Supports report viewing and CSV exports.

3. Application Screenshots
Dashboard

  

AI Disease Detection

  


  

Weather-Based Advisories

  

Temporal Monitoring

  

Field Inspections

  

Reports and Analytics

  

4. Machine Learning Model
The project uses MobileNetV3-Small, a lightweight convolutional neural network, with transfer learning for rice leaf image classification.



Parameter
Details




Architecture
MobileNetV3-Small


Framework
PyTorch


Input size
224 × 224 pixels


Number of classes
6


Training environment
Google Colab


Training GPU
NVIDIA Tesla T4



Classification Categories

Healthy
Blast
Brown Spot
Leaf Smut
Rice Tungro
Sheath Blight

Dataset
Dataset: RiceLeafDiseaseBD — Version 3

Original audited images: 9,769
Cleaned candidate unique images: 9,722
Training images: 6,805
Validation images: 1,458
Testing images: 1,459

Baseline experiment test accuracy: 71.69%.
This accuracy belongs to the baseline experiment and should not be interpreted as the performance of every subsequent model checkpoint.
5. System Architecture
flowchart TD
    A["User"] --> B["React + Vite Frontend"]
    B --> C["FastAPI Backend"]
    C --> D["SQLite Database"]
    C --> E["MobileNetV3-Small Model"]
    C --> F["Open-Meteo Weather API"]
    C --> G["Risk Assessment and Advisory Logic"]
    D --> H["Dashboard and Reports"]
    E --> H
    F --> G
    G --> H
    H --> B

6. Technology Stack



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


Model
MobileNetV3-Small


Weather Data
Open-Meteo API


Development
VS Code, Google Colab, Git



7. Run Locally
Prerequisites

Python 3.10 or later
Node.js and npm
Git

Step 1: Clone the repository
git clone https://github.com/Shajeb-ECE/AgriRakshak-Assam.git
cd AgriRakshak-Assam

Step 2: Set up the Python environment
Windows PowerShell:
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

Step 3: Start the backend
Open the first terminal in the project root:
.\.venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001

Backend API documentation:
http://127.0.0.1:8001/docs
Step 4: Start the frontend
Open a second terminal:
cd frontend
npm install
npm run dev

Open the local frontend URL displayed by Vite, usually:
http://localhost:5173
Keep both terminals running while using the application.
8. Project Limitations and Responsible Use

AI predictions are preliminary screening results, not confirmed diagnoses.
Model performance depends on dataset quality and image conditions.
Demo or synthetic records must not be treated as real farm observations.
Weather information is obtained from an external weather service, not directly measured by field sensors.
Risk scores and vegetation trend indicators are illustrative and are not scientifically validated outbreak predictions.
Expert agricultural verification is necessary before making crop treatment decisions.
The system must not be used to prescribe pesticides or other chemical treatments.

9. Future Scope

Improve model accuracy and generalisation using more diverse field images.
Collect expert-verified local rice leaf datasets.
Explore satellite-based crop monitoring.
Integrate field-level IoT sensors.
Develop a mobile application.
Improve multilingual support for local farmers.
Validate risk assessment and advisory logic with agricultural experts.

10. Project Information
Project: AgriRakshak Assam — Phase 1
Developer: Shajeb Ansari
Academic Programme: B.Tech ECE + MBA Dual Degree
Institution: Tezpur University, Assam
GitHub Repository: https://github.com/Shajeb-ECE/AgriRakshak-Assam

Developed as an academic smart agriculture prototype exploring AI-assisted crop monitoring and decision support.
