from collections.abc import Iterator
from contextlib import contextmanager

from psycopg2.extensions import connection as PsycopgConnection
from psycopg2.pool import SimpleConnectionPool

from app.core.config import get_settings

_connection_pool: SimpleConnectionPool | None = None


def init_db_pool() -> None:
    # Соединения psycopg2 лежат в пуле, потому что открывать новое соединение на каждый запрос дорого.
    global _connection_pool
    if _connection_pool is not None:
        return

    settings = get_settings()
    _connection_pool = SimpleConnectionPool(
        minconn=settings.db_pool_min_size,
        maxconn=settings.db_pool_max_size,
        **settings.resolved_database_config,
    )


def close_db_pool() -> None:
    global _connection_pool
    if _connection_pool is not None:
        _connection_pool.closeall()
        _connection_pool = None


@contextmanager
def get_db_connection() -> Iterator[PsycopgConnection]:
    # Функции репозиториев используют этот context manager: успешные блоки commit, упавшие rollback.
    global _connection_pool
    if _connection_pool is None:
        init_db_pool()

    assert _connection_pool is not None
    connection = _connection_pool.getconn()

    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        _connection_pool.putconn(connection)
