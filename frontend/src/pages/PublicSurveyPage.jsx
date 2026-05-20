import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getPublicSurvey, submitSurveyResponse } from "../api/surveys";
import { IconCircle, IconCircleCheck, IconReload, IconSquare, IconSquareCheck } from "../components/icons";
import "./PublicSurveyPage.css";

function buildInitialAnswers(questions) {
  return questions.reduce((accumulator, question) => {
    accumulator[question.questionID] = question.type === "text" ? "" : [];
    return accumulator;
  }, {});
}

function PublicSurveyPage() {
  const { surveyID } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const loadSurvey = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getPublicSurvey(surveyID);
      setSurvey(response);
      setAnswers(buildInitialAnswers(response.questions || []));
    } catch (requestError) {
      setError(requestError.payload?.message || "Опрос недоступен");
    } finally {
      setLoading(false);
    }
  }, [surveyID]);

  useEffect(() => {
    let active = true;

    const loadInitialSurvey = async () => {
      try {
        const response = await getPublicSurvey(surveyID);
        if (active) {
          setSurvey(response);
          setAnswers(buildInitialAnswers(response.questions || []));
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.payload?.message || "Опрос недоступен");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialSurvey();

    return () => {
      active = false;
    };
  }, [surveyID]);

  const answerPayload = useMemo(() => {
    if (!survey) {
      return [];
    }

    return survey.questions.map((question) => {
      const value = answers[question.questionID];
      if (question.type === "text") {
        return { questionID: question.questionID, textAnswer: value || "" };
      }

      return { questionID: question.questionID, optionIDs: value || [] };
    });
  }, [answers, survey]);

  const toggleOption = (question, optionID) => {
    setAnswers((current) => {
      const selected = current[question.questionID] || [];
      if (question.type === "single") {
        return { ...current, [question.questionID]: [optionID] };
      }

      return {
        ...current,
        [question.questionID]: selected.includes(optionID)
          ? selected.filter((selectedID) => selectedID !== optionID)
          : [...selected, optionID],
      };
    });
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await submitSurveyResponse(surveyID, { answers: answerPayload });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.payload?.message || "Не удалось отправить ответы");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page loading-page">
        <div className="loading-frame">
          <div className="spinner" />
          <p className="text-body">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="page public-page">
        <div className="frame public-message">
          <p className="text-h2">{error}</p>
          <button type="button" className="button-primary public-retry" onClick={loadSurvey}>
            <IconReload className="icon-secondary" color="#FFFFFF" />
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page public-page">
        <div className="frame public-message">
          <h1 className="text-h1">Спасибо</h1>
          <p className="text-body">Ответы отправлены.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page public-page">
      <form className="public-form" onSubmit={submit}>
        <section className="frame public-hero">
          <h1 className="text-h1">{survey.title}</h1>
          {survey.description ? <p className="text-body">{survey.description}</p> : null}
        </section>

        {error ? <div className="form-error">{error}</div> : null}

        {survey.questions.map((question, index) => (
          <section className="frame public-question" key={question.questionID}>
            <div className="public-question-title">
              <span className="public-question-index">{index + 1}</span>
              <h2 className="text-h2">
                {question.content}
                {question.isRequired ? <span className="required-star"> *</span> : null}
              </h2>
            </div>

            {question.type === "text" ? (
              <textarea
                className="public-text-answer"
                value={answers[question.questionID] || ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.questionID]: event.target.value }))}
                rows={4}
                placeholder="Ваш ответ"
              />
            ) : (
              <div className="public-options">
                {question.options.map((option) => {
                  const selected = (answers[question.questionID] || []).includes(option.optionID);
                  const SelectedIcon = question.type === "single" ? IconCircleCheck : IconSquareCheck;
                  const EmptyIcon = question.type === "single" ? IconCircle : IconSquare;

                  return (
                    <button
                      type="button"
                      className={`public-option ${selected ? "selected" : ""}`}
                      key={option.optionID}
                      onClick={() => toggleOption(question, option.optionID)}
                    >
                      {selected ? <SelectedIcon className="icon-secondary" /> : <EmptyIcon className="icon-secondary" />}
                      <span>{option.text}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ))}

        <button type="submit" className="button-primary public-submit" disabled={submitting}>
          {submitting ? "Отправка..." : "Отправить"}
        </button>
      </form>
    </div>
  );
}

export default PublicSurveyPage;
