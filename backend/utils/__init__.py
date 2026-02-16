# Utils package
"""
DataViz Studio Backend Utilities
"""
from .cache import (
    CacheManager,
    cached,
    get_redis,
    close_redis,
    cache_dashboard_data,
    get_cached_dashboard,
    cache_chart_data,
    get_cached_chart,
    cache_query_result,
    get_cached_query,
    CACHE_TTL
)

from .pagination import (
    PaginationParams,
    PaginatedResponse,
    paginate_mongodb,
    paginate_list,
    paginate_dataframe,
    StreamingPaginator,
    get_pagination_links
)

from .tasks import (
    celery_app,
    TaskStatus,
    process_large_dataset,
    generate_report_pdf,
    aggregate_large_dataset,
    sync_database_connection,
    batch_export_data,
    get_task_status,
    cancel_task
)

from .indexes import (
    create_indexes,
    get_index_stats,
    analyze_slow_queries,
    suggest_indexes
)

__all__ = [
    # Cache
    "CacheManager",
    "cached",
    "get_redis",
    "close_redis",
    "cache_dashboard_data",
    "get_cached_dashboard",
    "cache_chart_data",
    "get_cached_chart",
    "cache_query_result",
    "get_cached_query",
    "CACHE_TTL",
    # Pagination
    "PaginationParams",
    "PaginatedResponse",
    "paginate_mongodb",
    "paginate_list",
    "paginate_dataframe",
    "StreamingPaginator",
    "get_pagination_links",
    # Tasks
    "celery_app",
    "TaskStatus",
    "process_large_dataset",
    "generate_report_pdf",
    "aggregate_large_dataset",
    "sync_database_connection",
    "batch_export_data",
    "get_task_status",
    "cancel_task",
    # Indexes
    "create_indexes",
    "get_index_stats",
    "analyze_slow_queries",
    "suggest_indexes",
]