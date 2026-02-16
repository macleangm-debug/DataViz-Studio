#!/usr/bin/env python3
"""
DataViz Studio - Auto-Configuration Script
Automatically configures infrastructure based on environment

Run: python3 auto_configure.py [environment]
Environments: development, staging, production
"""
import os
import sys
import asyncio
import logging
import subprocess
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration profiles
ENVIRONMENTS = {
    "development": {
        "redis": {
            "enabled": True,
            "mode": "single",
            "maxmemory": "256mb",
            "host": "localhost",
            "port": 6379
        },
        "celery": {
            "enabled": True,
            "workers": 2,
            "concurrency": 4
        },
        "mongodb": {
            "mode": "single",
            "create_indexes": True,
            "sharding": False
        }
    },
    "staging": {
        "redis": {
            "enabled": True,
            "mode": "single",
            "maxmemory": "512mb",
            "host": "localhost",
            "port": 6379
        },
        "celery": {
            "enabled": True,
            "workers": 4,
            "concurrency": 4
        },
        "mongodb": {
            "mode": "replica_set",
            "create_indexes": True,
            "sharding": False
        }
    },
    "production": {
        "redis": {
            "enabled": True,
            "mode": "cluster",
            "maxmemory": "1gb",
            "nodes": 6
        },
        "celery": {
            "enabled": True,
            "workers": 8,
            "concurrency": 4
        },
        "mongodb": {
            "mode": "sharded",
            "create_indexes": True,
            "sharding": True,
            "shards": 3
        }
    }
}


def check_service(name: str, check_cmd: str) -> bool:
    """Check if a service is available"""
    try:
        result = subprocess.run(check_cmd.split(), capture_output=True, timeout=5)
        return result.returncode == 0
    except:
        return False


def configure_redis(config: dict) -> bool:
    """Configure Redis based on environment"""
    logger.info(f"Configuring Redis ({config['mode']} mode)...")
    
    if config["mode"] == "single":
        # Check if Redis is already running
        if check_service("redis", "redis-cli ping"):
            logger.info("Redis already running")
            return True
        
        # Start Redis via supervisor or directly
        try:
            subprocess.run([
                "redis-server",
                "--daemonize", "yes",
                "--port", str(config["port"]),
                "--maxmemory", config["maxmemory"],
                "--maxmemory-policy", "allkeys-lru"
            ], check=True)
            logger.info(f"Redis started on port {config['port']}")
            return True
        except Exception as e:
            logger.error(f"Failed to start Redis: {e}")
            return False
    
    elif config["mode"] == "cluster":
        logger.warning("Redis Cluster requires manual setup or Kubernetes deployment")
        logger.info("Use: kubectl apply -f k8s/redis-cluster.yaml")
        return False
    
    return False


def configure_celery(config: dict, env: str) -> bool:
    """Configure Celery workers"""
    logger.info(f"Configuring Celery ({config['workers']} workers, {config['concurrency']} concurrency)...")
    
    # Check if Celery is available
    celery_path = subprocess.run(["which", "celery"], capture_output=True, text=True)
    if celery_path.returncode != 0:
        logger.error("Celery not found. Install with: pip install celery")
        return False
    
    celery_bin = celery_path.stdout.strip()
    
    # Generate supervisor config
    supervisor_config = f"""[program:celery_worker]
command={celery_bin} -A utils.tasks worker --loglevel=info --concurrency={config['concurrency']} --hostname=worker%(process_num)s@%%h --queues=celery,high_priority,low_priority
directory=/app/backend
numprocs={config['workers']}
process_name=%(program_name)s_%(process_num)02d
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=60
stopasgroup=true
killasgroup=true
stdout_logfile=/var/log/supervisor/celery_worker_%(process_num)02d.log
stderr_logfile=/var/log/supervisor/celery_worker_%(process_num)02d.err.log
environment=
    REDIS_URL="redis://localhost:6379/0",
    CELERY_BROKER_URL="redis://localhost:6379/0",
    CELERY_RESULT_BACKEND="redis://localhost:6379/0"

[program:celery_beat]
command={celery_bin} -A utils.tasks beat --loglevel=info --pidfile=/tmp/celerybeat.pid
directory=/app/backend
numprocs=1
autostart=true
autorestart=true
startsecs=10
stdout_logfile=/var/log/supervisor/celery_beat.log
stderr_logfile=/var/log/supervisor/celery_beat.err.log
environment=
    REDIS_URL="redis://localhost:6379/0",
    CELERY_BROKER_URL="redis://localhost:6379/0"
"""
    
    # Write supervisor config
    config_path = Path("/etc/supervisor/conf.d/celery.conf")
    try:
        config_path.write_text(supervisor_config)
        logger.info(f"Celery supervisor config written to {config_path}")
        
        # Reload supervisor
        subprocess.run(["supervisorctl", "reread"], check=True)
        subprocess.run(["supervisorctl", "update"], check=True)
        logger.info("Supervisor updated with Celery configuration")
        return True
    except Exception as e:
        logger.error(f"Failed to configure Celery: {e}")
        return False


