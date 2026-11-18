🌾 AgriRakshak Assam
AI-Assisted Rice Crop Monitoring, Disease Screening & Field Advisory Platform
An intelligent academic smart-agriculture prototype combining Machine Learning, digital field observations and weather intelligence to support preliminary rice crop-health monitoring and decision-making.

  
  
  


  
  
  
  


📌 Project Overview
AgriRakshak Assam is an AI-assisted agricultural monitoring platform developed to explore how machine learning, weather information and digital field observations can support rice crop monitoring.
The project brings together multiple capabilities in a unified web application rather than relying on a single disease prediction.
Project Objectives

Develop an AI-based rice leaf disease screening system.
Build a digital platform for recording and monitoring agricultural field observations.
Integrate weather information and short-term forecasts.
Generate preliminary weather-aware field advisories.
Support field inspections, verification and temporal monitoring.
Provide consolidated reports and monitoring information.


Project Status: Phase 1 — Working Prototype


🚀 Key Features
1. AI-Based Rice Disease Detection

Upload rice leaf images for classification.
Uses a MobileNetV3-Small deep-learning model.
Supports six health and disease categories.
Displays prediction confidence information.
Provides warnings when predictions are uncertain.

2. Crop & Field Monitoring

Create and manage field observations.
Record crop information and field coordinates.
View field records and associated measurements.
Track observations over time.

3. Field Inspection & Verification

Maintain field inspection records.
Support verification of recorded field information.
Organise inspection-related monitoring activities.

4. Weather Integration

Retrieves current weather conditions.
Provides a three-day weather forecast.
Uses the Open-Meteo API for weather information.

5. Weather-Aware Field Advisories

Combines weather information with field context.
Generates preliminary field-specific advisories.
Helps review potential crop-monitoring concerns.

6. Temporal Monitoring

Tracks changes in field observations.
Displays vegetation-related indicators.
Supports monitoring of risk assessments over time.

7. Dashboard & Reports

Provides a consolidated monitoring dashboard.
Displays important field and crop information.
Supports report viewing and CSV exports.


🖥️ Application Screenshots
The following screenshots show the main modules of the AgriRakshak Assam application.
Dashboard

AI Disease Detection
Prediction Result

Uncertain Prediction Warning

Weather-Based Advisories

Temporal Monitoring

Field Inspections

Reports & Analytics


🧠 Machine Learning Model
The project uses MobileNetV3-Small, a lightweight Convolutional Neural Network (CNN), with transfer learning for rice leaf image classification.
Model Architecture



Parameter
Details




Model Architecture
MobileNetV3-Small


Deep Learning Framework
PyTorch


Image Input Size
224 × 224 pixels


Number of Classes
6


Training Environment
Google Colab


Training Hardware
NVIDIA Tesla T4 GPU


Learning Approach
Transfer Learning



Supported Classification Categories



Class ID
Category




0
Healthy


1
Blast


2
Brown Spot


3
Leaf Smut


4
Rice Tungro


5
Sheath Blight



Dataset Information
Dataset: RiceLeafDiseaseBD — Version 3



Dataset Information
Image Count




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


Total Cleaned Images
9,722



Baseline Model Performance

Baseline Experiment Results



Metric
Result




Test Accuracy
71.69%



The reported 71.69% accuracy belongs to the baseline experiment. It should not be interpreted as the performance of every subsequent model checkpoint.


🏗️ System Architecture
The platform integrates the frontend, backend, database, machine-learning model and external weather service.
Architecture Workflow
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

Main Components

Frontend: Provides the web interface and user interaction.
Backend: Handles API requests and application logic.
Database: Stores application records using SQLite.
ML Model: Performs rice leaf image classification.
Weather Service: Supplies current weather and forecast information.
Advisory Logic: Combines available weather and field information to produce preliminary advisories.


⚙️ Technology Stack
Frontend Technologies



Technology
Purpose




React
User interface development


Vite
Frontend development and build tool



Backend Technologies



Technology
Purpose




Python
Backend programming


