import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../api/client";
import { getSurvey, publishSurvey, updateSurvey } from "../api/surveys";
import { IconArrowLeft, IconCircle, IconReload, IconSquare, IconTextLong, IconTrash } from "../components/icons";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { useAuth } from "../providers/useAuth";
import "./SurveyBuilderPage.css";

const QUESTION_TYPES = [
  { value: "single", label: "Один вариант", icon: IconCircle },
  { value: "multiple", label: "Несколько", icon: IconSquare },
  { value: "text", label: "Текст", icon: IconTextLong },
];

function createQuestion(type = "single") {
  return {
    localID: crypto.randomUUID(),
    content: "",
    type,
    isRequired: true,
    options: type === "text" ? [] : [{ text: "Вариант 1" }, { text: "Вариант 2" }],
  };
}

function normalizeSurvey(survey) {
  return {
    title: survey.title || "",
    description: survey.description || "",
    status: survey.status,
    publishedAt: survey.publishedAt,
    questions: (survey.questions || []).map((question) => ({
      localID: String(question.questionID),
      content: question.content,
      type: question.type,
      isRequired: question.isRequired,
      options: (question.options || []).map((option) => ({ text: option.text })),
    })),
  };
}

function SurveyBuilderPage() {
  const { surveyID } = useParams();
  const navigate = useNavigate();
  const { token, signOut } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const publicUrl = useMemo(() => `${window.location.origin}/s/${surveyID}`, [surveyID]);

  const handleUnauthorized = useCallback(() => {
    signOut();
    navigate("/login", { replace: true });
  }, [navigate, signOut]);

  const loadSurvey = useCallback(async () => {
    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSurvey(normalizeSurvey(await getSurvey(token, surveyID)));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        handleUnauthorized();
        return;
      }
      setError("Не удалось открыть опрос");
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, surveyID, token]);

  useEffect(() => {
    let active = true;

    if (!token) {
      handleUnauthorized();
      return undefined;
    }

    const loadInitialSurvey = async () => {
      try {
        const response = await getSurvey(token, surveyID);
        if (active) {
          setSurvey(normalizeSurvey(response));
        }
      } catch (requestError) {
        if (!active) {
          return;
        }
        if (requestError instanceof ApiError && requestError.status === 401) {
          handleUnauthorized();
          return;
        }
        setError("Не удалось открыть опрос");
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
  }, [handleUnauthorized, surveyID, token]);

  const patchSurvey = (patch) => {
    setSurvey((current) => ({ ...current, ...patch }));
    setNotice("");
  };

  const patchQuestion = (localID, patch) => {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.map((question) => (
        question.localID === localID ? { ...question, ...patch } : question
      )),
    }));
    setNotice("");
  };

  const handleQuestionTypeChange = (localID, nextType) => {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.localID !== localID) {
          return question;
        }

        return {
          ...question,
          type: nextType,
          options: nextType === "text" ? [] : question.options.length >= 2 ? question.options : [{ text: "Вариант 1" }, { text: "Вариант 2" }],
        };
      }),
    }));
  };

  const patchOption = (questionID, optionIndex, text) => {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.localID !== questionID) {
          return question;
        }

        return {
          ...question,
          options: question.options.map((option, index) => (index === optionIndex ? { text } : option)),
        };
      }),
    }));
    setNotice("");
  };

  const addOption = (questionID) => {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.map((question) => (
        question.localID === questionID
          ? { ...question, options: [...question.options, { text: `Вариант ${question.options.length + 1}` }] }
          : question
      )),
    }));
  };

  const removeOption = (questionID, optionIndex) => {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.localID !== questionID || question.options.length <= 2) {
          return question;
        }

        return {
          ...question,
          options: question.options.filter((_, index) => index !== optionIndex),
        };
      }),
    }));
  };

  const addQuestion = (type) => {
    setSurvey((current) => ({
      ...current,
      questions: [...current.questions, createQuestion(type)],
    }));
  };

  const removeQuestion = (localID) => {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.filter((question) => question.localID !== localID),
    }));
  };

  const buildPayload = () => ({
    title: survey.title.trim() || "Новый опрос",
    description: survey.description.trim(),
    questions: survey.questions.map((question) => ({
      content: question.content.trim(),
      type: question.type,
      isRequired: question.isRequired,
      options: question.type === "text" ? [] : question.options.map((option) => ({ text: option.text.trim() })),
    })),
  });

  const saveSurvey = async () => {
    if (!token) {
      handleUnauthorized();
      return null;
    }

    try {
      setSaving(true);
      setError("");
      const saved = await updateSurvey(token, surveyID, buildPayload());
      setSurvey(normalizeSurvey(saved));
      setNotice("Сохранено");
      return saved;
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        handleUnauthorized();
        return null;
      }
      setError(requestError.payload?.message || "Не удалось сохранить опрос");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const saved = await saveSurvey();
    if (!saved) {
      return;
    }

    try {
      setPublishing(true);
      setError("");
      const published = await publishSurvey(token, surveyID);
      setSurvey(normalizeSurvey(published));
      setNotice("Опубликовано");
    } catch (requestError) {
      setError(requestError.payload?.message || "Не удалось опубликовать опрос");
    } finally {
      setPublishing(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
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
      <div className="page builder-page">
        <Header onLogout={handleLogout} />
        <div className="frame builder-error">
          <p className="text-h2">{error}</p>
          <button type="button" className="button-primary" onClick={loadSurvey}>
            <IconReload className="icon-secondary" color="#FFFFFF" />
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page builder-page">
      <Header title="Конструктор опроса" onLogout={handleLogout} />

      <main className="builder-shell">
        <div className="builder-toolbar">
          <button type="button" className="button-secondary builder-back" onClick={() => navigate("/dashboard")}>
            <IconArrowLeft className="icon-secondary" />
            Назад
          </button>
          <div className="builder-actions">
            {survey.status === "published" ? (
              <button type="button" className="button-secondary builder-link" onClick={() => navigate(`/s/${surveyID}`)}>
                Открыть ссылку
              </button>
            ) : null}
            <button type="button" className="button-secondary" onClick={saveSurvey} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button type="button" className="button-primary" onClick={handlePublish} disabled={saving || publishing}>
              {publishing ? "Публикация..." : "Опубликовать"}
            </button>
          </div>
        </div>

        {error ? <div className="form-error">{error}</div> : null}
        {notice ? <div className="form-success">{notice}</div> : null}

        <section className="frame builder-meta">
          <input
            className="builder-title-input"
            value={survey.title}
            onChange={(event) => patchSurvey({ title: event.target.value })}
            placeholder="Название опроса"
          />
          <textarea
            className="builder-description-input"
            value={survey.description}
            onChange={(event) => patchSurvey({ description: event.target.value })}
            placeholder="Описание"
            rows={3}
          />
          {survey.status === "published" ? (
            <p className="text-helper">Публичная ссылка: {publicUrl}</p>
          ) : null}
        </section>

        <section className="builder-question-types" aria-label="Добавить вопрос">
          {QUESTION_TYPES.map(({ value, label, icon: Icon }) => (
            <button type="button" className="button-tertiary builder-type-button" key={value} onClick={() => addQuestion(value)}>
              <Icon className="icon-secondary" />
              {label}
            </button>
          ))}
        </section>

        <section className="builder-questions">
          {survey.questions.length === 0 ? (
            <div className="frame builder-empty">
              <p className="text-h2">Добавьте первый вопрос</p>
            </div>
          ) : null}

          {survey.questions.map((question, questionIndex) => (
            <article className="frame builder-question" key={question.localID}>
              <div className="builder-question-head">
                <span className="builder-question-index">{questionIndex + 1}</span>
                <input
                  className="builder-question-input"
                  value={question.content}
                  onChange={(event) => patchQuestion(question.localID, { content: event.target.value })}
                  placeholder="Вопрос"
                />
                <select
                  className="builder-type-select"
                  value={question.type}
                  onChange={(event) => handleQuestionTypeChange(question.localID, event.target.value)}
                >
                  {QUESTION_TYPES.map((type) => (
                    <option value={type.value} key={type.value}>{type.label}</option>
                  ))}
                </select>
                <button type="button" className="builder-icon-button" onClick={() => removeQuestion(question.localID)} aria-label="Удалить вопрос">
                  <IconTrash className="icon-secondary" />
                </button>
              </div>

              {question.type === "text" ? (
                <div className="builder-text-preview text-helper">Поле для текстового ответа</div>
              ) : (
                <div className="builder-options">
                  {question.options.map((option, optionIndex) => (
                    <div className="builder-option" key={`${question.localID}-${optionIndex}`}>
                      {question.type === "single" ? <IconCircle className="icon-secondary" /> : <IconSquare className="icon-secondary" />}
                      <input
                        className="builder-option-input"
                        value={option.text}
                        onChange={(event) => patchOption(question.localID, optionIndex, event.target.value)}
                        placeholder={`Вариант ${optionIndex + 1}`}
                      />
                      <button
                        type="button"
                        className="builder-icon-button"
                        onClick={() => removeOption(question.localID, optionIndex)}
                        aria-label="Удалить вариант"
                        disabled={question.options.length <= 2}
                      >
                        <IconTrash className="icon-secondary" />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="button-secondary builder-add-option" onClick={() => addOption(question.localID)}>
                    Добавить вариант
                  </button>
                </div>
              )}

              <label className="builder-required text-small">
                <input
                  type="checkbox"
                  checked={question.isRequired}
                  onChange={(event) => patchQuestion(question.localID, { isRequired: event.target.checked })}
                />
                Обязательный вопрос
              </label>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SurveyBuilderPage;
