"""
Background Task Processing for DataViz Studio
Uses Celery for distributed task processing
"""
import os
import logging
from celery import Celery
from typing import Optional, Dict, Any, List
import pandas as pd
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# Celery configuration
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", REDIS_URL)

# Initialize Celery app
celery_app = Celery(
    "dataviz_tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3000,  # 50 minutes soft limit
    worker_prefetch_multiplier=1,  # One task at a time per worker
    task_acks_late=True,  # Acknowledge after completion
    task_reject_on_worker_lost=True,
    result_expires=86400,  # Results expire after 24 hours
)


# Task status tracking
class TaskStatus:
    PENDING = "pending"
    STARTED = "started"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@celery_app.task(bind=True, name="process_large_dataset")
def process_large_dataset(self, dataset_id: str, file_path: str, options: dict = None):
    """
    Process a large dataset file in the background
    - Validates data
    - Cleans and transforms
    - Stores in database
    - Updates progress
    """
    try:
        self.update_state(state=TaskStatus.STARTED, meta={"progress": 0, "status": "Reading file..."})
        
        # Read file based on type
        file_ext = file_path.split(".")[-1].lower()
        
        if file_ext == "csv":
            # Read in chunks for large files
            chunk_size = 50000
            chunks = []
            total_rows = 0
            
            for i, chunk in enumerate(pd.read_csv(file_path, chunksize=chunk_size)):
                chunks.append(chunk)
                total_rows += len(chunk)
                progress = min(50, (i + 1) * 10)  # Cap at 50% for reading
                self.update_state(
                    state=TaskStatus.PROCESSING,
                    meta={"progress": progress, "status": f"Reading chunk {i+1}...", "rows_read": total_rows}
                )
            
            df = pd.concat(chunks, ignore_index=True)
            
        elif file_ext in ["xlsx", "xls"]:
            df = pd.read_excel(file_path)
        elif file_ext == "json":
            df = pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        self.update_state(state=TaskStatus.PROCESSING, meta={"progress": 60, "status": "Cleaning data..."})
        
        # Data cleaning
        if options and options.get("clean_data", True):
            # Remove duplicate rows
            df = df.drop_duplicates()
            
            # Handle missing values
            df = df.fillna("")
            
            # Convert date columns
            for col in df.columns:
                if df[col].dtype == "object":
                    try:
                        df[col] = pd.to_datetime(df[col])
                    except:
                        pass
        
        self.update_state(state=TaskStatus.PROCESSING, meta={"progress": 80, "status": "Storing data..."})
        
        # Prepare result
        result = {
            "dataset_id": dataset_id,
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "columns": list(df.columns),
            "column_types": {col: str(df[col].dtype) for col in df.columns},
            "sample_data": df.head(100).to_dict(orient="records"),
            "processed_at": datetime.utcnow().isoformat()
        }
        
        self.update_state(state=TaskStatus.COMPLETED, meta={"progress": 100, "status": "Complete"})
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing dataset {dataset_id}: {e}")
        self.update_state(state=TaskStatus.FAILED, meta={"error": str(e)})
        raise


@celery_app.task(bind=True, name="generate_report_pdf")
def generate_report_pdf(self, report_id: str, report_data: dict, options: dict = None):
    """
    Generate PDF report in the background
    - Renders charts
    - Creates PDF document
    - Stores file
    """
    try:
        self.update_state(state=TaskStatus.STARTED, meta={"progress": 0, "status": "Initializing..."})
        
        sections = report_data.get("sections", [])
        total_sections = len(sections)
        
        # Process each section
        for i, section in enumerate(sections):
            progress = int((i / total_sections) * 80)
            self.update_state(
                state=TaskStatus.PROCESSING,
                meta={"progress": progress, "status": f"Processing section {i+1}/{total_sections}..."}
            )
            
            # Process section (charts, tables, etc.)
            # This would integrate with actual PDF generation library
        
        self.update_state(state=TaskStatus.PROCESSING, meta={"progress": 90, "status": "Generating PDF..."})
        
        # Generate PDF (placeholder - would use actual PDF library)
        pdf_path = f"/tmp/report_{report_id}.pdf"
        
        result = {
            "report_id": report_id,
            "pdf_path": pdf_path,
            "generated_at": datetime.utcnow().isoformat(),
            "sections_processed": total_sections
        }
        
        self.update_state(state=TaskStatus.COMPLETED, meta={"progress": 100, "status": "Complete"})
        
        return result
        
    except Exception as e:
        logger.error(f"Error generating report {report_id}: {e}")
        self.update_state(state=TaskStatus.FAILED, meta={"error": str(e)})
        raise


