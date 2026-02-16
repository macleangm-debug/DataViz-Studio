#!/bin/bash
# Celery Worker Startup Script for DataViz Studio
# Starts multiple workers for background task processing

# Configuration
WORKERS=${CELERY_WORKERS:-2}
CONCURRENCY=${CELERY_CONCURRENCY:-4}
LOG_LEVEL=${CELERY_LOG_LEVEL:-info}
QUEUES=${CELERY_QUEUES:-celery,high_priority,low_priority}

# Navigate to backend directory
cd /app/backend

# Activate virtual environment if exists
if [ -f "/app/venv/bin/activate" ]; then
    source /app/venv/bin/activate
fi

# Start Celery workers
echo "Starting $WORKERS Celery workers with concurrency $CONCURRENCY..."

for i in $(seq 1 $WORKERS); do
    celery -A utils.tasks worker \
        --loglevel=$LOG_LEVEL \
        --concurrency=$CONCURRENCY \
        --hostname=worker$i@%h \
        --queues=$QUEUES \
        --pidfile=/tmp/celery_worker$i.pid \
        --logfile=/var/log/celery/worker$i.log \
        --detach
    
    echo "Started worker $i"
done

echo "All workers started. Check logs at /var/log/celery/"
