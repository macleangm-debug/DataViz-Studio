"""
Database Indexes for DataViz Studio
Optimizes query performance for large datasets
"""
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


async def create_indexes(db: AsyncIOMotorDatabase):
    """
    Create all necessary indexes for optimal query performance
    """
    logger.info("Creating database indexes...")
    
    try:
        # ==========================================
        # USERS COLLECTION
        # ==========================================
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.users.create_index("organization_id")
        await db.users.create_index("created_at")
        logger.info("Created indexes for 'users' collection")
        
        # ==========================================
        # ORGANIZATIONS COLLECTION
        # ==========================================
        await db.organizations.create_index("id", unique=True)
        await db.organizations.create_index("name")
        await db.organizations.create_index("created_at")
        logger.info("Created indexes for 'organizations' collection")
        
        # ==========================================
        # DATA SOURCES COLLECTION
        # ==========================================
        await db.data_sources.create_index("id", unique=True)
        await db.data_sources.create_index("user_id")
        await db.data_sources.create_index("organization_id")
        await db.data_sources.create_index("name")
        await db.data_sources.create_index("type")
        await db.data_sources.create_index("created_at")
        await db.data_sources.create_index("updated_at")
        # Compound index for common queries
        await db.data_sources.create_index([
            ("user_id", 1),
            ("created_at", -1)
        ])
        await db.data_sources.create_index([
            ("organization_id", 1),
            ("type", 1)
        ])
        logger.info("Created indexes for 'data_sources' collection")
        
        # ==========================================
        # DATABASE CONNECTIONS COLLECTION
        # ==========================================
        await db.database_connections.create_index("id", unique=True)
        await db.database_connections.create_index("user_id")
        await db.database_connections.create_index("organization_id")
        await db.database_connections.create_index("type")
        await db.database_connections.create_index([
            ("user_id", 1),
            ("type", 1)
        ])
        logger.info("Created indexes for 'database_connections' collection")
        
        # ==========================================
        # DASHBOARDS COLLECTION
        # ==========================================
        await db.dashboards.create_index("id", unique=True)
        await db.dashboards.create_index("user_id")
        await db.dashboards.create_index("organization_id")
        await db.dashboards.create_index("name")
        await db.dashboards.create_index("is_public")
        await db.dashboards.create_index("template_id")
        await db.dashboards.create_index("created_at")
        await db.dashboards.create_index("updated_at")
        # Compound indexes for dashboard queries
        await db.dashboards.create_index([
            ("user_id", 1),
            ("created_at", -1)
        ])
        await db.dashboards.create_index([
            ("organization_id", 1),
            ("is_public", 1)
        ])
        await db.dashboards.create_index([
            ("user_id", 1),
            ("name", 1)
        ])
        logger.info("Created indexes for 'dashboards' collection")
        
        # ==========================================
        # CHARTS COLLECTION
        # ==========================================
        await db.charts.create_index("id", unique=True)
        await db.charts.create_index("dashboard_id")
        await db.charts.create_index("user_id")
        await db.charts.create_index("data_source_id")
        await db.charts.create_index("type")
        await db.charts.create_index("created_at")
        # Compound indexes for chart queries
        await db.charts.create_index([
            ("dashboard_id", 1),
            ("position", 1)
        ])
        await db.charts.create_index([
            ("data_source_id", 1),
            ("type", 1)
        ])
        logger.info("Created indexes for 'charts' collection")
        
        # ==========================================
        # TEMPLATES COLLECTION
        # ==========================================
        await db.templates.create_index("id", unique=True)
        await db.templates.create_index("user_id")
        await db.templates.create_index("name")
        await db.templates.create_index("category")
        await db.templates.create_index("is_preset")
        await db.templates.create_index("is_public")
        await db.templates.create_index("created_at")
        # Compound index for template browsing
        await db.templates.create_index([
            ("category", 1),
            ("is_public", 1),
            ("created_at", -1)
        ])
        logger.info("Created indexes for 'templates' collection")
        
        # ==========================================
        # REPORTS COLLECTION
        # ==========================================
        await db.reports.create_index("id", unique=True)
        await db.reports.create_index("user_id")
        await db.reports.create_index("dashboard_id")
        await db.reports.create_index("created_at")
        await db.reports.create_index("status")
        # Compound index for report listing
        await db.reports.create_index([
            ("user_id", 1),
            ("created_at", -1)
        ])
        logger.info("Created indexes for 'reports' collection")
        
        # ==========================================
        # SUBMISSIONS / DATA RECORDS COLLECTION
        # For large-scale data storage
        # ==========================================
        await db.submissions.create_index("id", unique=True)
        await db.submissions.create_index("dataset_id")
        await db.submissions.create_index("user_id")
        await db.submissions.create_index("created_at")
        await db.submissions.create_index("updated_at")
        # Compound indexes for data queries
        await db.submissions.create_index([
            ("dataset_id", 1),
            ("created_at", -1)
        ])
        # Text index for search
        await db.submissions.create_index([
            ("$**", "text")
        ], name="submissions_text_search")
        logger.info("Created indexes for 'submissions' collection")
        
        # ==========================================
        # AUDIT LOG COLLECTION
        # ==========================================
        await db.audit_logs.create_index("id", unique=True)
        await db.audit_logs.create_index("user_id")
        await db.audit_logs.create_index("action")
        await db.audit_logs.create_index("resource_type")
        await db.audit_logs.create_index("resource_id")
        # Compound index for audit queries
        await db.audit_logs.create_index([
            ("user_id", 1),
            ("created_at", -1)
        ])
        await db.audit_logs.create_index([
            ("resource_type", 1),
            ("resource_id", 1),
            ("created_at", -1)
        ])
        # TTL index - drop and recreate if exists with different options
        try:
            await db.audit_logs.drop_index("audit_logs_ttl")
        except:
            pass
        await db.audit_logs.create_index(
            "created_at",
            expireAfterSeconds=90 * 24 * 60 * 60,
            name="audit_logs_ttl"
        )
        logger.info("Created indexes for 'audit_logs' collection")
        
        # ==========================================
        # BACKGROUND TASKS COLLECTION
        # ==========================================
        await db.background_tasks.create_index("id", unique=True)
        await db.background_tasks.create_index("task_id")
        await db.background_tasks.create_index("user_id")
        await db.background_tasks.create_index("status")
        await db.background_tasks.create_index("created_at")
        # Compound index for task queries
        await db.background_tasks.create_index([
            ("user_id", 1),
            ("status", 1),
            ("created_at", -1)
        ])
        # TTL index - drop and recreate if exists
        try:
            await db.background_tasks.drop_index("tasks_ttl")
        except:
            pass
        await db.background_tasks.create_index(
            "completed_at",
            expireAfterSeconds=7 * 24 * 60 * 60,
            partialFilterExpression={"status": "completed"},
            name="tasks_ttl"
        )
        logger.info("Created indexes for 'background_tasks' collection")
        
        # ==========================================
        # CACHE METADATA COLLECTION
        # ==========================================
        await db.cache_metadata.create_index("key", unique=True)
        # TTL index - drop and recreate if exists
        try:
            await db.cache_metadata.drop_index("cache_ttl")
        except:
            pass
        await db.cache_metadata.create_index(
            "expires_at",
            expireAfterSeconds=0,
            name="cache_ttl"
        )
        logger.info("Created indexes for 'cache_metadata' collection")
        
        logger.info("All database indexes created successfully!")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        raise


