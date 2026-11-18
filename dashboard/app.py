import requests
import pandas as pd
import streamlit as st
import plotly.express as px

API = "http://127.0.0.1:8000"
st.set_page_config(page_title="AgriRakshak Assam", page_icon="🌱", layout="wide")
st.title("🌱 AgriRakshak Assam")
st.caption("Phase 1 multi-crop monitoring prototype — demo scores are not validated predictions.")

try:
    requests.get(API + "/health", timeout=3).raise_for_status()
except requests.RequestException:
    st.error("Backend offline. Start: uvicorn backend.app.main:app --reload")
    st.stop()

tabs = st.tabs(["Overview", "Add field observation", "Verify field report"])
def get_data():
    r = requests.get(API + "/observations", timeout=10)
    r.raise_for_status()
    return pd.DataFrame(r.json())

with tabs[0]:
    df = get_data()
    if df.empty:
        st.info("No records yet. Add an observation or run scripts/seed_demo.py.")
    else:
        a,b,c = st.columns(3)
        a.metric("Observations", len(df))
        b.metric("Crop types", df.crop.nunique())
        c.metric("Pending verification", int((df.verification_status == "pending").sum()))
        st.plotly_chart(px.bar(df.groupby("crop").size().reset_index(name="records"),
                               x="crop", y="records", title="Observations by crop"), use_container_width=True)
        st.dataframe(df, use_container_width=True, hide_index=True)
        risk_rows = []
        for row in df.to_dict("records"):
            result = requests.get(f"{API}/observations/{row['id']}/risk").json()
            risk_rows.append({"Field":row["field_name"], "Crop":row["crop"],
                              "Demo score":result["score"], "Level":result["level"],
                              "Reason": "; ".join(result["explanation"])})
        st.subheader("Illustrative screening scores")
        st.dataframe(pd.DataFrame(risk_rows), use_container_width=True, hide_index=True)
        st.warning("These scores are illustrative interface logic, not disease probabilities or validated forecasts.")

with tabs[1]:
    with st.form("observation"):
        field = st.text_input("Field name", "Demo plot")
        crop = st.selectbox("Crop", ["rice","tea","mustard","other"])
        stage = st.selectbox("Growth stage", ["unknown","nursery","vegetative","flowering","reproductive","maturity"])
        c1,c2 = st.columns(2)
        lat = c1.number_input("Latitude", value=26.65, format="%.6f")
        lon = c2.number_input("Longitude", value=92.80, format="%.6f")
        temp = c1.number_input("Temperature °C", value=28.0)
        humidity = c2.number_input("Humidity %", min_value=0.0, max_value=100.0, value=82.0)
        rain = c1.number_input("7-day rainfall mm", min_value=0.0, value=35.0)
        ndvi = c2.number_input("Latest NDVI (-1 = unavailable)", min_value=-1.0, max_value=1.0, value=0.62)
        previous = c1.number_input("Previous NDVI (-1 = unavailable)", min_value=-1.0, max_value=1.0, value=0.68)
        notes = st.text_area("Notes")
        submitted = st.form_submit_button("Save observation")
    if submitted:
        payload = {"field_name":field,"crop":crop,"growth_stage":stage,"latitude":lat,"longitude":lon,
                   "temperature_c":temp,"humidity_pct":humidity,"rainfall_7d_mm":rain,
                   "ndvi":None if ndvi == -1 else ndvi,
                   "previous_ndvi":None if previous == -1 else previous,"notes":notes}
        response = requests.post(API + "/observations", json=payload, timeout=10)
        if response.ok:
            item = response.json()
            result = requests.get(f"{API}/observations/{item['id']}/risk").json()
            st.success(f"Saved observation #{item['id']}")
            st.metric("Illustrative screening score", f"{result['score']}/100", result["level"])
            st.write(result["explanation"])
            st.caption(result["disclaimer"])
        else:
            st.error(response.text)

with tabs[2]:
    df = get_data()
    if df.empty:
        st.info("No observations to verify.")
    else:
        choices = {f"#{r.id} {r.field_name} ({r.crop})": int(r.id) for r in df.itertuples()}
        selected = st.selectbox("Observation", list(choices))
        status = st.selectbox("Verification", ["confirmed","not_confirmed","inconclusive","pending"])
        if st.button("Update status"):
            r = requests.patch(f"{API}/observations/{choices[selected]}/verification", params={"status":status})
            if r.ok:
                st.success("Verification updated.")
                st.rerun()
            else:
                st.error(r.text)
