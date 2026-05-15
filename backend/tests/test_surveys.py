"""Тесты Survey API для защищённых данных dashboard."""

def _register_and_login(client):
    client.post(
        "/api/auth/register",
        json={"name": "Иван Иванов", "email": "ivan@example.com", "password": "strongpass123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "ivan@example.com", "password": "strongpass123"},
    )
    return response.json()["token"]


def test_surveys_requires_auth(client):
    response = client.get("/api/surveys")

    assert response.status_code == 401
    assert response.json()["error"] == "Unauthorized"


def test_surveys_returns_empty_list_for_new_user(client):
    token = _register_and_login(client)

    response = client.get("/api/surveys", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json() == []


def test_create_update_publish_and_submit_public_response(client):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/api/surveys",
        json={"title": "Customer feedback", "description": "Short pulse"},
        headers=headers,
    )

    assert create_response.status_code == 201
    survey = create_response.json()
    survey_id = survey["surveyID"]
    assert survey["status"] == "draft"

    update_response = client.put(
        f"/api/surveys/{survey_id}",
        json={
            "title": "Customer feedback",
            "description": "Short pulse",
            "questions": [
                {
                    "content": "How satisfied are you?",
                    "type": "single",
                    "isRequired": True,
                    "options": [{"text": "Good"}, {"text": "Bad"}],
                },
                {
                    "content": "What should we improve?",
                    "type": "text",
                    "isRequired": False,
                    "options": [],
                },
            ],
        },
        headers=headers,
    )

    assert update_response.status_code == 200
    updated_survey = update_response.json()
    assert updated_survey["questionCount"] == 2
    assert len(updated_survey["questions"][0]["options"]) == 2

    publish_response = client.post(f"/api/surveys/{survey_id}/publish", headers=headers)

    assert publish_response.status_code == 200
    assert publish_response.json()["status"] == "published"

    public_response = client.get(f"/api/surveys/public/{survey_id}")

    assert public_response.status_code == 200
    public_survey = public_response.json()
    first_question = public_survey["questions"][0]
    text_question = public_survey["questions"][1]

    submit_response = client.post(
        f"/api/surveys/public/{survey_id}/responses",
        json={
            "answers": [
                {
                    "questionID": first_question["questionID"],
                    "optionIDs": [first_question["options"][0]["optionID"]],
                },
                {
                    "questionID": text_question["questionID"],
                    "textAnswer": "Faster checkout",
                },
            ]
        },
    )

    assert submit_response.status_code == 201
    assert submit_response.json()["acceptedAnswers"] == 2

    list_response = client.get("/api/surveys", headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()[0]["responseCount"] == 1


def test_cannot_publish_empty_survey(client):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}
    create_response = client.post("/api/surveys", json={"title": "Empty"}, headers=headers)
    survey_id = create_response.json()["surveyID"]

    publish_response = client.post(f"/api/surveys/{survey_id}/publish", headers=headers)

    assert publish_response.status_code == 400
