import logging
import time
from sqlalchemy.sql import text
from app.db.session import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main() -> None:
    logger.info("Initializing service - waiting for DB")
    retries = 0
    max_retries = 60
    while retries < max_retries:
        try:
            db = SessionLocal()
            # Try to create session to check if DB is awake
            db.execute(text("SELECT 1"))
            db.close()
            logger.info("DB Connection established")
            return
        except Exception as e:
            logger.warning(f"DB not ready yet, retrying... ({retries+1}/{max_retries})")
            retries += 1
            time.sleep(2)
            
    raise Exception("Could not connect to DB")

if __name__ == "__main__":
    main()
