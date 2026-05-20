import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { createSurvey, getSurveys } from "../api/surveys";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { IconFilter, IconMoreVertical, IconReload, IconSearch } from "../components/icons";
import { useAuth } from "../providers/useAuth";
import "./DashboardPage.css";

const STATUS_LABELS = {
  published: "Опубликован",
  draft: "Черновик",
  closed: "Закрыт",
};

function DashboardPage() {
  const navigate = useNavigate();
  const { token, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [surveys, setSurveys] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const handleUnauthorized = useCallback(() => {
    signOut();
    navigate("/login", { replace: true });
  }, [navigate, signOut]);

  const loadSurveys = useCallback(async () => {
    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSurveys(await getSurveys(token));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        handleUnauthorized();
        return;
      }
      setError("Не удалось загрузить опросы");
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, token]);

  useEffect(() => {
    let active = true;

    if (!token) {
      handleUnauthorized();
      return undefined;
    }

    const loadInitialSurveys = async () => {
      try {
        const response = await getSurveys(token);
        if (active) {
          setSurveys(response);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }
        if (requestError instanceof ApiError && requestError.status === 401) {
          handleUnauthorized();
          return;
        }
        setError("Не удалось загрузить опросы");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialSurveys();

    return () => {
      active = false;
    };
  }, [handleUnauthorized, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredSurveys = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();

    return surveys
      .filter((survey) => (filter === "all" ? true : survey.status === filter))
      .filter((survey) => (query ? survey.title.toLowerCase().includes(query) : true));
  }, [debouncedQuery, filter, surveys]);

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  const handleCreate = async () => {
    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setCreating(true);
      setError("");
      const survey = await createSurvey(token, { title: "Новый опрос", description: "" });
      navigate(`/surveys/${survey.surveyID}/edit`);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        handleUnauthorized();
        return;
      }
      setError("Не удалось создать опрос");
    } finally {
      setCreating(false);
    }
  };

  const handleFilterClick = () => {
    const nextFilter = filter === "all" ? "published" : filter === "published" ? "draft" : "all";
    setFilter(nextFilter);
  };

  return (
    <div className="page dashboard-page">
      <Header onLogout={handleLogout} />

      <div className="dashboard-controls">
        <button type="button" className="button-primary dashboard-button-create" onClick={handleCreate} disabled={creating}>
          <span className="dashboard-create-full">{creating ? "Создание..." : "+Создать"}</span>
          <span className="dashboard-create-short">+</span>
        </button>
        <div className="frame dashboard-search-wrapper">
          <IconSearch className="icon-primary" />
          <input
            className="text-body dashboard-search-field"
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="button-tertiary dashboard-button-filter"
          onClick={handleFilterClick}
          title={`Фильтр: ${filter === "all" ? "все" : STATUS_LABELS[filter]}`}
        >
          <IconFilter className="icon-primary" />
        </button>
      </div>

      <div className={`dashboard-surveys-group ${loading || error || filteredSurveys.length === 0 ? "centered" : ""}`}>
        {loading ? (
          <div className="frame dashboard-surveys-loading">
            <div className="dashboard-spinner" />
            <p className="text-h2">Загрузка...</p>
          </div>
        ) : error ? (
          <div className="frame dashboard-surveys-error">
            <p className="text-h2">{error}</p>
            <button type="button" className="button-primary dashboard-button-retry" onClick={loadSurveys}>
              <IconReload className="icon-primary" color="#FFFFFF" />
              <span>Повторить</span>
            </button>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="frame dashboard-surveys-empty dashboard-empty">
            <strong className="text-h2">
              {surveys.length === 0 ? "Пока нет ни одного опроса." : "Не найдено соответствующих опросов"}
            </strong>
          </div>
        ) : (
          <div className="dashboard-surveys-grid">
            {filteredSurveys.map((survey) => (
              <article className="frame dashboard-survey-card" key={survey.surveyID}>
                <div className="dashboard-survey-header">
                  <button
                    type="button"
                    className="dashboard-survey-title-button"
                    onClick={() => navigate(`/surveys/${survey.surveyID}/edit`)}
                  >
                    <h2 className="text-h2 dashboard-survey-title">{survey.title}</h2>
                  </button>
                  <button
                    type="button"
                    className="dashboard-survey-actions"
                    onClick={() => navigate(`/surveys/${survey.surveyID}/edit`)}
                    aria-label="Редактировать опрос"
                  >
                    <IconMoreVertical className="icon-secondary" />
                  </button>
                </div>
                <p className="text-helper dashboard-survey-description">{survey.description || "Без описания"}</p>
                <span className={`text-small survey-status--${survey.status}`}>
                  {STATUS_LABELS[survey.status] || survey.status}
                </span>
                <div className="dashboard-survey-info">
                  <p className="text-small">Вопросов: {survey.questionCount}</p>
                  <p className="text-small">Ответов: {survey.responseCount}</p>
                </div>
                {survey.status === "published" ? (
                  <button
                    type="button"
                    className="button-secondary dashboard-open-public"
                    onClick={() => navigate(`/s/${survey.surveyID}`)}
                  >
                    Открыть
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default DashboardPage;
