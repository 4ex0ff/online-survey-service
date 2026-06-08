# AGENTS.md

## Назначение

Этот файл задаёт безопасные правила для разработчиков и AI-ассистентов, которые работают с репозиторием.

## Текущий стек

- Frontend: React + Vite + React Router
- Backend: Python + FastAPI + `psycopg2`
- Database: PostgreSQL
- Deploy: Docker Compose + GitHub Actions + VPS
- E2E: Playwright

## Главные архитектурные правила

- Репозиторий монолитный: `frontend/` и `backend/` живут рядом.
- Внутри backend и БД используем только `snake_case`.
- Во внешнем JSON сохраняем совместимость с контрактом: `userID`, `isAdmin`, `publishedAt`.
- ORM не используем. Работа с БД только через SQL и `psycopg2`.
- Любые изменения схемы БД идут только через новые SQL-файлы в `backend/migrations/sql/`.
- Уже применённые миграции не переписываем.
- Frontend ходит в API через относительный `/api`.
- Не добавляем CORS-костыли без необходимости: в dev используется Vite proxy, в prod — Nginx proxy.

## Структура ответственности

- `frontend/src/api` — все HTTP-запросы.
- `frontend/src/providers` — auth/session state.
- `frontend/src/routes` — route guards.
- `backend/app/api` — HTTP-слой и зависимости.
- `backend/app/services` — бизнес-логика.
- `backend/app/repositories` — SQL-запросы.
- `backend/app/schemas` — Pydantic схемы.
- `scripts/` — операционные скрипты для VPS и деплоя.

## Команды разработки

Windows PowerShell:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Linux/macOS:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
pip install -r requirements.txt
python migrate.py
uvicorn app.main:app --reload
```

Docker:

```bash
cp .env.example .env
docker compose up -d --build
```

## Self-check перед коммитом

Перед любым merge или PR обязательно проверить:

```bash
cd frontend && npm run lint && npm run build
cd backend && pytest tests -q
docker compose up -d --build
curl http://localhost/api/health
```

Если менялся auth flow, дополнительно:

```bash
cd frontend
npx playwright install --with-deps chromium
npm run test:e2e
```

## Правила для AI-ассистентов

- Не ломать alias-контракт JSON без явной команды.
- Не переименовывать таблицы и поля “для красоты”, если это затрагивает API без отдельной миграции и обновления frontend.
- Не заменять `psycopg2` на ORM.
- Не класть бизнес-логику в роуты.
- Не добавлять новые зависимости без реальной пользы для проекта.
- Не хранить реальные секреты в репозитории: `.env.example` содержит только безопасный шаблон, а production-значения живут в `.env` на сервере и в GitHub Secrets.
- Не коммитить временные артефакты деплоя и ключи доступа, например `.keys/`, архивы сборки и приватные SSH-ключи.
- Не переписывать README, AGENTS и PLANS полностью без причины; обновлять точечно.
- При изменении деплоя синхронно обновлять:
  - `docker-compose.yml`
  - `.github/workflows/`
  - `README.md`
  - `scripts/`

## Что считать завершённой задачей

Задача считается завершённой, если:

- код собран локально;
- тесты или smoke-check проходят;
- документация обновлена;
- новые env-переменные задокументированы;
- структура осталась понятной следующему разработчику.
