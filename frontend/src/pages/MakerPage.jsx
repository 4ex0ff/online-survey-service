import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { getSurvey, createSurvey, updateSurvey } from '../api/surveys';
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

function MakerPage() {
    {/* --- Функции-помощники --- */}
    const createNewQuestion = (nextPriority) => ({
        id: `q_${crypto.randomUUID()}`,
        questionID: null,
        content: 'Новый вопрос',
        type: 'single',
        isRequired: false,
        orderPriority: nextPriority,
        options: [
            {
                id: `opt_${crypto.randomUUID()}`,
                optionID: null,
                text: 'Новый вариант',
                order: 1
            }
        ]
    });

    const createNewOption = (nextOrder) => ({
        id: `opt_${crypto.randomUUID()}`,
        optionID: null,
        text: 'Новый вариант',
        order: nextOrder
    });

    const prepareForAPI = (data) => {
        const questionsObj = {};
        data.questions.forEach((q, idx) => {
            const optionsArr = (q.options || []).map((opt, optIdx) => ({
                optionID: opt.optionID || undefined, // если есть
                text: opt.text,
                order: opt.order ?? optIdx + 1,
            }));
            
            questionsObj[idx] = {
                questionID: q.questionID || undefined,
                content: q.content,
                type: q.type,
                isRequired: q.isRequired,
                orderPriority: idx + 1,
                options: optionsArr
            };
        });
        
        return {
            title: data.title,
            description: data.description,
            status: data.status,
            openedAt: data.openedAt,
            closedAt: data.closedAt,
            questions: questionsObj
        };
    };

    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const { token, signOut } = useAuth();
    const { id } = useParams();
    // Данные опроса
    {/*
        const [surveyData, setSurveyData] = useState({
            surveyId: id || null,
            title: 'Новый опрос',
            description: '',
            closedAt: '',
            questions: [createNewQuestion(1)],
        });
    */}
    const [surveyId, setSurveyId] = useState(id || null);
    const [title, setTitle] = useState('Новый опрос');
    const [description, setDescription] = useState('');
    const [closedAt, setClosedAt] = useState('');
    const [questions, setQuestions] = useState([createNewQuestion(1)]);
    // Служебные флаги
    const [isEditable, setIsEditable] = useState(true);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    {/* --- Функции для отслеживания изменений --- */}
    const markAsChanged = useCallback(() => {
        setHasUnsavedChanges(true);
        setSaveError('');
    }, []);

    const markAsSaved = useCallback(() => {
        setHasUnsavedChanges(false);
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        if (!isEditable) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHasUnsavedChanges(false);
        }
    }, [isEditable]);

    {/* --- Загрузка данных опроса при монтировании --- */}
    const convertApiQuestionsToState = (apiQuestions) => {
        const questionsArray = Array.isArray(apiQuestions) ? apiQuestions : Object.values(apiQuestions);
        return questionsArray.map((q, idx) => ({
            id: q.questionID ? `q_${q.questionID}` : `q_${crypto.randomUUID()}`,
            questionID: q.questionID || null,
            content: q.content,
            type: q.type === 'single' ? 'single' : (q.type === 'multiple' ? 'multiple' : 'text'),
            isRequired: q.isRequired,
            orderPriority: idx + 1,
            options: (q.options || []).map((opt, optIdx) => ({
                id: opt.optionID ? `opt_${opt.optionID}` : `opt_${crypto.randomUUID()}`,
                optionID: opt.optionID || null,
                text: opt.text,
                order: optIdx + 1,
            })),
        }));
    };
    
    const fetchSurvey = useCallback(async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (!surveyId) {
            return;
        }

        setFetchLoading(true);
        setFetchError('');

        try {
            const data = await getSurvey(token, surveyId);
            setTitle(data.title || '');
            setDescription(data.description || '');
            setClosedAt(data.closedAt ? data.closedAt.split('T')[0] : '');
            setQuestions(convertApiQuestionsToState(data.questions));
            setSurveyId(data.surveyID);
            setIsEditable(data.status !== 'published');
            markAsSaved();
        } catch (err) {
            console.error('Fetch survey error:', err);
            setFetchError(getSurveyErrorMessage(err, 'Не удалось загрузить опрос.'));
        } finally {
            setFetchLoading(false);
        }
    }, [surveyId, token, navigate]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSurvey();
    }, [fetchSurvey]);

    {/* --- Валидация формы --- */}
    const validateForm = useCallback(() => {
        const errors = {};
        let isValid = true;

        if (!title.trim()) {
            errors.title = 'Название опроса обязательно';
            isValid = false;
        }

        if (closedAt && new Date(closedAt) < new Date()) {
            errors.closedAt = 'Некорректная дата закрытия опроса';
            isValid = false;
        }

        if (questions.length === 0) {
            errors.questions = 'Добавьте хотя бы один вопрос';
            isValid = false;
        }

        for (const q of questions) {
            const questionErrors = {};
            if (!q.content.trim()) {
                questionErrors.content = 'Текст вопроса обязателен';
                isValid = false;
            }
            if (q.type === 'single' || q.type === 'multiple') {
                if (!q.options || q.options.length < 2) {
                    questionErrors.optionsCount = 'Для вопросов c одним или несколькими вариантами ответа нужно добавить хотя бы 2 варианта ответа';
                    isValid = false;
                } else {
                    if (q.options.some(opt => !opt.text.trim())) {
                        const optionErrors = {};
                        q.options.forEach(opt => {
                            if (!opt.text.trim()) {
                                optionErrors[opt.id || opt.optionID] = 'Текст варианта обязателен';
                                isValid = false;
                            }
                        });
                        questionErrors.options = optionErrors;
                    }
                }
            }
            if (Object.keys(questionErrors).length > 0) {
                errors[q.id || q.questionID] = questionErrors;
            }
        }
        setValidationErrors(errors);
        return isValid;
    }, [title, closedAt, questions]);

    {/* --- Обработчики действий пользователя --- */}
    const handleLogout = useCallback(async () => {
        try {
            await logoutUser(token);
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            signOut();
            navigate('/login');
        }
    }, [token, navigate, signOut]);

    const handleGoBack = useCallback(() => {
        if (hasUnsavedChanges) {
            const confirmed = window.confirm('У вас есть несохранённые изменения. Вы уверены, что хотите уйти?');
            if (confirmed) {
                navigate('/dashboard');
            }
        } else {
            navigate('/dashboard');
        }
    }, [hasUnsavedChanges, navigate]);

    const handleAddQuestion = useCallback(() => {
        const nextPriority = questions.length + 1;
        const newQuestion = createNewQuestion(nextPriority);
        setQuestions([...questions, newQuestion]);
        markAsChanged();
        // Очистить ошибку количества вопросов
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.questions;
            return newErrors;
        });
    }, [questions, markAsChanged]);

    const handleUpdateQuestion = useCallback((questionId, updates) => {
        setQuestions(questions.map(q =>
            (q.id === questionId || q.questionID === questionId)
                ? { ...q, ...updates }
                : q
        ));
        markAsChanged();
        // Очистить ошибки вопроса при редактировании
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors[questionId]) {
                delete newErrors[questionId];
            }
            return newErrors;
        });
    }, [questions, markAsChanged]);

    const handleDeleteQuestion = useCallback((questionId) => {
        setQuestions(questions.filter(q =>
            q.id !== questionId && q.questionID !== questionId
        ));
        markAsChanged();
        // Очистить ошибки удалённого вопроса
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors[questionId]) {
                delete newErrors[questionId];
            }
            return newErrors;
        });
    }, [questions, markAsChanged]);

    const handleSave = useCallback(async (publish = false) => {
        if (!validateForm()) {
            return;
        }

        setSaveLoading(true);
        setSaveError('');
        setSuccess('');

        try {
            if (!token) {
                navigate('/login');
                return;
            }

            const payload = prepareForAPI({
                title,
                description,
                status: publish ? 'published' : 'draft',
                openedAt: publish ? null : new Date().toISOString(),
                closedAt,
                questions
            });

            let data;
            if (surveyId) {
                data = await updateSurvey(token, surveyId, payload);
            } else {
                data = await createSurvey(token, payload);
            }

            // Если это новый опрос, сохраняем ID
            if (!surveyId && data.surveyID) {
                setSurveyId(data.surveyID);
                navigate(`/maker/${data.surveyID}`, { replace: true });
            }

            // Если опрос опубликован, блокируем редактирование
            if (publish) {
                setIsEditable(false);
            }

            setValidationErrors({});
            markAsSaved();
            setSuccess(publish ? 'Опрос опубликован' : 'Опрос сохранён');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Save error:', err);
            setSaveError(getSurveyErrorMessage(err, 'Не удалось сохранить опрос'));
        } finally {
            setSaveLoading(false);
        }
    }, [title, description, questions, surveyId, navigate, token, validateForm, markAsSaved]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = questions.findIndex(q => (q.id === active.id || q.questionID === active.id));
            const newIndex = questions.findIndex(q => (q.id === over.id || q.questionID === over.id));
            const newQuestions = arrayMove(questions, oldIndex, newIndex);
            // Обновляем orderPriority на основе новой позиции
            const updatedQuestions = newQuestions.map((q, idx) => ({
            ...q,
            orderPriority: idx + 1
            }));
            setQuestions(updatedQuestions);
            markAsChanged();
        }
    };

    {/* --- Разметка --- */}
    let content;
    if (fetchError) {
        content = (
            <div className='content-group'>
                <div className='frame fetch-error'>
                    <p className='text-h2'>{fetchError}</p>
                    <button type='button'
                    className='button-primary button-retry'
                    onClick={() => {
                    setFetchError('');
                    fetchSurvey();
                    }}>
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
                {/* --- Заголовок и описание --- */}
                <div className='frame title-group'>
                    <div className='input-group'>
                        <input
                            className={'text-h2 input-field'}
                            id="surveyTitle"
                            name="surveyTitle"
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                markAsChanged();
                                if (validationErrors.title) {
                                    setValidationErrors(prev => ({ ...prev, title: '' }));
                                }
                            }}
                            disabled={!isEditable}
                            placeholder="Название опроса"
                            aria-invalid={!!validationErrors.title}
                            aria-describedby={validationErrors.title ? 'title-error' : undefined}
                        />
                        <div className='input-line' />
                        {validationErrors.title &&
                            <p id='title-error' className='input-error' role='alert'>
                                {validationErrors.title}
                            </p>
                        }
                    </div>
                    <div className='input-group'>
                        <textarea
                            className="text-h3 input-field title-description"
                            rows='1'
                            id="surveyDescription"
                            name="surveyDescription"
                            value={description}
                            onChange={(e) => {
                            setDescription(e.target.value);
                            markAsChanged();
                        }}
                            disabled={!isEditable}
                            placeholder="Описание"
                        />
                        <div className='input-line' />
                    </div>
                </div>

                {/* --- Настройки опроса --- */}
                <div className='frame settings-group'>
                    <div className='input-group'>
                        <label className='text-h3'>Дата закрытия опроса</label>
                        <span className='text-helper'>Когда опрос перестанет принимать ответы</span>
                        <input
                            className='text-body input-field'
                            id='closedAt'
                            type='date' 
                            value={closedAt}
                            onChange={(e) => {
                                setClosedAt(e.target.value);
                                markAsChanged();
                                if (validationErrors.closedAt) {
                                    setValidationErrors(prev => ({ ...prev, closedAt: '' }));
                                }
                            }}
                            disabled={!isEditable}
                            aria-invalid={!!validationErrors.closedAt}
                            aria-describedby={validationErrors.closedAt ? 'closedAt-error' : undefined}
                        />
                        <div className='input-line' />
                        {validationErrors.closedAt && <p id='closedAt-error' className='input-error' role='alert'>{validationErrors.closedAt}</p>}
                    </div>
                </div>

                {/* --- Вопросы --- */}
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
                                    question={question}
                                    error={validationErrors[question.id || question.questionID]}
                                    onUpdate={handleUpdateQuestion}
                                    onDelete={handleDeleteQuestion}
                                    createNewOption={createNewOption}
                                    isEditable={isEditable}
                                    id={question.id || question.questionID}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    <div className='create-group'>                
                        {isEditable && (
                            <button 
                                type='button' 
                                className='button-primary button-create'
                                onClick={handleAddQuestion}
                            >
                                + Добавить вопрос
                            </button>
                        )}
                        {validationErrors.questions && 
                            <p className='error-frame' role='alert'>{validationErrors.questions}</p>
                        }
                    </div>
                </div>
            </div>
        );
    }

    return(
        <div className='page maker-page'>
            {/* --- Header --- */}
            <Header content='Конструктор опросов' onLogout={handleLogout} />

            {/* --- Управление --- */}
            <div className='controls-group'>
                <button type="button" className="button-tertiary button-back" onClick={handleGoBack}>
                    <IconArrowLeft className='icon-primary'/>
                </button>
                <button 
                    type='button' 
                    className='button-primary button-save'
                    onClick={() => {handleSave()}}
                    disabled={fetchLoading || saveLoading || !isEditable || fetchError}
                >
                    {saveLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                    type='button'
                    className='button-primary button-publish'
                    onClick={() => {handleSave(true)}}
                    disabled={fetchLoading || saveLoading || !isEditable || fetchError}
                >
                    {saveLoading ? 'Публикация...' : 'Опубликовать'}
                </button>

                {success &&
                    <div className='success-frame' role='status'>
                        {success}
                    </div>
                }

                {saveError &&
                    <div className='error-frame' role='alert'>
                        {saveError}
                    </div>
                }
            </div>

            {/* --- Основной контент --- */}
            {content}

            {/* --- Footer --- */}
            <Footer />
        </div>
    );
}

export default MakerPage;