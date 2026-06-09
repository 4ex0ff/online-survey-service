**ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ**

Платформа для проведения онлайн-опросов и голосований

_Кейс №10 · Команда №10_

**Состав команды:**

| **ФИО**                     | **Роль**               |
| --------------------------- | ---------------------- |
| Блинов Александр Евгеньевич | Team Lead              |
| Безухов Роман Владиславович | Backend-разработчик    |
| Вовк Артём Сергеевич        | Backend-разработчик    |
| Вакушин Максим Павлович     | Frontend-разработчик   |
| Благов Илья Александрович   | Тестировщик / Аналитик |

2026 г.

# 1\. Обзор проекта

## 1.1 Назначение

MySurvey - веб-платформа для создания, публикации и прохождения онлайн-опросов. Платформа позволяет авторам создавать опросы с вопросами разных типов, публиковать их по уникальной ссылке и получать агрегированную статистику ответов.

## 1.2 Функциональные возможности

- Регистрация и авторизация пользователей (JWT)
- Конструктор опросов: создание, редактирование, удаление опросов
- Три типа вопросов: один из списка (radio), несколько из списка (checkbox), текстовый ответ
- Публикация опроса по уникальной ссылке
- Анонимное прохождение опроса без регистрации
- Прохождение опроса авторизованными пользователями
- Страница результатов для автора: гистограммы и списки текстовых ответов
- Поиск и фильтрация опросов на Dashboard

## 1.3 Технологический стек

| **Слой** | **Технология**   | **Версия / Описание**               |
| -------- | ---------------- | ----------------------------------- |
| Backend  | FastAPI          | 0.115.12 - async REST API фреймворк |
|          | Python           | 3.12                                |
|          | PostgreSQL       | 14+ - реляционная БД                |
|          | psycopg2         | 2.9.10 - драйвер PostgreSQL         |
|          | PyJWT            | 2.10.1 - JWT авторизация            |
|          | pwdlib + argon2  | 0.2.1 - хеширование паролей         |
| Frontend | React            | 19.2.5                              |
|          | React Router DOM | 7.14.1 - клиентский роутинг         |
|          | Vite             | 8.0.9 - сборщик                     |
|          | SCSS             | 1.99.0 - препроцессор стилей        |
|          | @dnd-kit         | 6.3.1 - drag-and-drop вопросов      |

# 2\. Архитектура

## 2.1 Общая архитектура

Проект построен по классической трёхуровневой архитектуре: клиент (SPA на React), сервер (REST API на FastAPI), база данных (PostgreSQL).

## 2.2 Структура бэкенда

Бэкенд разделён на четыре слоя:

- Routes (api/routes/) - обработка HTTP-запросов, валидация входных данных через Pydantic
- Services (services/) - бизнес-логика: проверка прав доступа, оркестрация операций
- Repositories (repositories/) - прямые SQL-запросы к PostgreSQL через psycopg2
- Schemas (schemas/) - Pydantic-модели для сериализации/десериализации данных

## 2.3 Структура фронтенда

- pages/ - страницы приложения (Dashboard, Maker, Take, Results, Login, Register)
- components/ - переиспользуемые компоненты (Header, Footer, QuestionCard, иконки)
- api/ - функции для обращения к бэкенду (client.js, surveys.js, auth.js)
- providers/ - контекст авторизации (AuthProvider, useAuth)
- styles/ - глобальные переменные и миксины SCSS

# 3\. Схема базы данных

## 3.1 Таблицы

**users**

| **Колонка**   | **Тип**      | **Ограничения**  | **Описание**                       |
| ------------- | ------------ | ---------------- | ---------------------------------- |
| user_id       | INTEGER      | PK, IDENTITY     | Уникальный ID пользователя         |
| name          | VARCHAR(100) | NOT NULL         | Имя пользователя                   |
| email         | VARCHAR(255) | UNIQUE, NOT NULL | Email (уникальный, нижний регистр) |
| password_hash | VARCHAR(255) | NOT NULL         | Хеш пароля (argon2)                |
| created_at    | TIMESTAMPTZ  | DEFAULT NOW()    | Дата регистрации                   |
| is_admin      | BOOLEAN      | DEFAULT FALSE    | Флаг администратора                |

