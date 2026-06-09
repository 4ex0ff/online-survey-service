import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicSurvey, submitSurveyResponse } from '../api/surveys';
import { getErrorMessage } from '../api/errorHandler';
import { validateSurveyResponse } from '../components/utils/validators';
import { generateId } from '../components/utils/generateId';
import {
    IconArrowLeft,
    IconArrowRight,
    IconReload
} from '../components/icons';
import './TakerPage.scss';

function AutoResizeTextarea({ value, onChange, placeholder, rows = 1, ...props }) {
    const textareaRef = useRef(null);

    const resize = () => {
        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        resize();
    }, [value]);

    const handleChange = (e) => {
        onChange(e);
        resize();
    };

    return (
        <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        {...props}
        />
    );
}

function TakerPage() {
    // --- Состояние компонента ---
    const { id } = useParams();
    const [survey, setSurvey] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [validationErrorsId, setValidationErrorsId] = useState([]);

    // --- Вспомогательные функции ---
    const prepareForAPI = (answers) => {
        const answersArray = Object.entries(answers).map(([questionId, value]) => {
            if (typeof value === 'number') { // single
                return { questionID: parseInt(questionId), optionIDs: [value], textAnswer: null };
            } else if (Array.isArray(value)) { // multiple
                return { questionID: parseInt(questionId), optionIDs: value.map(v => parseInt(v)), textAnswer: null };
            } else if (typeof value === 'string') { // text
                return { questionID: parseInt(questionId), optionIDs: [], textAnswer: value };
            }
            return null;
        });
        return {
            sessionID: generateId(),
            answers: answersArray
        };
    }

    // --- Загрузка данных опроса ---
    const fetchSurvey = useCallback(async () => {
        setFetchLoading(true);
        setFetchError(null);
        setSurvey(null);

        try {
            const data = await getPublicSurvey(id);
            if(!data || !data.questions || !Array.isArray(data.questions)) {
                throw new Error("Не удалось загрузить опрос: некорректные данные от сервера");
            }
            setSurvey(data);
        } catch (err) {
            console.error("Public survey fetch error: ", err);
            setFetchError(getErrorMessage(err, "Не удалось загрузить опрос"));
        } finally {
            setFetchLoading(false);
        }
    }, [id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSurvey();
    }, [fetchSurvey]);

    const questionsArray = survey ? survey.questions : [];
    const totalQuestions = questionsArray.length;
    const currentQuestion = questionsArray[currentStep - 1];
    const isFirstQuestion = currentStep === 1;
    const isLastQuestion = currentStep === totalQuestions;

    // --- Валидация ответов ---
    const validateForm = useCallback(() => {
        const { errorsId, isValid } = validateSurveyResponse(survey, answers);
        setValidationErrorsId(errorsId);
        return isValid;
    }, [survey, answers]);

    // --- Обработчики действий пользователя ---
    const handleGoNext = () => {
        if(currentStep < totalQuestions) {
            setCurrentStep(prev => prev + 1);
            setSubmitError(null);
        }
    };

    const handleGoBack = () => {
        if(currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            setSubmitError(null);
        }
    };

    const  handleRadioChange = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
        setValidationErrorsId(prev => prev.filter(id => id !== questionId));
    }

    const handleCheckboxChange = (questionId, optionId, isChecked) => {
        setAnswers(prev => {
            const currentValues = Array.isArray(prev[questionId]) ? prev[questionId] : [];
            const newValues = isChecked
                ? [...currentValues, optionId]
                : currentValues.filter(id => id !== optionId);
            return { ...prev, [questionId]: newValues };
        });
        setValidationErrorsId(prev => prev.filter(id => id !== questionId));
    }

    const handleTextChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        setValidationErrorsId(prev => prev.filter(id => id !== questionId));
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setSubmitLoading(true);
        setSubmitError(null);

        try {
            const payload = prepareForAPI(answers);
            await submitSurveyResponse(id, payload);
            setSubmitted(true);
        } catch (err) {
            console.error("Survey response submission error:", err);
            setSubmitError(getErrorMessage(err, "Не удалось отправить ответы"));
        } finally {
            setSubmitLoading(false);
        }
    };

    // --- Разметка ---
    if (fetchLoading) {
        return (
            <div className='page taker-page'>
                <div className='loading-frame'>
                    <div className='spinner'></div>
                    <p className='text-h2'>Загрузка...</p>
                </div>
            </div>
        );
    } else if (fetchError) {
        return (
            <div className='page taker-page'>
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
    } else if (submitted) {
        return (
            <div className='page taker-page'>
                <div className='frame submit-success'>
                    <p className='text-h2'>Спасибо за участие в опросе!</p>
                </div>
            </div>
        );
    } else if (survey) {
        if(currentStep === 0) {
            return (
                <div className='page taker-page'>
                    <div className='frame title-card'>
                        <h1 className='text-h1'>{survey.title}</h1>
                        <div className='description'>
                            <p className='text-h3'>{survey.description}</p>
                            <p className='text-helper'>Вопросов: {totalQuestions}</p>
                        </div>
                        <button className='button-primary' onClick={handleGoNext}>Начать опрос</button>
                    </div>
                </div>
            );
        } else if(currentStep > 0) {
            return (
                <div className='page taker-page'>
                    <div className='frame question-card'>
                        {/* Вопрос */}
                        <div className='title-group'>
                            <span className='text-helper'>Вопрос {currentStep} из {totalQuestions}</span>
                            <h2 className='text-h2'>
                                {currentQuestion.content}
                                {currentQuestion.isRequired && <span className='required-star'>*</span>}
                            </h2>
                            <span className='text-helper'>
                                {currentQuestion.type === 'text' && 'Дайте развёрнутый ответ'}
                                {currentQuestion.type === 'single' && 'Выберите один вариант ответа'}
                                {currentQuestion.type === 'multiple' && 'Выберите все подходящие  варианты ответа'}
                            </span>
                        </div>

                        {/* Ответы */}
                        <div className='input-group'>
                            {currentQuestion.type === 'text' && (
                                <AutoResizeTextarea
                                    className='input-field'
                                    value={answers[currentQuestion.questionID] || ''}
                                    onChange={(e) => handleTextChange(currentQuestion.questionID, e.target.value)}
                                    placeholder='Введите ваш ответ...'
                                    rows={1}
                                />
                            )}
                            {currentQuestion.type === 'single' && (
                                <div className='options-group'>
                                    {currentQuestion.options.map((option) => (
                                        <label key={option.optionID} className='radio-label'>
                                            <input
                                                type='radio'
                                                name={currentQuestion.questionID}
                                                value={option.optionID}
                                                checked={answers[currentQuestion.questionID] === option.optionID}
                                                onChange={() => handleRadioChange(currentQuestion.questionID, option.optionID)}
                                            />
                                            <span className='text-body'>{option.text}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {currentQuestion.type === 'multiple' && (
                                <div className='options-group'>
                                    {currentQuestion.options.map((option) => (
                                        <label key={option.optionID} className='checkbox-label'>
                                            <input
                                                type='checkbox'
                                                value={option.optionID}
                                                checked={Array.isArray(answers[currentQuestion.questionID]) && answers[currentQuestion.questionID].includes(option.optionID)}
                                                onChange={(e) => handleCheckboxChange(currentQuestion.questionID, option.optionID, e.target.checked)}
                                            />
                                            <span className='text-body'>{option.text}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Кнопки навигации */}
                        <div className='navigation-buttons'>
                            {!isFirstQuestion && (
                                <button className='button-secondary' onClick={handleGoBack}>
                                    <IconArrowLeft className='icon-secondary'/>
                                    <span>Назад</span>
                                </button>
                            )}
                            {!isLastQuestion ? (
                                <button className='button-secondary' onClick={handleGoNext}>
                                    <span>Далее</span>
                                    <IconArrowRight className='icon-primary'/>
                                </button>
                            ) : (
                                <button className='button-primary' onClick={handleSubmit} disabled={submitLoading}>
                                    {submitLoading ? 'Отправка...' : 'Отправить'}
                                </button>
                            )}
                        </div>

                        {/* Ошибки валидации */}
                        {validationErrorsId.length > 0 && (
                            <div className='error-frame validation-errors'>
                                <p>Пожалуйста, ответьте на все обязательные вопросы</p>
                            </div>
                        )}

                        {/* Общая ошибка */}
                        {submitError && <p className='error-frame submit-error'>{submitError}</p>}
                    </div>
                </div>
            );
        }
    } else {
        return (
            <div className='page taker-page'>
                <div className='frame fetch-error'>
                    <p className='text-h2'>Опрос не найден</p>
                </div>
             </div>
        );
    }
}

export default TakerPage;