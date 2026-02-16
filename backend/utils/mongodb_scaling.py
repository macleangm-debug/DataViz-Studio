"""
MongoDB Sharding and Replica Set Configuration for DataViz Studio
Production-ready configuration for horizontal scaling
"""
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient, ReadPreference
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)


# ==========================================
# REPLICA SET CONFIGURATION
# ==========================================

REPLICA_SET_CONFIG = {
    "name": "dataviz-rs",
    "members": [
        {"host": "mongo-primary:27017", "priority": 2},  # Primary
        {"host": "mongo-secondary-1:27017", "priority": 1},  # Secondary
        {"host": "mongo-secondary-2:27017", "priority": 1},  # Secondary
        {"host": "mongo-arbiter:27017", "arbiter": True},  # Arbiter
    ]
}


def get_replica_set_uri() -> str:
    """
    Get MongoDB connection URI for replica set
    """
    hosts = ",".join([m["host"] for m in REPLICA_SET_CONFIG["members"] if not m.get("arbiter")])
    return f"mongodb://{hosts}/?replicaSet={REPLICA_SET_CONFIG['name']}"


def create_replica_set_client(
    read_preference: str = "secondaryPreferred",
    max_pool_size: int = 100
) -> AsyncIOMotorClient:
    """
    Create MongoDB client with replica set configuration
    
    Read preferences:
    - primary: All reads from primary (consistent but slower)
    - primaryPreferred: Primary if available, else secondary
    - secondary: All reads from secondary (eventual consistency)
    - secondaryPreferred: Secondary if available, else primary
    - nearest: Lowest latency member
    """
    uri = get_replica_set_uri()
    
    read_pref_map = {
        "primary": ReadPreference.PRIMARY,
        "primaryPreferred": ReadPreference.PRIMARY_PREFERRED,
        "secondary": ReadPreference.SECONDARY,
        "secondaryPreferred": ReadPreference.SECONDARY_PREFERRED,
        "nearest": ReadPreference.NEAREST,
    }
    
    client = AsyncIOMotorClient(
        uri,
        read_preference=read_pref_map.get(read_preference, ReadPreference.SECONDARY_PREFERRED),
        maxPoolSize=max_pool_size,
        minPoolSize=10,
        maxIdleTimeMS=30000,
        serverSelectionTimeoutMS=5000,
        retryWrites=True,
        w="majority",  # Write concern: majority of replica set
        wtimeout=10000,  # Write timeout: 10 seconds
    )
    
    return client


# ==========================================
# SHARDING CONFIGURATION
# ==========================================

SHARD_CONFIG = {
    "config_servers": [
        "config-1:27019",
        "config-2:27019",
        "config-3:27019",
    ],
    "shards": [
        {
            "name": "shard-1",
            "hosts": ["shard1-1:27018", "shard1-2:27018", "shard1-3:27018"],
            "replica_set": "shard1-rs"
        },
        {
            "name": "shard-2",
            "hosts": ["shard2-1:27018", "shard2-2:27018", "shard2-3:27018"],
            "replica_set": "shard2-rs"
        },
        {
            "name": "shard-3",
            "hosts": ["shard3-1:27018", "shard3-2:27018", "shard3-3:27018"],
            "replica_set": "shard3-rs"
        },
    ],
    "mongos_routers": [
        "mongos-1:27017",
        "mongos-2:27017",
    ]
}


def get_sharded_cluster_uri() -> str:
    """
    Get MongoDB connection URI for sharded cluster (via mongos routers)
    """
    routers = ",".join(SHARD_CONFIG["mongos_routers"])
    return f"mongodb://{routers}/"


async def setup_sharding(admin_client: AsyncIOMotorClient, db_name: str):
    """
    Configure sharding for DataViz Studio collections
    
    Sharding keys chosen based on query patterns:
    - submissions: dataset_id (range) - queries always filter by dataset
    - audit_logs: user_id (hashed) - distributed evenly across shards
    - dashboards: user_id (hashed) - distributed by user
    """
    admin_db = admin_client.admin
    
    # Enable sharding on database
    await admin_db.command("enableSharding", db_name)
    logger.info(f"Enabled sharding on database: {db_name}")
    
    # Shard collections with appropriate keys
    shard_configs = [
        # High-volume data collections
        {
            "collection": f"{db_name}.submissions",
            "key": {"dataset_id": 1, "created_at": 1},  # Range-based
            "unique": False
        },
        {
            "collection": f"{db_name}.dataset_data",
            "key": {"dataset_id": "hashed"},  # Hash-based for even distribution
            "unique": False
        },
        {
            "collection": f"{db_name}.audit_logs",
            "key": {"user_id": "hashed"},
            "unique": False
        },
        # User-scoped collections
        {
            "collection": f"{db_name}.dashboards",
            "key": {"user_id": "hashed"},
            "unique": False
        },
        {
            "collection": f"{db_name}.charts",
            "key": {"dashboard_id": "hashed"},
            "unique": False
        },
        {
            "collection": f"{db_name}.data_sources",
            "key": {"user_id": "hashed"},
            "unique": False
        },
    ]
    
    for config in shard_configs:
        try:
            await admin_db.command(
                "shardCollection",
                config["collection"],
                key=config["key"],
                unique=config["unique"]
            )
            logger.info(f"Sharded collection: {config['collection']} with key: {config['key']}")
        except Exception as e:
            logger.warning(f"Could not shard {config['collection']}: {e}")