**surveys**

| **Колонка**  | **Тип**      | **Ограничения** | **Описание**               |
| ------------ | ------------ | --------------- | -------------------------- |
| survey_id    | INTEGER      | PK, IDENTITY    | Уникальный ID опроса       |
| user_id      | INTEGER      | FK → users      | Автор опроса               |
| title        | VARCHAR(255) | NOT NULL        | Название опроса            |
| description  | TEXT         | nullable        | Описание опроса            |
| status       | VARCHAR(50)  | CHECK IN (...)  | draft / published / closed |
| published_at | TIMESTAMPTZ  | nullable        | Дата публикации            |
| created_at   | TIMESTAMPTZ  | DEFAULT NOW()   | Дата создания              |
| updated_at   | TIMESTAMPTZ  | DEFAULT NOW()   | Дата последнего изменения  |

**questions**

| **Колонка**    | **Тип**     | **Ограничения** | **Описание**             |
| -------------- | ----------- | --------------- | ------------------------ |
| question_id    | INTEGER     | PK, IDENTITY    | Уникальный ID вопроса    |
| survey_id      | INTEGER     | FK → surveys    | Принадлежность к опросу  |
| content        | TEXT        | NOT NULL        | Текст вопроса            |
| type           | VARCHAR(20) | CHECK IN (...)  | single / multiple / text |
| is_required    | BOOLEAN     | DEFAULT TRUE    | Обязателен ли вопрос     |
| order_priority | INTEGER     | NOT NULL        | Порядок отображения      |

**options**

| **Колонка**    | **Тип** | **Ограничения** | **Описание**             |
| -------------- | ------- | --------------- | ------------------------ |
| option_id      | INTEGER | PK, IDENTITY    | Уникальный ID варианта   |
| question_id    | INTEGER | FK → questions  | Принадлежность к вопросу |
| text           | TEXT    | NOT NULL        | Текст варианта ответа    |
| order_priority | INTEGER | NOT NULL        | Порядок отображения      |

**answers**

| **Колонка** | **Тип**     | **Ограничения**        | **Описание**                           |
| ----------- | ----------- | ---------------------- | -------------------------------------- |
| answer_id   | INTEGER     | PK, IDENTITY           | Уникальный ID ответа                   |
| session_id  | UUID        | NOT NULL               | ID сессии прохождения                  |
| question_id | INTEGER     | FK → questions         | Вопрос, на который дан ответ           |
| option_id   | INTEGER     | FK → options, nullable | Выбранный вариант (для radio/checkbox) |
| text_answer | TEXT        | nullable               | Текстовый ответ (для type=text)        |
| user_id     | INTEGER     | FK → users, nullable   | Пользователь (если авторизован)        |
| created_at  | TIMESTAMPTZ | DEFAULT NOW()          | Время ответа                           |

## 3.2 ER-диаграмма

erDiagram

USERS {

int id PK

string username

string email

string password_hash

boolean is_active

datetime created_at

}

SURVEYS {

int id PK

string title

string description

int creator_id FK

boolean is_published

datetime created_at

}

QUESTIONS {

int id PK

int survey_id FK

string text

string type

int order_num

boolean is_required

}

OPTIONS {

int id PK

int question_id FK

string text

int order_num

}

RESPONSES {

int id PK

int survey_id FK

int user_id FK "nullable"

datetime completed_at

}

ANSWERS {

int id PK

int response_id FK

int question_id FK

int option_id FK "nullable"

string text_answer "nullable"

}

