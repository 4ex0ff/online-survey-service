from fastapi import APIRouter, Depends, status
from uuid import UUID
from app.api.deps import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.surveys import (
    SurveyCreate,
    SurveyDetail,
    SurveyResponseCreate,
    SurveyResponseResult,
    SurveySummary,
    SurveyUpdate,
)
from app.services.surveys import (
    create_user_survey,
    get_public_survey,
    get_user_survey,
    list_user_surveys,
    publish_user_survey,
    submit_public_response,
    update_user_survey,
)

router = APIRouter()


@router.get("", response_model=list[SurveySummary])
def get_surveys(current_user: AuthenticatedUser = Depends(get_current_user)) -> list[SurveySummary]:
    return list_user_surveys(current_user.user_id)


@router.post("", response_model=SurveyDetail, status_code=status.HTTP_201_CREATED)
def post_survey(
    payload: SurveyCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SurveyDetail:
    return create_user_survey(current_user.user_id, payload)


@router.get("/{survey_id}", response_model=SurveyDetail)
def get_survey(
    survey_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SurveyDetail:
    return get_user_survey(current_user.user_id, survey_id)


@router.put("/{survey_id}", response_model=SurveyDetail)
def put_survey(
    survey_id: int,
    payload: SurveyUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SurveyDetail:
    return update_user_survey(current_user.user_id, survey_id, payload)


@router.post("/{survey_id}/publish", response_model=SurveyDetail)
def post_publish_survey(
    survey_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SurveyDetail:
    return publish_user_survey(current_user.user_id, survey_id)


@router.get("/public/{survey_id}", response_model=SurveyDetail)
def get_public_survey_route(survey_id: int) -> SurveyDetail:
    return get_public_survey(survey_id)


@router.post("/public/{survey_id}/responses", response_model=SurveyResponseResult, status_code=status.HTTP_201_CREATED)
def post_public_response(survey_id: int, payload: SurveyResponseCreate) -> SurveyResponseResult:
    return submit_public_response(survey_id, payload)

@router.get("/{survey_id}/analytics")
def get_survey_analytics_route(
    survey_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    from app.services.surveys import get_survey_analytics
    return get_survey_analytics(current_user.user_id, survey_id)