async def configure_chunk_size(admin_client: AsyncIOMotorClient, size_mb: int = 64):
    """
    Configure chunk size for sharding
    Smaller chunks = more even distribution but more migrations
    Larger chunks = less migrations but potential hotspots
    """
    config_db = admin_client.config
    await config_db.settings.update_one(
        {"_id": "chunksize"},
        {"$set": {"value": size_mb}},
        upsert=True
    )
    logger.info(f"Set chunk size to {size_mb}MB")


# ==========================================
# CONNECTION POOL MANAGER
# ==========================================

class MongoConnectionPool:
    """
    Manages MongoDB connections with read replicas and write primary
    """
    
    def __init__(self):
        self._write_client: Optional[AsyncIOMotorClient] = None
        self._read_client: Optional[AsyncIOMotorClient] = None
        self._is_sharded: bool = False
    
    async def initialize(self, sharded: bool = False):
        """
        Initialize connection pools
        """
        self._is_sharded = sharded
        
        if sharded:
            uri = get_sharded_cluster_uri()
        else:
            uri = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        
        # Write client - always goes to primary
        self._write_client = AsyncIOMotorClient(
            uri,
            read_preference=ReadPreference.PRIMARY,
            maxPoolSize=50,
            w="majority"
        )
        
        # Read client - prefers secondaries for load distribution
        self._read_client = AsyncIOMotorClient(
            uri,
            read_preference=ReadPreference.SECONDARY_PREFERRED,
            maxPoolSize=100,
            readConcernLevel="local"  # Faster reads, eventual consistency OK
        )
        
        logger.info(f"MongoDB connection pools initialized (sharded={sharded})")
    
    def get_write_db(self, db_name: str):
        """Get database connection for writes"""
        if not self._write_client:
            raise RuntimeError("Connection pool not initialized")
        return self._write_client[db_name]
    
    def get_read_db(self, db_name: str):
        """Get database connection for reads"""
        if not self._read_client:
            raise RuntimeError("Connection pool not initialized")
        return self._read_client[db_name]
    
    async def close(self):
        """Close all connections"""
        if self._write_client:
            self._write_client.close()
        if self._read_client:
            self._read_client.close()
        logger.info("MongoDB connection pools closed")


# Global connection pool instance
connection_pool = MongoConnectionPool()


# ==========================================
# KUBERNETES DEPLOYMENT CONFIGS (YAML)
# ==========================================

MONGODB_REPLICA_SET_YAML = """
# MongoDB Replica Set StatefulSet
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: dataviz
spec:
  serviceName: mongodb
  replicas: 3
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        command:
        - mongod
        - --replSet
        - dataviz-rs
        - --bind_ip_all
        volumeMounts:
        - name: mongodb-data
          mountPath: /data/db
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
  volumeClaimTemplates:
  - metadata:
      name: mongodb-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
      storageClassName: fast-ssd
---
# Headless Service for StatefulSet
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: dataviz
spec:
  clusterIP: None
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
"""

REDIS_CLUSTER_YAML = """
# Redis Cluster for Caching
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: dataviz
spec:
  serviceName: redis
  replicas: 6  # 3 masters + 3 replicas
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
        - containerPort: 16379  # Cluster bus
        command:
        - redis-server
        - --cluster-enabled
        - "yes"
        - --cluster-config-file
        - /data/nodes.conf
        - --maxmemory
        - 1gb
        - --maxmemory-policy
        - allkeys-lru
        volumeMounts:
        - name: redis-data
          mountPath: /data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
"""

CELERY_WORKERS_YAML = """
# Celery Workers Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-workers
  namespace: dataviz
spec:
  replicas: 4
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
        - --concurrency=4
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: dataviz-secrets
              key: redis-url
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
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: celery-worker
              topologyKey: kubernetes.io/hostname
"""


# ==========================================
# UTILITY FUNCTIONS
# ==========================================

async def check_replica_set_status(client: AsyncIOMotorClient) -> dict:
    """Check replica set health status"""
    try:
        status = await client.admin.command("replSetGetStatus")
        return {
            "ok": status.get("ok"),
            "set": status.get("set"),
            "members": [
                {
                    "name": m.get("name"),
                    "state": m.get("stateStr"),
                    "health": m.get("health"),
                    "uptime": m.get("uptime")
                }
                for m in status.get("members", [])
            ]
        }
    except Exception as e:
        return {"error": str(e)}


async def check_sharding_status(client: AsyncIOMotorClient) -> dict:
    """Check sharding cluster status"""
    try:
        status = await client.admin.command("listShards")
        return {
            "ok": status.get("ok"),
            "shards": status.get("shards", [])
        }
    except Exception as e:
        return {"error": str(e)}


def get_production_config() -> dict:
    """
    Get recommended production configuration
    """
    return {
        "mongodb": {
            "replica_set_size": 3,
            "read_preference": "secondaryPreferred",
            "write_concern": "majority",
            "connection_pool_size": 100,
            "sharding": {
                "enabled": True,
                "chunk_size_mb": 64,
                "shard_count": 3
            }
        },
        "redis": {
            "cluster_mode": True,
            "nodes": 6,
            "max_memory": "1gb",
            "eviction_policy": "allkeys-lru"
        },
        "celery": {
            "workers": 4,
            "concurrency_per_worker": 4,
            "queues": ["celery", "high_priority", "low_priority"]
        },
        "estimated_capacity": {
            "concurrent_users": 10000,
            "submissions_per_second": 1000,
            "total_submissions": "500M+",
            "storage": "10TB+"
        }
    }
