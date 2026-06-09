from uuid import uuid4

from app.core.exceptions import api_http_exception
from app.db.pool import get_db_connection
from app.repositories.surveys import (
    create_survey,
    get_survey_by_id,
    get_survey_results as repo_get_survey_results,
    insert_answer,
    list_options_by_survey_id,
    list_questions_by_survey_id,
    list_surveys_by_user_id,
    publish_survey,
    replace_survey_content,
)
from app.schemas.surveys import (
    OptionResult,
    QuestionResult,
    SurveyCreate,
    SurveyDetail,
    SurveyOption,
    SurveyQuestion,
    SurveyResponseCreate,
    SurveyResponseResult,
    SurveyResultsDetail,
    SurveySummary,
    SurveyUpdate,

)


# ── Внутренние хелперы ───────────────────────────────────────────────────────

def _build_detail(survey: dict, questions: list[dict], options: list[dict]) -> SurveyDetail:
    options_by_question: dict[int, list[SurveyOption]] = {}
    for option in options:
        options_by_question.setdefault(option["question_id"], []).append(
            SurveyOption(
                option_id=option["option_id"],
                text=option["text"],
                order_priority=option["order_priority"],
            )
        )

    return SurveyDetail(
        survey_id=survey["survey_id"],
        title=survey["title"],
        description=survey["description"],
        status=survey["status"],
        published_at=survey["published_at"],
        response_count=survey.get("response_count", 0),
        question_count=survey.get("question_count", len(questions)),
        questions=[
            SurveyQuestion(
                question_id=q["question_id"],
                content=q["content"],
                type=q["type"],
                is_required=q["is_required"],
                order_priority=q["order_priority"],
                options=options_by_question.get(q["question_id"], []),
            )
            for q in questions
        ],
    )


def _build_summary(survey: dict) -> SurveySummary:
    return SurveySummary(
        survey_id=survey["survey_id"],
        title=survey["title"],
        description=survey.get("description"),
        status=survey["status"],
        published_at=survey["published_at"],
        response_count=survey.get("response_count", 0),
        question_count=survey.get("question_count", 0),
    )


def _get_owned_survey(connection, *, survey_id: int, user_id: int) -> dict:
    """Возвращает опрос если он существует и принадлежит user_id, иначе 404."""
    survey = get_survey_by_id(connection, survey_id)
    if survey is None or survey["user_id"] != user_id:
        raise api_http_exception(404, "Not Found", "Опрос не найден")
    return survey


# ── Публичные сервисные функции ──────────────────────────────────────────────

def list_user_surveys(user_id: int) -> list[SurveySummary]:
    with get_db_connection() as connection:
        surveys = list_surveys_by_user_id(connection, user_id)
    return [_build_summary(s) for s in surveys]


def create_user_survey(user_id: int, payload: SurveyCreate) -> SurveyDetail:
    with get_db_connection() as connection:
        survey = create_survey(
            connection,
            user_id=user_id,
            title=payload.title,
            description=payload.description,
        )
        survey["question_count"] = 0
        survey["response_count"] = 0
    return _build_detail(survey, [], [])


def get_user_survey(user_id: int, survey_id: int) -> SurveyDetail:
    with get_db_connection() as connection:
        survey = _get_owned_survey(connection, survey_id=survey_id, user_id=user_id)
        questions = list_questions_by_survey_id(connection, survey_id)
        options = list_options_by_survey_id(connection, survey_id)
    return _build_detail(survey, questions, options)


def update_user_survey(user_id: int, survey_id: int, payload: SurveyUpdate) -> SurveyDetail:
    # Нормализуем вопросы в формат репозитория
    question_dicts = [
        {
            "content": q.content,
            "type": q.type,
            "is_required": q.is_required,
            "order_priority": idx,
            "options": [
                {"text": opt.text, "order_priority": opt_idx}
                for opt_idx, opt in enumerate(q.options)
            ],
        }
        for idx, q in enumerate(payload.questions)
    ]

    with get_db_connection() as connection:
        _get_owned_survey(connection, survey_id=survey_id, user_id=user_id)
        replace_survey_content(
            connection,
            survey_id=survey_id,
            title=payload.title,
            description=payload.description,
            questions=question_dicts,
        )
        # Перечитываем свежие данные после замены
        survey = get_survey_by_id(connection, survey_id)
        questions = list_questions_by_survey_id(connection, survey_id)
        options = list_options_by_survey_id(connection, survey_id)

    return _build_detail(survey, questions, options)


def publish_user_survey(user_id: int, survey_id: int) -> SurveyDetail:
    with get_db_connection() as connection:
        _get_owned_survey(connection, survey_id=survey_id, user_id=user_id)
        questions = list_questions_by_survey_id(connection, survey_id)
        if not questions:
            raise api_http_exception(400, "Bad Request", "Нельзя опубликовать опрос без вопросов")

        survey = publish_survey(connection, survey_id)
        options = list_options_by_survey_id(connection, survey_id)
        survey["question_count"] = len(questions)
        survey["response_count"] = 0

    return _build_detail(survey, questions, options)

