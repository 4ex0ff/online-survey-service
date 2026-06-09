from uuid import UUID
from psycopg2.extras import RealDictCursor


def list_surveys_by_user_id(connection, user_id: int) -> list[dict]:
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
                COUNT(DISTINCT a.session_id)  AS response_count
            FROM surveys s
            LEFT JOIN questions q ON q.survey_id = s.survey_id
            LEFT JOIN answers   a ON a.question_id = q.question_id
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
            RETURNING survey_id, user_id, title, description, status, published_at
            """,
            (user_id, title, description),
        )
        return cursor.fetchone()


def get_survey_by_id(connection, survey_id: int) -> dict | None:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT survey_id, user_id, title, description, status, published_at
            FROM surveys
            WHERE survey_id = %s
            """,
            (survey_id,),
        )
        return cursor.fetchone()


def list_questions_by_survey_id(connection, survey_id: int) -> list[dict]:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT question_id, survey_id, type, content, order_priority, is_required
            FROM questions
            WHERE survey_id = %s
            ORDER BY order_priority ASC
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
            ORDER BY q.order_priority ASC, o.order_priority ASC
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
            SET title = %s, description = %s, updated_at = CURRENT_TIMESTAMP
            WHERE survey_id = %s
            RETURNING survey_id, user_id, title, description, status, published_at
            """,
            (title, description, survey_id),
        )
        survey = cursor.fetchone()

        cursor.execute("DELETE FROM questions WHERE survey_id = %s", (survey_id,))

        for question in questions:
            cursor.execute(
                """
                INSERT INTO questions (survey_id, type, content, order_priority, is_required)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING question_id
                """,
                (
                    survey_id,
                    question["type"],
                    question["content"],
                    question["order_priority"],
                    question["is_required"],
                ),
            )
            question_id = cursor.fetchone()["question_id"]

            for option in question.get("options", []):
                cursor.execute(
                    """
                    INSERT INTO options (question_id, text, order_priority)
                    VALUES (%s, %s, %s)
                    """,
                    (question_id, option["text"], option["order_priority"]),
                )

        return survey


def publish_survey(connection, survey_id: int) -> dict:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            UPDATE surveys
            SET status = 'published',
                published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
                opened_at    = COALESCE(opened_at,    CURRENT_TIMESTAMP),
                updated_at   = CURRENT_TIMESTAMP
            WHERE survey_id = %s
            RETURNING survey_id, user_id, title, description, status, published_at
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


def get_survey_results(connection, survey_id: int) -> dict:
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT
                q.question_id,
                q.content,
                q.type,
                q.order_priority,
                o.option_id,
                o.text AS option_text,
                COUNT(a.answer_id) AS vote_count
            FROM questions q
            LEFT JOIN options o ON o.question_id = q.question_id
            LEFT JOIN answers a ON a.option_id = o.option_id
            WHERE q.survey_id = %s
            GROUP BY q.question_id, q.content, q.type, q.order_priority,
                     o.option_id, o.text
            ORDER BY q.order_priority ASC, o.order_priority ASC
            """,
            (survey_id,),
        )
        choice_rows = cursor.fetchall()

        cursor.execute(
            """
            SELECT
                q.question_id,
                q.content,
                q.type,
                q.order_priority,
                a.text_answer
            FROM questions q
            JOIN answers a ON a.question_id = q.question_id
            WHERE q.survey_id = %s AND q.type = 'text' AND a.text_answer IS NOT NULL
            ORDER BY q.order_priority ASC
            """,
            (survey_id,),
        )
        text_rows = cursor.fetchall()

        cursor.execute(
            """
            SELECT COUNT(DISTINCT a.session_id) AS response_count
            FROM questions q
            JOIN answers a ON a.question_id = q.question_id
            WHERE q.survey_id = %s
            """,
            (survey_id,),
        )
        count_row = cursor.fetchone()
        response_count = count_row["response_count"] if count_row else 0

    return {
        "choice_rows": [dict(r) for r in choice_rows],
        "text_rows": [dict(r) for r in text_rows],
        "response_count": response_count,
    }
