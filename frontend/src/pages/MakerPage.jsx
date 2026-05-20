import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import './MakerPage.scss';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import QuestionCard from '../components/layout/MakerQuestionCard';
import { IconArrowLeft } from '../components/icons';

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
    const [surveyId, setSurveyId] = useState(id || null);
    const [title, setTitle] = useState('Новый опрос');
    const [description, setDescription] = useState('');
    const [closedAt, setClosedAt] = useState('');
    const [questions, setQuestions] = useState([createNewQuestion(1)]);
    const [isEditable, setIsEditable] = useState(true);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState('');
    const [, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

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

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/surveys/${surveyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                signOut();
                navigate('/login');
                return;
            }

            if (!response.ok) {
                let errorMessage = `Ошибка ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    // Если не удалось распарсить JSON, оставляем стандартное сообщение
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setTitle(data.title || '');
            setDescription(data.description || '');
            setClosedAt(data.closedAt ? data.closedAt.split('T')[0] : '');
            setQuestions(convertApiQuestionsToState(data.questions));
            setSurveyId(data.surveyID);
            setIsEditable(data.status !== 'published');
        } catch (err) {
            console.error('Fetch survey error:', err);
            setError('Не удалось загрузить опрос.');
            return;
        } finally {
            setLoading(false);
        }
    }, [surveyId, token, navigate, signOut]);

    useEffect(() => {
        // Загружаем данные редактируемого опроса при открытии страницы.
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
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            signOut();
            navigate('/login');
        }
    }, [token, navigate, signOut]);

    const handleAddQuestion = useCallback(() => {
        const nextPriority = questions.length + 1;
        const newQuestion = createNewQuestion(nextPriority);
        setQuestions([...questions, newQuestion]);
        // Очистить ошибку количества вопросов
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.questions;
            return newErrors;
        });
    }, [questions]);

    const handleUpdateQuestion = useCallback((questionId, updates) => {
        setQuestions(questions.map(q =>
            (q.id === questionId || q.questionID === questionId)
                ? { ...q, ...updates }
                : q
        ));
        // Очистить ошибки вопроса при редактировании
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors[questionId]) {
                delete newErrors[questionId];
            }
            return newErrors;
        });
    }, [questions]);

    const handleDeleteQuestion = useCallback((questionId) => {
        setQuestions(questions.filter(q =>
            q.id !== questionId && q.questionID !== questionId
        ));
        // Очистить ошибки удалённого вопроса
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors[questionId]) {
                delete newErrors[questionId];
            }
            return newErrors;
        });
    }, [questions]);

    const handleSave = useCallback(async (publish = false) => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');
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

            // Определяем метод и URL
            const method = surveyId ? 'PUT' : 'POST';
            const url = surveyId ? `/api/surveys/${surveyId}` : '/api/surveys';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 401) {
                signOut();
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка сохранения');
            }

            const data = await response.json();
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
            setSuccess(publish ? 'Опрос опубликован' : 'Опрос сохранён');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Save error:', err);
            setError(err.message || 'Не удалось сохранить опрос');
        } finally {
            setLoading(false);
        }
    }, [title, description, closedAt, questions, surveyId, navigate, token, signOut, validateForm]);

    return(
        <div className='page maker-page'>
            {/* --- Header --- */}
            <Header content='Конструктор опросов' onLogout={handleLogout} />

            {/* --- Управление --- */}
            <div className='controls-group'>
                <button type="button" className="button-tertiary button-back" onClick={() => navigate('/dashboard')}>
                    <IconArrowLeft className='icon-primary'/>
                </button>
                <button 
                    type='button' 
                    className='button-primary button-save'
                    onClick={handleSave}
                    disabled={loading || !isEditable}
                >
                    {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                    type='button'
                    className='button-primary button-publish'
                    onClick={() => {handleSave(true)}}
                    disabled={!isEditable}
                >
                    {loading ? 'Публикация...' : 'Опубликовать'}
                </button>
            </div>

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
                        onChange={(e) => setDescription(e.target.value)}
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
                {questions.map(question => (
                    <QuestionCard
                        key={question.id}
                        question={question}
                        error={validationErrors[question.id || question.questionID]}
                        onUpdate={handleUpdateQuestion}
                        onDelete={handleDeleteQuestion}
                        createNewOption={createNewOption}
                        isEditable={isEditable}
                    />
                ))}
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

            {/* --- Footer --- */}
            <Footer />
        </div>
    );
}

export default MakerPage;
