"""APScheduler configuration for scheduled tasks"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()


def init_scheduler():
    """Initialize and start the scheduler"""
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started")


def shutdown_scheduler():
    """Shutdown the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shutdown")


def add_interval_job(job_id: str, func, hours: int = 0, minutes: int = 0, **kwargs):
    """Add an interval-based job"""
    trigger = IntervalTrigger(hours=hours, minutes=minutes)
    scheduler.add_job(func, trigger, id=job_id, replace_existing=True, **kwargs)
    logger.info(f"Added interval job: {job_id}")


def add_cron_job(job_id: str, func, cron_expression: str, **kwargs):
    """Add a cron-based job"""
    parts = cron_expression.split()
    if len(parts) >= 5:
        trigger = CronTrigger(
            minute=parts[0],
            hour=parts[1],
            day=parts[2],
            month=parts[3],
            day_of_week=parts[4]
        )
        scheduler.add_job(func, trigger, id=job_id, replace_existing=True, **kwargs)
        logger.info(f"Added cron job: {job_id}")


def remove_job(job_id: str):
    """Remove a scheduled job"""
    try:
        scheduler.remove_job(job_id)
        logger.info(f"Removed job: {job_id}")
    except Exception as e:
        logger.warning(f"Job {job_id} not found: {str(e)}")


def get_job(job_id: str):
    """Get a job by ID"""
    return scheduler.get_job(job_id)


def get_all_jobs():
    """Get all scheduled jobs"""
    return scheduler.get_jobs()
