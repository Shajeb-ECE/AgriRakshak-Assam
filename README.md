# AgriRakshak Assam — Phase 1
Starter code: FastAPI + SQLite backend, Streamlit web dashboard, Expo mobile starter.

## Python setup (Python 3.10+)
Windows PowerShell:
```powershell
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```
macOS/Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Run backend (Terminal 1)
```bash
python scripts/seed_demo.py
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
API docs: http://127.0.0.1:8000/docs

## Run dashboard (Terminal 2)
```bash
streamlit run dashboard/app.py
```
Open http://localhost:8501

## Run mobile starter (Terminal 3)
Install Node.js 18+, then:
```bash
cd mobile
npm install
npx expo start
```
Edit API_BASE_URL in mobile/App.tsx:
- Android emulator: http://10.0.2.2:8000
- iOS simulator: http://127.0.0.1:8000
- Physical phone: http://YOUR_COMPUTER_LAN_IP:8000

## Dataset plan
- Rice: first disease-classification baseline; audit a labelled dataset for blast, bacterial blight, brown spot and healthy leaves.
- Tea: source a tea-leaf dataset and verify labels; collect expert-labelled local field photos for validation.
- Mustard: include in crop records; only enable disease classification after finding a suitable labelled dataset.
- PlantVillage: https://plantvillage.psu.edu/ (benchmark only; controlled images may not generalise to fields).
- Sentinel-2: https://browser.dataspace.copernicus.eu/ or https://earthengine.google.com/
- Weather: https://power.larc.nasa.gov/
- Crop calendars/advisories: Assam Agriculture Department, Assam Agricultural University, ICAR and KVK publications.

Register every dataset's title, authors, URL, licence, classes, image count, collection conditions and limitations. Check duplicates, imbalance, labels and licence. Split images by farm/location/session to reduce leakage. Report per-class precision, recall, F1 and confusion matrix. Keep a held-out test set.

## Important limitations
The included sample records are synthetic. The included screening score is transparent demo logic, not a disease probability, diagnosis or validated outbreak forecast. Satellite vegetation indices indicate vegetation change, not a specific disease. Obtain agronomist review before farmer-facing advice. Do not prescribe pesticides from an unvalidated model.
