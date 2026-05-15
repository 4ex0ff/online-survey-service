from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field, field_validator, model_validator

from app.schemas.base import AppModel

QuestionType = Literal["single", "multiple", "text"]


class SurveySummary(AppModel):
    survey_id: int = Field(serialization_alias="surveyID")
    title: str
    description: str | None = None
    status: str
    published_at: datetime | None = Field(default=None, serialization_alias="publishedAt")
    response_count: int = Field(default=0, serialization_alias="responseCount")
    question_count: int = Field(default=0, serialization_alias="questionCount")


class SurveyOption(AppModel):
    option_id: int = Field(serialization_alias="optionID")
    text: str
    order_priority: int = Field(serialization_alias="orderPriority")


class SurveyQuestion(AppModel):
    question_id: int = Field(serialization_alias="questionID")
    content: str
    type: QuestionType
    is_required: bool = Field(serialization_alias="isRequired")
    order_priority: int = Field(serialization_alias="orderPriority")
    options: list[SurveyOption] = []


class SurveyDetail(SurveySummary):
    questions: list[SurveyQuestion] = []


class SurveyOptionInput(AppModel):
    text: str = Field(min_length=1, max_length=500)


class SurveyQuestionInput(AppModel):
    content: str = Field(min_length=1, max_length=2000)
    type: QuestionType
    is_required: bool = Field(default=True, alias="isRequired")
    options: list[SurveyOptionInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_options_for_type(self):
        if self.type in {"single", "multiple"} and len(self.options) < 2:
            raise ValueError("Choice questions require at least two options")
        if self.type == "text" and self.options:
            raise ValueError("Text questions cannot have options")
        return self


class SurveyCreate(AppModel):
    title: str = Field(default="Новый опрос", min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)


class SurveyUpdate(AppModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    questions: list[SurveyQuestionInput] = Field(default_factory=list)

    @field_validator("questions")
    @classmethod
    def validate_questions_count(cls, questions: list[SurveyQuestionInput]) -> list[SurveyQuestionInput]:
        if len(questions) > 50:
            raise ValueError("Survey cannot contain more than 50 questions")
        return questions


class SurveyAnswerInput(AppModel):
    question_id: int = Field(alias="questionID")
    option_ids: list[int] = Field(default_factory=list, alias="optionIDs")
    text_answer: str | None = Field(default=None, alias="textAnswer", max_length=5000)


class SurveyResponseCreate(AppModel):
    session_id: UUID | None = Field(default=None, alias="sessionID")
    answers: list[SurveyAnswerInput] = Field(min_length=1)


class SurveyResponseResult(AppModel):
    session_id: UUID = Field(serialization_alias="sessionID")
    accepted_answers: int = Field(serialization_alias="acceptedAnswers")
