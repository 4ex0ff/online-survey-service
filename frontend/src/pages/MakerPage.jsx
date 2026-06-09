import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { getSurvey, createSurvey, updateSurvey, publishSurvey } from '../api/surveys';
import { getSurveyErrorMessage } from '../api/errorMessages';
import { logoutUser } from '../api/auth';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import './MakerPage.scss';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import QuestionCard from '../components/layout/MakerQuestionCard';
import { IconArrowLeft, IconReload } from '../components/icons';

// ─────────────────────────────────────────────
// Вспомогательные фабрики
// ─────────────────────────────────────────────
const createNewQuestion = (nextPriority) => ({
    id: `q_${crypto.randomUUID()}`,
    questionID: null,
    content: 'Новый вопрос',
    type: 'single',
    isRequired: false,
    orderPriority: nextPriority,
    options: [
        { id: `opt_${crypto.randomUUID()}`, optionID: null, text: 'Вариант 1', order: 1 },
        { id: `opt_${crypto.randomUUID()}`, optionID: null, text: 'Вариант 2', order: 2 },
    ],
});

const createNewOption = (nextOrder) => ({
    id: `opt_${crypto.randomUUID()}`,
    optionID: null,
    text: 'Новый вариант',
    order: nextOrder,
});

/**
 * Преобразует локальное состояние в тело запроса для PUT /api/surveys/:id
 * Бэкенд ждёт массив questions, поля is_required (snake_case через alias isRequired в схеме)
 */
const prepareForAPI = ({ title, description, questions }) => ({
    title,
    description: description || null,
    // Бэкенд принимает список объектов SurveyQuestionInput
    questions: questions.map((q, idx) => ({
        content: q.content,
        type: q.type,
        isRequired: q.isRequired,           // alias в схеме бэкенда
        options: (q.options || []).map((opt) => ({
            text: opt.text,
        })),
    })),
});

/**
 * Конвертирует вопросы из ответа API (camelCase aliases) в локальное состояние
 */
const convertApiQuestionsToState = (apiQuestions) => {
    const arr = Array.isArray(apiQuestions) ? apiQuestions : Object.values(apiQuestions);
    return arr.map((q) => ({
        id: q.questionID ? `q_${q.questionID}` : `q_${crypto.randomUUID()}`,
        questionID: q.questionID || null,
        content: q.content,
        type: q.type === 'single' ? 'single' : q.type === 'multiple' ? 'multiple' : 'text',
        isRequired: q.isRequired ?? true,
        orderPriority: q.orderPriority ?? 1,
        options: (q.options || []).map((opt, optIdx) => ({
            id: opt.optionID ? `opt_${opt.optionID}` : `opt_${crypto.randomUUID()}`,
            optionID: opt.optionID || null,
            text: opt.text,
            order: optIdx + 1,
        })),
    }));
};

