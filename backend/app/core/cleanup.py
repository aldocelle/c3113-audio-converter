import time
from pathlib import Path
from datetime import datetime, timedelta
from app.config import settings, get_logger

logger = get_logger(__name__)

JOB_EXPIRY_DAYS = 7


def cleanup_temp_files():
    temp_dir = Path(settings.temp_dir)
    if not temp_dir.exists():
        return
    now = time.time()
    cutoff = now - (24 * 3600)
    deleted = 0
    for file in temp_dir.glob("*_output.*"):
        if file.stat().st_mtime < cutoff:
            try:
                file.unlink()
                deleted += 1
            except Exception as e:
                logger.warning(f"Could not delete {file}: {e}")
    if deleted > 0:
        logger.info(f"Cleanup: removed {deleted} temp files")


def cleanup_old_jobs():
    jobs_dir = Path(settings.temp_dir) / "jobs"
    if not jobs_dir.exists():
        return
    cutoff = datetime.utcnow() - timedelta(days=JOB_EXPIRY_DAYS)
    deleted = 0
    for job_file in jobs_dir.glob("*.json"):
        try:
            stat = job_file.stat()
            mtime = datetime.fromtimestamp(stat.st_mtime)
            if mtime < cutoff:
                job_file.unlink()
                deleted += 1
        except Exception as e:
            logger.warning(f"Could not delete job {job_file}: {e}")
    if deleted > 0:
        logger.info(f"Cleanup: removed {deleted} old jobs")


def run_cleanup():
    logger.info("Starting cleanup cycle")
    cleanup_temp_files()
    cleanup_old_jobs()
    logger.info("Cleanup cycle complete")
