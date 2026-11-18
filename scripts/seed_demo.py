from datetime import datetime, timezone
from backend.app.main import init_db, connect

def main():
    init_db()
    demo = [
        ("DEMO Rice Plot A","rice","vegetative",26.65,92.80,28,88,62,0.58,0.69,"SYNTHETIC DATA ONLY"),
        ("DEMO Tea Plot B","tea","flowering",26.70,92.75,27,76,18,0.72,0.74,"SYNTHETIC DATA ONLY"),
        ("DEMO Mustard Plot C","mustard","vegetative",26.62,92.83,29,68,8,0.66,0.67,"SYNTHETIC DATA ONLY")
    ]
    with connect() as con:
        n = con.execute("SELECT COUNT(*) FROM observations").fetchone()[0]
        if n:
            print("Database already has records; skipping demo seed.")
            return
        now = datetime.now(timezone.utc).isoformat()
        con.executemany(
            "INSERT INTO observations (field_name,crop,growth_stage,latitude,longitude,temperature_c,humidity_pct,rainfall_7d_mm,ndvi,previous_ndvi,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            [row + (now,) for row in demo])
        con.commit()
    print("Added 3 synthetic demo observations.")

if __name__ == "__main__":
    main()
