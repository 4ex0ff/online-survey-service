from uuid import UUID

from psycopg2.extras import RealDictCursor


def list_surveys_by_user_id(connection, user_id: int) -> list[dict]:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT
                s.survey_id,
                s.title,
                s.description,
                s.status,
                s.published_at,
                COUNT(DISTINCT q.question_id) AS question_count,
                COUNT(DISTINCT a.session_id) AS response_count
            FROM surveys s
            LEFT JOIN questions q ON q.survey_id = s.survey_id
            LEFT JOIN answers a ON a.question_id = q.question_id
            WHERE s.user_id = %s
            GROUP BY s.survey_id
            ORDER BY s.created_at DESC, s.survey_id DESC
            """,
            (user_id,),
        )
        return list(cursor.fetchall())


def create_survey(connection, *, user_id: int, title: str, description: str | None) -> dict:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            INSERT INTO surveys (user_id, title, description)
            VALUES (%s, %s, %s)
            RETURNING survey_id, title, description, status, published_at
            """,
            (user_id, title, description),
        )
        return cursor.fetchone()


def get_survey_by_id(connection, survey_id: int) -> dict | None:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT
                s.survey_id,
                s.user_id,
                s.title,
                s.description,
                s.status,
                s.published_at,
                COUNT(DISTINCT q.question_id) AS question_count,
                COUNT(DISTINCT a.session_id) AS response_count
            FROM surveys s
            LEFT JOIN questions q ON q.survey_id = s.survey_id
            LEFT JOIN answers a ON a.question_id = q.question_id
            WHERE s.survey_id = %s
            GROUP BY s.survey_id
            """,
            (survey_id,),
        )
        return cursor.fetchone()


def list_questions_by_survey_id(connection, survey_id: int) -> list[dict]:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT question_id, survey_id, content, type, is_required, order_priority
            FROM questions
            WHERE survey_id = %s
            ORDER BY order_priority, question_id
            """,
            (survey_id,),
        )
        return list(cursor.fetchall())


def list_options_by_survey_id(connection, survey_id: int) -> list[dict]:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT o.option_id, o.question_id, o.text, o.order_priority
            FROM options o
            JOIN questions q ON q.question_id = o.question_id
            WHERE q.survey_id = %s
            ORDER BY o.order_priority, o.option_id
            """,
            (survey_id,),
        )
        return list(cursor.fetchall())


def replace_survey_content(
    connection,
    *,
    survey_id: int,
    title: str,
    description: str | None,
    questions: list[dict],
) -> dict:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            UPDATE surveys
            SET title = %s, description = %s, status = 'draft', published_at = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE survey_id = %s
            RETURNING survey_id, title, description, status, published_at
            """,
            (title, description, survey_id),
        )
        survey = cursor.fetchone()

        cursor.execute("DELETE FROM questions WHERE survey_id = %s", (survey_id,))

        for question_index, question in enumerate(questions):
            cursor.execute(
                """
                INSERT INTO questions (survey_id, content, type, is_required, order_priority)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING question_id
                """,
                (
                    survey_id,
                    question["content"],
                    question["type"],
                    question["is_required"],
                    question_index,
                ),
            )
            question_id = cursor.fetchone()["question_id"]

            for option_index, option in enumerate(question["options"]):
                cursor.execute(
                    """
                    INSERT INTO options (question_id, text, order_priority)
                    VALUES (%s, %s, %s)
                    """,
                    (question_id, option["text"], option_index),
                )

        return survey


def publish_survey(connection, survey_id: int) -> dict:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            UPDATE surveys
            SET status = 'published',
                published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
                opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP),
                updated_at = CURRENT_TIMESTAMP
            WHERE survey_id = %s
            RETURNING survey_id, title, description, status, published_at
            """,
            (survey_id,),
        )
        return cursor.fetchone()


def insert_answer(
    connection,
    *,
    session_id: UUID,
    question_id: int,
    option_id: int | None,
    text_answer: str | None,
    user_id: int | None = None,
) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO answers (session_id, question_id, option_id, text_answer, user_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (str(session_id), question_id, option_id, text_answer, user_id),
        )