// ─────────────────────────────────────────────
// Компонент
// ─────────────────────────────────────────────
function MakerPage() {
    const navigate = useNavigate();
    const { token, signOut } = useAuth();
    const { id } = useParams();                         // undefined для нового опроса

    // ── Данные опроса ──────────────────────────
    const [surveyId, setSurveyId] = useState(id ? Number(id) : null);
    const [title, setTitle] = useState('Новый опрос');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([createNewQuestion(1)]);

    // ── Служебные флаги ────────────────────────
    const [isEditable, setIsEditable] = useState(true);
    const [fetchLoading, setFetchLoading] = useState(!!id);  // сразу true если редактируем
    const [saveLoading, setSaveLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [publishedLink, setPublishedLink] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ── Предупреждение о несохранённых изменениях ──
    useEffect(() => {
        const handler = (e) => {
            if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasUnsavedChanges]);

    const markAsChanged = useCallback(() => {
        setHasUnsavedChanges(true);
        setSaveError('');
    }, []);

    const markAsSaved = useCallback(() => setHasUnsavedChanges(false), []);

    // ── Загрузка существующего опроса ──────────
    const fetchSurvey = useCallback(async () => {
        if (!token) { navigate('/login'); return; }
        if (!surveyId) return;

        setFetchLoading(true);
        setFetchError('');
        try {
            const data = await getSurvey(token, surveyId);
            // Бэкенд отдаёт camelCase aliases из Pydantic serialization_alias
            setTitle(data.title || '');
            setDescription(data.description || '');
            setQuestions(convertApiQuestionsToState(data.questions || []));
            setIsEditable(data.status !== 'published');
            if (data.status === 'published') {
                setPublishedLink(`${window.location.origin}/survey/${data.surveyID}`);
            }
            markAsSaved();
        } catch (err) {
            console.error('Fetch survey error:', err);
            setFetchError(getSurveyErrorMessage(err, 'Не удалось загрузить опрос.'));
        } finally {
            setFetchLoading(false);
        }
    }, [surveyId, token, navigate, markAsSaved]);

    useEffect(() => { fetchSurvey(); }, [fetchSurvey]);

    // ── Валидация ──────────────────────────────
    const validateForm = useCallback(() => {
        const errors = {};
        let isValid = true;

        if (!title.trim()) {
            errors.title = 'Название опроса обязательно';
            isValid = false;
        }
        if (questions.length === 0) {
            errors.questions = 'Добавьте хотя бы один вопрос';
            isValid = false;
        }
        for (const q of questions) {
            const qErrors = {};
            if (!q.content.trim()) {
                qErrors.content = 'Текст вопроса обязателен';
                isValid = false;
            }
            if ((q.type === 'single' || q.type === 'multiple')) {
                if (!q.options || q.options.length < 2) {
                    qErrors.optionsCount = 'Добавьте хотя бы 2 варианта ответа';
                    isValid = false;
                } else if (q.options.some(opt => !opt.text.trim())) {
                    const optErrors = {};
                    q.options.forEach(opt => {
                        if (!opt.text.trim()) optErrors[opt.id || opt.optionID] = 'Текст варианта обязателен';
                    });
                    qErrors.options = optErrors;
                    isValid = false;
                }
            }
            if (Object.keys(qErrors).length > 0) errors[q.id || q.questionID] = qErrors;
        }
        setValidationErrors(errors);
        return isValid;
    }, [title, questions]);

    // ── Обработчики действий ───────────────────
    const handleLogout = useCallback(async () => {
        try { await logoutUser(token); } catch (err) { console.error(err); }
        finally { signOut(); navigate('/login'); }
    }, [token, navigate, signOut]);

    const handleGoBack = useCallback(() => {
        if (hasUnsavedChanges) {
            if (window.confirm('У вас есть несохранённые изменения. Вы уверены, что хотите уйти?')) {
                navigate('/dashboard');
            }
        } else {
            navigate('/dashboard');
        }
    }, [hasUnsavedChanges, navigate]);

    const handleAddQuestion = useCallback(() => {
        setQuestions(prev => [...prev, createNewQuestion(prev.length + 1)]);
        markAsChanged();
        setValidationErrors(prev => { const e = { ...prev }; delete e.questions; return e; });
    }, [markAsChanged]);

    const handleUpdateQuestion = useCallback((questionId, updates) => {
        setQuestions(prev => prev.map(q =>
            (q.id === questionId || q.questionID === questionId) ? { ...q, ...updates } : q
        ));
        markAsChanged();
        setValidationErrors(prev => { const e = { ...prev }; delete e[questionId]; return e; });
    }, [markAsChanged]);

    const handleDeleteQuestion = useCallback((questionId) => {
        setQuestions(prev => prev.filter(q => q.id !== questionId && q.questionID !== questionId));
        markAsChanged();
        setValidationErrors(prev => { const e = { ...prev }; delete e[questionId]; return e; });
    }, [markAsChanged]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setQuestions(prev => {
            const oldIndex = prev.findIndex(q => q.id === active.id || q.questionID === active.id);
            const newIndex = prev.findIndex(q => q.id === over.id || q.questionID === over.id);
            return arrayMove(prev, oldIndex, newIndex).map((q, idx) => ({ ...q, orderPriority: idx + 1 }));
        });
        markAsChanged();
    };

    /**
     * handleSave:
     *   publish=false → сохранить черновик (createSurvey или updateSurvey)
     *   publish=true  → сохранить + опубликовать (updateSurvey, потом publishSurvey)
     */
    const handleSave = useCallback(async (publish = false) => {
        if (!validateForm()) return;

        setSaveLoading(true);
        setSaveError('');
        setSuccess('');

        try {
            if (!token) { navigate('/login'); return; }

            const payload = prepareForAPI({ title, description, questions });

            let data;
            if (surveyId) {
                // Обновляем существующий черновик
                data = await updateSurvey(token, surveyId, payload);
            } else {
                // Создаём новый — сначала только заголовок/описание
                data = await createSurvey(token, { title, description: description || null });
                const newId = data.surveyID;
                setSurveyId(newId);
                navigate(`/maker/${newId}`, { replace: true });
                // Сразу сохраняем вопросы в новый опрос
                data = await updateSurvey(token, newId, payload);
            }

            if (publish) {
                // Публикуем через отдельный эндпоинт
                data = await publishSurvey(token, data.surveyID);
                setIsEditable(false);
                const link = `${window.location.origin}/survey/${data.surveyID}`;
                setPublishedLink(link);
                setSuccess('Опрос опубликован! Ссылка скопирована в буфер.');
                try { await navigator.clipboard.writeText(link); } catch (_) { /* ignore */ }
            } else {
                setSuccess('Опрос сохранён');
            }

            setValidationErrors({});
            markAsSaved();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error('Save error:', err);
            setSaveError(getSurveyErrorMessage(err, 'Не удалось сохранить опрос'));
        } finally {
            setSaveLoading(false);
        }
    }, [title, description, questions, surveyId, navigate, token, validateForm, markAsSaved]);

    // ── Разметка ───────────────────────────────
    let content;
    if (fetchError) {
        content = (
            <div className='content-group'>
                <div className='frame fetch-error'>
                    <p className='text-h2'>{fetchError}</p>
                    <button type='button' className='button-primary button-retry'
                        onClick={() => { setFetchError(''); fetchSurvey(); }}>
                        <IconReload className='icon-primary' color='#FFFFFF' />
                        <span>Повторить</span>
                    </button>
                </div>
            </div>
        );
    } else if (fetchLoading) {
        content = (
            <div className='content-group'>
                <div className='loading-frame'>
                    <div className='spinner'></div>
                    <p className='text-h2'>Загрузка...</p>
                </div>
            </div>
        );
    } else {
        content = (
            <div className='content-group'>
                {/* Заголовок и описание */}
                <div className='frame title-group'>
                    <div className='input-group'>
                        <input
                            className='text-h2 input-field'
                            type='text'
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); markAsChanged(); setValidationErrors(p => ({ ...p, title: '' })); }}
                            disabled={!isEditable}
                            placeholder='Название опроса'
                            aria-invalid={!!validationErrors.title}
                        />
                        <div className='input-line' />
                        {validationErrors.title && <p className='input-error' role='alert'>{validationErrors.title}</p>}
                    </div>
                    <div className='input-group'>
                        <textarea
                            className='text-h3 input-field title-description'
                            rows='1'
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); markAsChanged(); }}
                            disabled={!isEditable}
                            placeholder='Описание'
                        />
                        <div className='input-line' />
                    </div>
                </div>

                {/* Ссылка на опубликованный опрос */}
                {publishedLink && (
                    <div className='frame published-link-group'>
                        <p className='text-body'>Публичная ссылка:</p>
                        <a href={publishedLink} target='_blank' rel='noreferrer' className='text-body survey-link'>
                            {publishedLink}
                        </a>
                        <button type='button' className='button-secondary'
                            onClick={() => navigator.clipboard.writeText(publishedLink)}>
                            Скопировать
                        </button>
                        <button type='button' className='button-secondary'
                            onClick={() => navigate(`/survey/${surveyId}/results`)}>
                            Смотреть результаты
                        </button>
                    </div>
                )}

                {/* Вопросы */}
                <div className='questions-group'>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext
                            items={questions.map(q => q.id || q.questionID)}
                            strategy={verticalListSortingStrategy}
                        >
                            {questions.map(question => (
                                <QuestionCard
                                    key={question.id}
                                    id={question.id || question.questionID}
                                    question={question}
                                    error={validationErrors[question.id || question.questionID]}
                                    onUpdate={handleUpdateQuestion}
                                    onDelete={handleDeleteQuestion}
                                    createNewOption={createNewOption}
                                    isEditable={isEditable}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    <div className='create-group'>
                        {isEditable && (
                            <button type='button' className='button-primary button-create' onClick={handleAddQuestion}>
                                + Добавить вопрос
                            </button>
                        )}
                        {validationErrors.questions &&
                            <p className='error-frame' role='alert'>{validationErrors.questions}</p>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='page maker-page'>
            <Header content='Конструктор опросов' onLogout={handleLogout} />

            <div className='controls-group'>
                <button type='button' className='button-tertiary button-back' onClick={handleGoBack}>
                    <IconArrowLeft className='icon-primary' />
                </button>
                <button
                    type='button'
                    className='button-primary button-save'
                    onClick={() => handleSave(false)}
                    disabled={fetchLoading || saveLoading || !isEditable || !!fetchError}
                >
                    {saveLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                    type='button'
                    className='button-primary button-publish'
                    onClick={() => handleSave(true)}
                    disabled={fetchLoading || saveLoading || !isEditable || !!fetchError}
                >
                    {saveLoading ? 'Публикация...' : 'Опубликовать'}
                </button>

                {success && <div className='success-frame' role='status'>{success}</div>}
                {saveError && <div className='error-frame' role='alert'>{saveError}</div>}
            </div>

            {content}

            <Footer />
        </div>
    );
}

export default MakerPage;