async def configure_mongodb(config: dict) -> bool:
    """Configure MongoDB indexes and optionally sharding"""
    logger.info(f"Configuring MongoDB ({config['mode']} mode)...")
    
    if config["create_indexes"]:
        try:
            # Import and run index creation
            sys.path.insert(0, "/app/backend")
            from motor.motor_asyncio import AsyncIOMotorClient
            from utils.indexes import create_indexes
            
            mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
            db_name = os.environ.get("DB_NAME", "dataviz_studio")
            
            client = AsyncIOMotorClient(mongo_url)
            db = client[db_name]
            
            await create_indexes(db)
            logger.info("MongoDB indexes created successfully")
            
            client.close()
        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")
            return False
    
    if config["sharding"]:
        logger.warning("MongoDB Sharding requires a sharded cluster")
        logger.info("For production, use MongoDB Atlas or deploy:")
        logger.info("  - 3 Config Servers")
        logger.info("  - 3+ Shard Replica Sets")
        logger.info("  - 2+ Mongos Routers")
        logger.info("Use: kubectl apply -f k8s/mongodb-sharded.yaml")
    
    return True


def configure_environment_variables(env: str) -> bool:
    """Set up environment variables"""
    logger.info("Configuring environment variables...")
    
    env_file = Path("/app/backend/.env")
    
    # Read existing env
    existing_env = {}
    if env_file.exists():
        for line in env_file.read_text().split("\n"):
            if "=" in line and not line.startswith("#"):
                key, value = line.split("=", 1)
                existing_env[key.strip()] = value.strip()
    
    # Add Redis configuration
    new_vars = {
        "REDIS_URL": "redis://localhost:6379/0",
        "CELERY_BROKER_URL": "redis://localhost:6379/0",
        "CELERY_RESULT_BACKEND": "redis://localhost:6379/0",
        "CACHE_ENABLED": "true",
        "ENVIRONMENT": env
    }
    
    # Merge with existing
    existing_env.update(new_vars)
    
    # Write back
    env_content = "\n".join([f"{k}={v}" for k, v in existing_env.items()])
    env_file.write_text(env_content)
    
    logger.info(f"Environment variables configured for {env}")
    return True


def generate_kubernetes_manifests(env: str, config: dict):
    """Generate Kubernetes manifests for production deployment"""
    logger.info("Generating Kubernetes manifests...")
    
    k8s_dir = Path("/app/backend/k8s")
    k8s_dir.mkdir(exist_ok=True)
    
    # Redis manifest
    redis_yaml = """apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: dataviz
spec:
  serviceName: redis
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command:
        - redis-server
        - --maxmemory
        - "1gb"
        - --maxmemory-policy
        - allkeys-lru
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: dataviz
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
"""
    (k8s_dir / "redis.yaml").write_text(redis_yaml)
    
    # Celery workers manifest
    celery_yaml = f"""apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-workers
  namespace: dataviz
spec:
  replicas: {config['celery']['workers']}
  selector:
    matchLabels:
      app: celery-worker
  template:
    metadata:
      labels:
        app: celery-worker
    spec:
      containers:
      - name: worker
        image: dataviz-studio:latest
        command:
        - celery
        - -A
        - utils.tasks
        - worker
        - --loglevel=info
        - --concurrency={config['celery']['concurrency']}
        env:
        - name: REDIS_URL
          value: redis://redis:6379/0
        - name: MONGO_URL
          valueFrom:
            secretKeyRef:
              name: dataviz-secrets
              key: mongo-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2"
"""
    (k8s_dir / "celery.yaml").write_text(celery_yaml)
    
    logger.info(f"Kubernetes manifests generated in {k8s_dir}")


async def main(environment: str = "development"):
    """Main auto-configuration function"""
    logger.info(f"Starting auto-configuration for environment: {environment}")
    
    if environment not in ENVIRONMENTS:
        logger.error(f"Unknown environment: {environment}")
        logger.info(f"Valid environments: {list(ENVIRONMENTS.keys())}")
        sys.exit(1)
    
    config = ENVIRONMENTS[environment]
    success = True
    
    # Step 1: Configure environment variables
    configure_environment_variables(environment)
    
    # Step 2: Configure Redis
    if config["redis"]["enabled"]:
        if not configure_redis(config["redis"]):
            success = False
    
    # Step 3: Configure MongoDB
    if not await configure_mongodb(config["mongodb"]):
        success = False
    
    # Step 4: Configure Celery
    if config["celery"]["enabled"]:
        if not configure_celery(config["celery"], environment):
            success = False
    
    # Step 5: Generate K8s manifests for production
    if environment == "production":
        generate_kubernetes_manifests(environment, config)
    
    # Summary
    logger.info("\n" + "="*50)
    if success:
        logger.info(f"✅ Auto-configuration complete for {environment}!")
        logger.info("Services configured:")
        logger.info(f"  - Redis: {config['redis']['mode']} mode")
        logger.info(f"  - Celery: {config['celery']['workers']} workers")
        logger.info(f"  - MongoDB: {config['mongodb']['mode']} mode")
    else:
        logger.warning(f"⚠️ Configuration completed with warnings for {environment}")
        logger.info("Some services may require manual setup")
    
    logger.info("="*50)
    
    return success


if __name__ == "__main__":
    env = sys.argv[1] if len(sys.argv) > 1 else "development"
    asyncio.run(main(env))