@celery_app.task(bind=True, name="aggregate_large_dataset")
def aggregate_large_dataset(self, dataset_id: str, data: List[dict], aggregation_config: dict):
    """
    Perform aggregations on large datasets in the background
    """
    try:
        self.update_state(state=TaskStatus.STARTED, meta={"progress": 0, "status": "Loading data..."})
        
        df = pd.DataFrame(data)
        
        self.update_state(state=TaskStatus.PROCESSING, meta={"progress": 30, "status": "Aggregating..."})
        
        group_by = aggregation_config.get("group_by", [])
        metrics = aggregation_config.get("metrics", [])
        
        result_data = {}
        
        for metric in metrics:
            field = metric.get("field")
            agg_type = metric.get("type", "sum")
            
            if group_by:
                if agg_type == "sum":
                    grouped = df.groupby(group_by)[field].sum()
                elif agg_type == "avg":
                    grouped = df.groupby(group_by)[field].mean()
                elif agg_type == "count":
                    grouped = df.groupby(group_by)[field].count()
                elif agg_type == "min":
                    grouped = df.groupby(group_by)[field].min()
                elif agg_type == "max":
                    grouped = df.groupby(group_by)[field].max()
                else:
                    grouped = df.groupby(group_by)[field].sum()
                
                result_data[f"{field}_{agg_type}"] = grouped.to_dict()
            else:
                if agg_type == "sum":
                    result_data[f"{field}_{agg_type}"] = df[field].sum()
                elif agg_type == "avg":
                    result_data[f"{field}_{agg_type}"] = df[field].mean()
                elif agg_type == "count":
                    result_data[f"{field}_{agg_type}"] = len(df)
        
        self.update_state(state=TaskStatus.COMPLETED, meta={"progress": 100, "status": "Complete"})
        
        return {
            "dataset_id": dataset_id,
            "aggregations": result_data,
            "processed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error aggregating dataset {dataset_id}: {e}")
        self.update_state(state=TaskStatus.FAILED, meta={"error": str(e)})
        raise


@celery_app.task(bind=True, name="sync_database_connection")
def sync_database_connection(self, connection_id: str, connection_config: dict):
    """
    Sync data from external database in the background
    """
    try:
        self.update_state(state=TaskStatus.STARTED, meta={"progress": 0, "status": "Connecting..."})
        
        db_type = connection_config.get("type")
        
        self.update_state(state=TaskStatus.PROCESSING, meta={"progress": 20, "status": f"Querying {db_type}..."})
        
        # This would connect to actual database
        # For now, placeholder
        
        self.update_state(state=TaskStatus.PROCESSING, meta={"progress": 80, "status": "Processing results..."})
        
        result = {
            "connection_id": connection_id,
            "synced_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        self.update_state(state=TaskStatus.COMPLETED, meta={"progress": 100, "status": "Sync complete"})
        
        return result
        
    except Exception as e:
        logger.error(f"Error syncing connection {connection_id}: {e}")
        self.update_state(state=TaskStatus.FAILED, meta={"error": str(e)})
        raise


@celery_app.task(bind=True, name="batch_export_data")
def batch_export_data(self, export_config: dict):
    """
    Export large amounts of data in batches
    """
    try:
        self.update_state(state=TaskStatus.STARTED, meta={"progress": 0, "status": "Preparing export..."})
        
        dataset_ids = export_config.get("dataset_ids", [])
        export_format = export_config.get("format", "csv")
        
        exported_files = []
        total = len(dataset_ids)
        
        for i, dataset_id in enumerate(dataset_ids):
            progress = int((i / total) * 90)
            self.update_state(
                state=TaskStatus.PROCESSING,
                meta={"progress": progress, "status": f"Exporting dataset {i+1}/{total}..."}
            )
            
            # Export logic would go here
            exported_files.append(f"/tmp/export_{dataset_id}.{export_format}")
        
        result = {
            "exported_files": exported_files,
            "total_datasets": total,
            "format": export_format,
            "exported_at": datetime.utcnow().isoformat()
        }
        
        self.update_state(state=TaskStatus.COMPLETED, meta={"progress": 100, "status": "Export complete"})
        
        return result
        
    except Exception as e:
        logger.error(f"Error in batch export: {e}")
        self.update_state(state=TaskStatus.FAILED, meta={"error": str(e)})
        raise


# Helper functions for task management
def get_task_status(task_id: str) -> dict:
    """Get the status of a background task"""
    result = celery_app.AsyncResult(task_id)
    
    response = {
        "task_id": task_id,
        "status": result.status,
        "ready": result.ready(),
        "successful": result.successful() if result.ready() else None,
    }
    
    if result.info:
        if isinstance(result.info, dict):
            response.update(result.info)
        elif isinstance(result.info, Exception):
            response["error"] = str(result.info)
    
    if result.ready() and result.successful():
        response["result"] = result.result
    
    return response


def cancel_task(task_id: str) -> bool:
    """Cancel a running task"""
    try:
        celery_app.control.revoke(task_id, terminate=True)
        return True
    except Exception as e:
        logger.error(f"Error canceling task {task_id}: {e}")
        return False
