import { request } from "./client";

export function getSurveys(token) {
  return request("/api/surveys", {
    token,
  });
}

export function createSurvey(token, payload) {
  return request("/api/surveys", {
    method: "POST",
    token,
    body: payload,
  });
}

export function getSurvey(token, surveyID) {
  return request(`/api/surveys/${surveyID}`, {
    token,
  });
}

export function updateSurvey(token, surveyID, payload) {
  return request(`/api/surveys/${surveyID}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteSurvey(token, surveyID) {
  return request(`/api/surveys/${surveyID}`, {
    method: "DELETE",
    token,
  });
}

export function publishSurvey(token, surveyID) {
  return request(`/api/surveys/${surveyID}/publish`, {
    method: "POST",
    token,
  });
}

export function getPublicSurvey(surveyID) {
  return request(`/api/surveys/public/${surveyID}`);
}

export function submitSurveyResponse(surveyID, payload) {
  return request(`/api/surveys/public/${surveyID}/responses`, {
    method: "POST",
    body: payload,
  });
}