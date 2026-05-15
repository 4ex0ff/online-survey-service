# PLANS.md

## MVP Roadmap

### Phase 1. Auth Foundation

- Регистрация пользователя
- Вход по JWT
- Protected dashboard
- PostgreSQL + миграции
- Docker Compose
- GitHub Actions + SSH deploy

### Phase 2. Survey Builder

Status: implemented in `main` as authenticated survey create/edit/publish flow.

- Создание опроса
- Редактирование названия и описания
- Добавление вопросов:
  - single choice
  - multiple choice
  - text
- Черновик и публикация

### Phase 3. Public Response Flow

Status: partially implemented in `main` as public survey link, anonymous completion, and answer storage.

- Публичная ссылка на опрос
- Проверка доступности по статусу и датам
- Прохождение опроса без авторизации
- Сохранение ответов и session tracking

### Phase 4. Results And Analytics

- Статистика по вариантам
- Просмотр текстовых ответов
- Базовые summary-карточки
- Защита доступа к результатам только для автора

### Phase 5. Production Hardening

- Домен и HTTPS
- Reverse proxy на уровне VPS
- Backups PostgreSQL
- Observability и логирование
- Возможное разделение staging/prod