USERS ||--o{ SURVEYS : "creates"

USERS ||--o{ RESPONSES : "submits"

SURVEYS ||--o{ QUESTIONS : "contains"

SURVEYS ||--o{ RESPONSES : "has"

QUESTIONS ||--o{ OPTIONS : "has"

QUESTIONS ||--o{ ANSWERS : "answered_in"

OPTIONS ||--o{ ANSWERS : "chosen_in"

RESPONSES ||--o{ ANSWERS : "consists_of"

# 4\. API Контракт

Базовый URL: /api. Аутентификация: Bearer token в заголовке Authorization. Все запросы и ответы в формате JSON.

## 4.1 Авторизация (/api/auth)

| **Метод** | **Путь**           | **Тело запроса**          | **Ответ**                                       |
| --------- | ------------------ | ------------------------- | ----------------------------------------------- |
| **POST**  | /api/auth/register | { name, email, password } | 201: { userID, message }                        |
| **POST**  | /api/auth/login    | { email, password }       | 200: { token, user: { userID, name, isAdmin } } |

## 4.2 Опросы (/api/surveys) - требуют авторизации

| **Метод**  | **Путь**                  | **Тело запроса**                      | **Ответ**                |
| ---------- | ------------------------- | ------------------------------------- | ------------------------ |
| **GET**    | /api/surveys              | -                                     | 200: SurveySummary\[\]   |
| **POST**   | /api/surveys              | { title, description }                | 201: SurveyDetail        |
| **GET**    | /api/surveys/{id}         | -                                     | 200: SurveyDetail        |
| **PUT**    | /api/surveys/{id}         | { title, description, questions\[\] } | 200: SurveyDetail        |
| **DELETE** | /api/surveys/{id}         | -                                     | 204: No Content          |
| **POST**   | /api/surveys/{id}/publish | -                                     | 200: SurveyDetail        |
| **GET**    | /api/surveys/{id}/results | -                                     | 200: SurveyResultsDetail |

## 4.3 Публичные эндпоинты (/api/surveys/public) - без авторизации

| **Метод** | **Путь**                           | **Тело запроса** | **Ответ**                           |
| --------- | ---------------------------------- | ---------------- | ----------------------------------- |
| **GET**   | /api/surveys/public/{id}           | -                | 200: SurveyDetail                   |
| **POST**  | /api/surveys/public/{id}/responses | { answers\[\] }  | 201: { sessionID, acceptedAnswers } |

## 4.4 Схемы данных

**SurveySummary**

| **Поле**      | **Тип**          | **Описание**                 |
| ------------- | ---------------- | ---------------------------- |
| surveyID      | integer          | ID опроса                    |
| title         | string           | Название                     |
| description   | string \| null   | Описание                     |
| status        | string           | draft \| published \| closed |
| publishedAt   | datetime \| null | Дата публикации              |
| responseCount | integer          | Количество прохождений       |
| questionCount | integer          | Количество вопросов          |

**SurveyDetail (расширяет SurveySummary)**

| **Поле**  | **Тип**      | **Описание**                         |
| --------- | ------------ | ------------------------------------ |
| questions | Question\[\] | Список вопросов с вариантами ответов |

**Question**

| **Поле**      | **Тип**    | **Описание**                           |
| ------------- | ---------- | -------------------------------------- |
| questionID    | integer    | ID вопроса                             |
| content       | string     | Текст вопроса                          |
| type          | string     | single \| multiple \| text             |
| isRequired    | boolean    | Обязателен ли ответ                    |
| orderPriority | integer    | Порядок отображения                    |
| options       | Option\[\] | Варианты ответов (для single/multiple) |

# 5\. Маршруты фронтенда

| **Путь**            | **Доступ**  | **Описание**                        |
| ------------------- | ----------- | ----------------------------------- |
| /login              | Публичный   | Страница входа                      |
| /register           | Публичный   | Страница регистрации                |
| /survey/:id         | Публичный   | Прохождение опроса по ссылке        |
| /                   | Авторизован | Dashboard - список опросов          |
| /dashboard          | Авторизован | Dashboard - список опросов          |
| /maker              | Авторизован | Конструктор - новый опрос           |
| /maker/:id          | Авторизован | Конструктор - редактирование опроса |
| /survey/:id/results | Авторизован | Результаты опроса (только автор)    |

# 6\. Инструкция по локальному запуску

## 6.1 Требования

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+
- Git

## 6.2 Шаг 1 - Клонирование репозитория

git clone &lt;URL репозитория&gt;

cd MySurvey

## 6.3 Шаг 2 - База данных

Создать БД и пользователя в PostgreSQL:

CREATE DATABASE mysurvey;

CREATE USER mysurvey_user WITH PASSWORD 'yourpassword';

GRANT ALL PRIVILEGES ON DATABASE mysurvey TO mysurvey_user;

Применить SQL-схему:

psql -U mysurvey_user -d mysurvey -f backend/migrations/001_initial_schema.sql

## 6.4 Шаг 3 - Бэкенд

Mac / Linux:

cd backend

python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

Windows:

cd backend

python -m venv .venv

.venv\\Scripts\\activate

pip install -r requirements.txt

Создать файл backend/.env:

DATABASE_URL=postgresql://mysurvey_user:yourpassword@localhost:5432/mysurvey

SECRET_KEY=your_secret_key_here

Запустить бэкенд:

uvicorn app.main:app --reload

Бэкенд будет доступен на <http://localhost:8000>. Swagger UI: <http://localhost:8000/docs>

## 6.5 Шаг 4 - Фронтенд

В новом терминале:

cd frontend

npm install

npm run dev

Фронтенд будет доступен на <http://localhost:5173>

## 6.6 Windows - особенности

- Вместо source .venv/bin/activate использовать .venv\\Scripts\\activate
- Команды выполнять в PowerShell или cmd
- PostgreSQL устанавливается через официальный инсталлятор с сайта postgresql.org

# 7\. Тестирование

## 7.1 Проверенные сценарии

| **Сценарий**                           | **Ожидаемый результат**                 | **Статус** |
| -------------------------------------- | --------------------------------------- | ---------- |
| Регистрация нового пользователя        | Аккаунт создан, вход выполнен           | ✓ Пройден  |
| Вход с неверным паролем                | Ошибка авторизации                      | ✓ Пройден  |
| Создание опроса с 3 типами вопросов    | Опрос сохранён как черновик             | ✓ Пройден  |
| Публикация опроса без вопросов         | Ошибка: нельзя опубликовать             | ✓ Пройден  |
| Публикация опроса с вопросами          | Опрос опубликован, ссылка сгенерирована | ✓ Пройден  |
| Анонимное прохождение опроса           | Ответы сохранены в БД                   | ✓ Пройден  |
| Авторизованное прохождение опроса      | Ответы сохранены с user_id              | ✓ Пройден  |
| Просмотр результатов автором           | Гистограммы и тексты отображаются       | ✓ Пройден  |
| Попытка открыть неопубликованный опрос | 404 - опрос не найден                   | ✓ Пройден  |
| Удаление опроса                        | Опрос удалён из списка                  | ✓ Пройден  |
| Доступ к чужому опросу по ID           | 404 - нет доступа                       | ✓ Пройден  |

## 7.2 E2E тестирование

Для E2E тестирования используется Playwright. Тесты расположены в frontend/e2e/.

cd frontend

npx playwright test

# 8\. Известные ограничения и планы развития

## 8.1 Текущие ограничения MVP

- Опубликованный опрос нельзя редактировать. Редактирование опубликованного опроса заблокировано для предотвращения рассинхронизации структуры данных и уже собранных ответов респондентов. Для изменения опроса требуется создание нового черновика.
- Нет пагинации списка опросов (при большом количестве может замедлиться)
- Нет real-time обновления результатов (требует обновления страницы)
- Отсутствует функция закрытия опроса через UI

## 8.2 Возможные улучшения

- Добавить типы вопросов: шкала оценки, матрица, дата
- Real-time результаты через WebSocket
- Экспорт результатов в CSV/Excel
- Дедупликация ответов по session_id
- Развёртывание на публичном хостинге