async def get_index_stats(db: AsyncIOMotorDatabase) -> dict:
    """Get statistics about indexes"""
    collections = await db.list_collection_names()
    stats = {}
    
    for collection_name in collections:
        try:
            collection = db[collection_name]
            indexes = await collection.index_information()
            index_stats = await collection.aggregate([
                {"$indexStats": {}}
            ]).to_list(length=100)
            
            stats[collection_name] = {
                "index_count": len(indexes),
                "indexes": list(indexes.keys()),
                "stats": index_stats
            }
        except Exception as e:
            stats[collection_name] = {"error": str(e)}
    
    return stats


async def analyze_slow_queries(db: AsyncIOMotorDatabase) -> list:
    """Analyze slow queries from profiler data"""
    try:
        # Get slow queries from system.profile
        profile_data = await db.system.profile.find({
            "millis": {"$gt": 100}  # Queries taking > 100ms
        }).sort("ts", -1).limit(50).to_list(length=50)
        
        slow_queries = []
        for entry in profile_data:
            slow_queries.append({
                "timestamp": entry.get("ts"),
                "duration_ms": entry.get("millis"),
                "operation": entry.get("op"),
                "namespace": entry.get("ns"),
                "query": entry.get("query"),
                "plan_summary": entry.get("planSummary")
            })
        
        return slow_queries
    except Exception as e:
        logger.warning(f"Could not analyze slow queries: {e}")
        return []


async def suggest_indexes(db: AsyncIOMotorDatabase, collection_name: str) -> list:
    """Suggest indexes based on query patterns"""
    suggestions = []
    
    try:
        collection = db[collection_name]
        
        # Get current indexes
        current_indexes = await collection.index_information()
        indexed_fields = set()
        for idx_info in current_indexes.values():
            for field, _ in idx_info.get("key", []):
                indexed_fields.add(field)
        
        # Analyze explain plans for common queries
        # This would require tracking actual queries in production
        
        # Basic suggestions based on collection type
        common_fields = {
            "users": ["email", "organization_id", "created_at"],
            "dashboards": ["user_id", "organization_id", "is_public", "created_at"],
            "data_sources": ["user_id", "type", "created_at"],
            "submissions": ["dataset_id", "created_at"]
        }
        
        if collection_name in common_fields:
            for field in common_fields[collection_name]:
                if field not in indexed_fields:
                    suggestions.append({
                        "field": field,
                        "reason": f"Common query field '{field}' is not indexed",
                        "command": f'db.{collection_name}.createIndex({{"{field}": 1}})'
                    })
        
    except Exception as e:
        logger.error(f"Error suggesting indexes: {e}")
    
    return suggestions