FastAPI
REST API development


SQLite
Database management



Machine Learning Technologies



Technology
Purpose




PyTorch
Deep learning framework


Torchvision
Model architecture and image processing


MobileNetV3-Small
Rice leaf image classification



External Services & Development Tools



Technology
Purpose




Open-Meteo API
Weather information


Google Colab
Model training environment


VS Code
Development environment


Git & GitHub
Version control and project hosting




📂 Project Structure
The main project directory is organised as follows:
AgriRakshak-Assam/
│
├── backend/
│   ├── app/
│   └── models/
│
├── dashboard/
│
├── docs/
│   └── screenshots/
│       ├── dashboard.png
│       ├── disease-detection-result.png
│       ├── disease-detection-warning.png
│       ├── advisories-weather.png
│       ├── temporal-monitoring.png
│       ├── field-inspections.png
│       └── reports-analytics.png
│
├── frontend/
│   ├── public/
│   └── src/
│
├── mobile/
├── scripts/
│
├── .gitignore
├── package.json
├── package-lock.json
├── requirements.txt
└── README.md


💻 Installation & Local Setup
Follow these instructions to run AgriRakshak Assam on your local machine.
Prerequisites
Make sure the following software is installed:

Python 3.10 or later
Node.js and npm
Git

Step 1: Clone the Repository
Open a terminal and execute:
git clone https://github.com/Shajeb-ECE/AgriRakshak-Assam.git

cd AgriRakshak-Assam

Step 2: Create a Python Virtual Environment
Windows PowerShell:
py -3.11 -m venv .venv

.\.venv\Scripts\Activate.ps1

Upgrade pip and install the project dependencies:
python -m pip install --upgrade pip

pip install -r requirements.txt

Step 3: Start the Backend Server
From the project root directory, execute:
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001

The backend API will be available at:
http://127.0.0.1:8001
API Documentation:
http://127.0.0.1:8001/docs
Step 4: Start the Frontend
Open a second terminal and navigate to the frontend directory:
cd frontend

Install frontend dependencies:
npm install

Start the development server:
npm run dev

Open the local URL displayed by Vite, usually:
http://localhost:5173

Important: Keep both the backend and frontend terminals running while using the application.


⚠️ Limitations & Responsible Use
AgriRakshak Assam is an academic prototype and should be used with an understanding of its current limitations.

Preliminary Predictions: AI outputs are screening results, not confirmed agricultural diagnoses.
Dataset Dependency: Model performance depends on image quality and dataset diversity.
Demo Records: Synthetic or demonstration records must not be interpreted as actual farm observations.
Weather Data: Weather information comes from an external service and is not directly measured by field sensors.
Illustrative Risk Assessment: Risk scores and vegetation trend indicators are illustrative and are not scientifically validated outbreak predictions.
Expert Verification: Agricultural experts should verify findings before crop-treatment decisions.
Treatment Decisions: The application should not be used to prescribe pesticides or other chemical treatments.


🔮 Future Scope
The following improvements can be explored in subsequent development phases:
Machine Learning Improvements

Improve model accuracy and generalisation.
Collect more diverse, expert-verified local rice leaf images.
Evaluate model performance on real-world field images.

Smart Agriculture Integration

Explore satellite-based crop monitoring.
Integrate field-level IoT sensors.
Develop a mobile application for field use.

Platform Improvements

Add multilingual support for local farmers.
Improve monitoring and reporting capabilities.
Validate risk assessment and advisory logic with agricultural experts.


👨‍💻 Project Information



Project Detail
Information




Project Name
AgriRakshak Assam — Phase 1


Developer
Shajeb Ansari


Academic Programme
B.Tech ECE + MBA Dual Degree


Institution
Tezpur University, Assam


Project Domain
Machine Learning & Smart Agriculture


GitHub Repository
AgriRakshak-Assam





🌾 AgriRakshak Assam
Bridging Machine Learning, Field Intelligence and Smart Agriculture.
Developed as an academic prototype exploring AI-assisted crop monitoring and agricultural decision support.

