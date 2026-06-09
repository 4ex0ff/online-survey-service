from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.surveys import (
    SurveyCreate,
    SurveyDetail,
    SurveyResponseCreate,
    SurveyResponseResult,
    SurveyResultsDetail,
    SurveySummary,
    SurveyUpdate,
)
from app.services.surveys import (
    create_user_survey,
    delete_user_survey,
    get_public_survey,
    get_survey_results,
    get_user_survey,
    list_user_surveys,
    publish_user_survey,
    submit_public_response,
    update_user_survey,
)

router = APIRouter()

# ============================================================
# ПУБЛИЧНЫЕ маршруты — ОБЯЗАТЕЛЬНО до /{survey_id}
# иначе FastAPI матчит строку "public" как survey_id → 405/422
# ============================================================

@router.get("/public/{survey_id}", response_model=SurveyDetail)
def get_public_survey_route(survey_id: int) -> SurveyDetail:
    """Получить опубликованный опрос (без авторизации)"""
    return get_public_survey(survey_id)


@router.post(
    "/public/{survey_id}/responses",
    response_model=SurveyResponseResult,
    status_code=status.HTTP_201_CREATED,
)
def post_public_response(
    survey_id: int, payload: SurveyResponseCreate
) -> SurveyResponseResult:
    """Отправить ответы на опрос (без авторизации)"""
    return submit_public_response(survey_id, payload)


# ============================================================
# ЗАЩИЩЁННЫЕ маршруты
# ============================================================

@router.get("", response_model=list[SurveySummary])
def get_surveys(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[SurveySummary]:
    """Получить все опросы текущего пользователя"""
    return list_user_surveys(current_user.user_id)


@router.post("", response_model=SurveyDetail, status_code=status.HTTP_201_CREATED)
def post_survey(
    payload: SurveyCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SurveyDetail:
    """Создать новый опрос"""
    return create_user_survey(current_user.user_id, payload)


@router.get("/{survey_id}", response_model=SurveyDetail)
def get_survey(
    survey_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SurveyDetail:
    """Получить опрос по ID (только автор)"""
    return get_user_survey(current_user.user_id, survey_id)


@router.put("/{survey_id}", response_model=SurveyDetail)
def put_survey(
    survey_id: int,
    payload: SurveyUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SurveyDetail:
    """Обновить черновик опроса"""
    return update_user_survey(current_user.user_id, survey_id, payload)

@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_survey(
    survey_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> None:
    """Удалить опрос"""
    delete_user_survey(current_user.user_id, survey_id)


@router.post("/{survey_id}/publish", response_model=SurveyDetail)
def post_publish_survey(
    survey_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SurveyDetail:
    """Опубликовать опрос"""
    return publish_user_survey(current_user.user_id, survey_id)


@router.get("/{survey_id}/results", response_model=SurveyResultsDetail)
def get_survey_results_route(
    survey_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SurveyResultsDetail:
    """Получить результаты опроса (только автор)"""
    return get_survey_results(current_user.user_id, survey_id)