def delete_user_survey(user_id: int, survey_id: int) -> None:
    with get_db_connection() as connection:
        _get_owned_survey(connection, survey_id=survey_id, user_id=user_id)
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM surveys WHERE survey_id = %s", (survey_id,))

def get_public_survey(survey_id: int) -> SurveyDetail:
    with get_db_connection() as connection:
        survey = get_survey_by_id(connection, survey_id)
        if survey is None or survey["status"] != "published":
            raise api_http_exception(404, "Not Found", "Опрос не найден")
        questions = list_questions_by_survey_id(connection, survey_id)
        options = list_options_by_survey_id(connection, survey_id)
    return _build_detail(survey, questions, options)


def submit_public_response(survey_id: int, payload: SurveyResponseCreate) -> SurveyResponseResult:
    session_id = payload.session_id or uuid4()

    with get_db_connection() as connection:
        survey = get_survey_by_id(connection, survey_id)
        if survey is None or survey["status"] != "published":
            raise api_http_exception(404, "Not Found", "Опрос не найден")

        questions = list_questions_by_survey_id(connection, survey_id)
        options = list_options_by_survey_id(connection, survey_id)
        question_map = {q["question_id"]: q for q in questions}
        options_by_question: dict[int, set[int]] = {}
        for opt in options:
            options_by_question.setdefault(opt["question_id"], set()).add(opt["option_id"])

        for answer in payload.answers:
            if answer.question_id not in question_map:
                raise api_http_exception(400, "Bad Request", "Некорректный вопрос")

        answers_by_question = {a.question_id: a for a in payload.answers}
        accepted_answers = 0

        for question in questions:
            answer = answers_by_question.get(question["question_id"])
            if answer is None:
                if question["is_required"]:
                    raise api_http_exception(400, "Bad Request", "Заполните обязательные вопросы")
                continue

            if question["type"] == "text":
                text_answer = (answer.text_answer or "").strip()
                if question["is_required"] and not text_answer:
                    raise api_http_exception(400, "Bad Request", "Заполните обязательные вопросы")
                if text_answer:
                    insert_answer(
                        connection,
                        session_id=session_id,
                        question_id=question["question_id"],
                        option_id=None,
                        text_answer=text_answer,
                    )
                    accepted_answers += 1
                continue

            selected_option_ids = list(dict.fromkeys(answer.option_ids))
            if question["type"] == "single" and len(selected_option_ids) > 1:
                raise api_http_exception(400, "Bad Request", "Можно выбрать только один вариант")
            if question["is_required"] and not selected_option_ids:
                raise api_http_exception(400, "Bad Request", "Заполните обязательные вопросы")

            valid_ids = options_by_question.get(question["question_id"], set())
            for option_id in selected_option_ids:
                if option_id not in valid_ids:
                    raise api_http_exception(400, "Bad Request", "Некорректный вариант ответа")
                insert_answer(
                    connection,
                    session_id=session_id,
                    question_id=question["question_id"],
                    option_id=option_id,
                    text_answer=None,
                )
                accepted_answers += 1

    return SurveyResponseResult(session_id=session_id, accepted_answers=accepted_answers)


def get_survey_results(user_id: int, survey_id: int) -> SurveyResultsDetail:
    with get_db_connection() as connection:
        survey = _get_owned_survey(connection, survey_id=survey_id, user_id=user_id)
        raw = repo_get_survey_results(connection, survey_id)

    # Собираем структуру вопросов из choice_rows
    questions_map: dict[int, QuestionResult] = {}
    for row in raw["choice_rows"]:
        qid = row["question_id"]
        if qid not in questions_map:
            questions_map[qid] = QuestionResult(
                question_id=qid,
                content=row["content"],
                type=row["type"],
                order_priority=row["order_priority"],
            )
        if row["option_id"] is not None:
            questions_map[qid].options.append(
                OptionResult(
                    option_id=row["option_id"],
                    text=row["option_text"],
                    vote_count=row["vote_count"],
                )
            )

    # Добавляем текстовые ответы
    for row in raw["text_rows"]:
        qid = row["question_id"]
        if qid not in questions_map:
            questions_map[qid] = QuestionResult(
                question_id=qid,
                content=row["content"],
                type=row["type"],
                order_priority=row["order_priority"],
            )
        if row["text_answer"]:
            questions_map[qid].text_answers.append(row["text_answer"])

    sorted_questions = sorted(questions_map.values(), key=lambda q: q.order_priority)

    return SurveyResultsDetail(
        survey_id=survey["survey_id"],
        title=survey["title"],
        response_count=raw["response_count"],
        questions=sorted_questions,
    )
