# Online Survey Service MVP

MVP веб-сервиса для создания и прохождения опросов в стиле Google Forms.

На текущем этапе проект уже умеет:

- регистрировать пользователей;
- выполнять вход по JWT;
- открывать защищённый `dashboard`;
- получать список опросов из FastAPI API и PostgreSQL;
- разворачиваться через Docker Compose;
- автоматически деплоиться на VPS через GitHub Actions.

## Стек

- Frontend: React + Vite + React Router
- Backend: Python + FastAPI + `psycopg2`
- Database: PostgreSQL
- Deploy: Docker Compose + GitHub Actions + VPS
- E2E: Playwright

## Архитектура

- `frontend/` — SPA-приложение на React.
- `backend/` — FastAPI-приложение с разделением на API, сервисы, репозитории и схемы.
- `postgres` — база данных PostgreSQL.
- `frontend` контейнер использует Nginx для раздачи SPA и проксирования `/api` на backend.
- GitHub Actions выполняет проверки и запускает автодеплой на сервер.

Внутри backend и базы используется `snake_case`, а внешний JSON остаётся совместимым с API-контрактом (`userID`, `isAdmin`, `publishedAt`).

## Структура проекта

```text
.
├── backend/
│   ├── app/
│   ├── migrations/sql/
│   └── tests/
├── frontend/
│   ├── e2e/
│   └── src/
├── scripts/
├── .github/workflows/
├── AGENTS.md
├── PLANS.md
└── docker-compose.yml
```

## MVP API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/surveys`
- `POST /api/surveys`
- `GET /api/surveys/{surveyID}`
- `PUT /api/surveys/{surveyID}`
- `POST /api/surveys/{surveyID}/publish`
- `GET /api/surveys/public/{surveyID}`
- `POST /api/surveys/public/{surveyID}/responses`
- `GET /api/health`

## Переменные окружения

Основные значения описаны в `.env.example`.

Важно:

- `.env.example` — это шаблон, а не рабочий файл;
- реальные секреты и production-значения не должны попадать в git;
- для локального запуска нужно создать отдельный `.env`.

Основные переменные:

- `APP_ENV`
- `BACKEND_HOST`
- `BACKEND_PORT`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`
- `DB_POOL_MIN_SIZE`
- `DB_POOL_MAX_SIZE`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

## Локальный запуск

### Вариант 1. Через Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

После запуска:

- frontend: `http://localhost`
- backend health: `http://localhost/api/health`

### Вариант 2. Раздельно для разработки

Backend:

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python migrate.py
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Для Windows PowerShell можно использовать `npm.cmd`.

## Проверки

Frontend:

```bash
cd frontend
npm install
npm run lint
npm run build
```

Backend:

```bash
cd backend
pip install -r requirements.txt
pytest tests -q
```

Playwright smoke:

```bash
cd frontend
npm install
npx playwright install --with-deps chromium
npm run test:e2e
```

## Деплой

Проект рассчитан на запуск на VPS с Ubuntu/Debian и Docker Compose.

Базовый сценарий:

1. установить Docker и Docker Compose;
2. склонировать репозиторий на сервер;
3. создать production `.env`;
4. выполнить деплой через `scripts/deploy.sh`.

Пример:

```bash
chmod +x scripts/deploy.sh
APP_DIR=/opt/survey-service DEPLOY_BRANCH=main ./scripts/deploy.sh
```

## GitHub Actions

Workflow `.github/workflows/ci-cd.yml` выполняет:

1. `frontend_checks`
2. `backend_checks`
3. `e2e_smoke`
4. `deploy`

Для автодеплоя нужны GitHub Secrets:

- `VPS_HOST`
- `VPS_PORT`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_APP_DIR`
- `PROD_ENV_FILE`

`PROD_ENV_FILE` — это полный production `.env`, который workflow записывает на сервер перед запуском деплоя.

## Работа с сервером

Проверить состояние контейнеров:

```bash
docker compose ps
```

Посмотреть логи:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

Перезапустить сервисы:

```bash
docker compose restart backend
docker compose restart frontend
docker compose restart postgres
```

Полностью пересобрать приложение:

```bash
docker compose up -d --build
```

Сбросить базу данных:

```bash
docker compose down -v
docker compose up -d --build
```

Осторожно: `docker compose down -v` удаляет volume PostgreSQL и очищает данные.

## Безопасность

- секреты не должны храниться в репозитории;
- production `.env` должен существовать только на сервере и/или в GitHub Secrets;
- приватные SSH-ключи не должны коммититься;
- при утечке секрета его нужно немедленно заменить.

## Документы проекта

- [AGENTS.md](AGENTS.md) — правила для разработчиков и AI-ассистентов
- [PLANS.md](PLANS.md) — дорожная карта следующих этапов

## Следующие этапы

- CRUD опросов
- конструктор вопросов
- публичные ссылки на формы
- сохранение ответов
- базовая статистика результатов
- домен и HTTPS
