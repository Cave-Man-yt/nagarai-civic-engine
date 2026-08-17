import os
import sys
import datetime
import logging

# Ensure root and backend directories are in python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT_DIR)
sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))

from app.database import engine, SessionLocal, Base
from app.models import Cluster, Complaint, FieldCrew, CitizenNotification, OfficerNotification

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("nagarai.db_setup")

INITIAL_FIELD_CREWS = [
    {
        "crew_id": "CREW-PWD-01",
        "name": "Road Rapid Repair Unit #3",
        "department": "Roads & PWD",
        "contact": "",
        "vehicle_number": "",
        "status": "available",
    },
    {
        "crew_id": "CREW-ELEC-09",
        "name": "High Voltage Emergency Squad",
        "department": "Electricity & Power",
        "contact": "",
        "vehicle_number": "",
        "status": "available",
    },
    {
        "crew_id": "CREW-SWM-04",
        "name": "Sanitation & De-clog Unit B",
        "department": "Solid Waste Management",
        "contact": "",
        "vehicle_number": "",
        "status": "available",
    },
    {
        "crew_id": "CREW-WSD-02",
        "name": "Drainage & Manhole Fast-Response",
        "department": "Water Supply & Drainage",
        "contact": "",
        "vehicle_number": "",
        "status": "available",
    },
]

def seed_initial_database(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 1. Create tables
        logger.info("Creating database tables if not exist...")
        Base.metadata.create_all(bind=engine)

        # 2. Clear existing records to ensure fresh state
        logger.info("Clearing existing data...")
        db.query(CitizenNotification).delete()
        db.query(OfficerNotification).delete()
        db.query(Complaint).delete()
        db.query(Cluster).delete()
        db.query(FieldCrew).delete()
        db.commit()

        # 3. Seed Crews
        logger.info("Seeding field crews...")
        for c in INITIAL_FIELD_CREWS:
            crew = FieldCrew(**c)
            db.add(crew)
        db.commit()

        logger.info("Database initialized with 0 complaints and fresh operational state.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error initializing database: {e}", exc_info=True)
        raise
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    seed_initial_database()
