import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicSurvey, submitSurveyResponse } from '../api/surveys';
import Footer from '../components/layout/Footer';
import './TakePage.scss';

function TakePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // answers: { [questionID]: { optionIDs: [], textAnswer: '' } }
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError('');
            try {
                const data = await getPublicSurvey(id);
                setSurvey(data);
                // Инициализируем пустые ответы
                const initial = {};
                (data.questions || []).forEach(q => {
                    initial[q.questionID] = { optionIDs: [], textAnswer: '' };
                });
                setAnswers(initial);
            } catch (err) {
                if (err.status === 404) {
                    setError('Опрос не найден или ещё не опубликован.');
                } else {
                    setError('Не удалось загрузить опрос. Попробуйте позже.');
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    const handleSingleChange = useCallback((questionID, optionID) => {
        setAnswers(prev => ({
            ...prev,
            [questionID]: { ...prev[questionID], optionIDs: [optionID] },
        }));
    }, []);

    const handleMultiChange = useCallback((questionID, optionID, checked) => {
        setAnswers(prev => {
            const current = prev[questionID]?.optionIDs || [];
            const updated = checked
                ? [...current, optionID]
                : current.filter(id => id !== optionID);
            return { ...prev, [questionID]: { ...prev[questionID], optionIDs: updated } };
        });
    }, []);

    const handleTextChange = useCallback((questionID, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionID]: { ...prev[questionID], textAnswer: value },
        }));
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!survey) return;

        // Клиентская валидация обязательных полей
        for (const q of survey.questions) {
            const ans = answers[q.questionID];
            if (q.isRequired) {
                if (q.type === 'text' && !ans?.textAnswer?.trim()) {
                    setSubmitError(`Ответьте на обязательный вопрос: "${q.content}"`);
                    return;
                }
                if ((q.type === 'single' || q.type === 'multiple') && (!ans?.optionIDs?.length)) {
                    setSubmitError(`Ответьте на обязательный вопрос: "${q.content}"`);
                    return;
                }
            }
        }

        setSubmitting(true);
        setSubmitError('');

        try {
            const payload = {
                answers: survey.questions
                    .filter(q => {
                        const ans = answers[q.questionID];
                        if (q.type === 'text') return !!ans?.textAnswer?.trim();
                        return !!ans?.optionIDs?.length;
                    })
                    .map(q => ({
                        questionID: q.questionID,
                        optionIDs: answers[q.questionID]?.optionIDs || [],
                        textAnswer: answers[q.questionID]?.textAnswer || null,
                    })),
            };

            if (payload.answers.length === 0) {
                setSubmitError('Ответьте хотя бы на один вопрос');
                setSubmitting(false);
                return;
            }

            await submitSurveyResponse(id, payload);
            setSubmitted(true);
        } catch (err) {
            setSubmitError(err.message || 'Не удалось отправить ответы. Попробуйте ещё раз.');
        } finally {
            setSubmitting(false);
        }
    }, [survey, answers, id]);

    // ── Состояние: загрузка ────────────────────
    if (loading) {
        return (
            <div className='page take-page'>
                <div className='take-container'>
                    <div className='loading-frame'>
                        <div className='spinner'></div>
                        <p className='text-h2'>Загрузка опроса...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ── Состояние: ошибка ──────────────────────
    if (error) {
        return (
            <div className='page take-page'>
                <div className='take-container'>
                    <div className='frame error-frame-center'>
                        <p className='text-h2'>{error}</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ── Состояние: отправлено ──────────────────
    if (submitted) {
        return (
            <div className='page take-page'>
                <div className='take-container'>
                    <div className='frame submitted-frame'>
                        <h1 className='text-h1'>Спасибо!</h1>
                        <p className='text-body'>Ваши ответы успешно записаны.</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ── Основной контент ───────────────────────
    return (
        <div className='page take-page'>
            <div className='take-container'>
                {/* Заголовок опроса */}
                <div className='frame survey-header-frame'>
                    <h1 className='text-h1'>{survey.title}</h1>
                    {survey.description && <p className='text-body survey-description'>{survey.description}</p>}
                </div>

                {/* Вопросы */}
                {survey.questions.map((question, idx) => (
                    <div className='frame question-frame' key={question.questionID}>
                        <div className='question-header'>
                            <span className='text-small question-number'>{idx + 1}</span>
                            <h2 className='text-h2 question-content'>
                                {question.content}
                                {question.isRequired && <span className='required-mark'> *</span>}
                            </h2>
                        </div>

                        {/* single — radio */}
                        {question.type === 'single' && (
                            <div className='options-group'>
                                {question.options.map(option => (
                                    <label className='option-label' key={option.optionID}>
                                        <input
                                            type='radio'
                                            name={`q_${question.questionID}`}
                                            value={option.optionID}
                                            checked={answers[question.questionID]?.optionIDs?.[0] === option.optionID}
                                            onChange={() => handleSingleChange(question.questionID, option.optionID)}
                                        />
                                        <span className='text-body'>{option.text}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* multiple — checkbox */}
                        {question.type === 'multiple' && (
                            <div className='options-group'>
                                {question.options.map(option => (
                                    <label className='option-label' key={option.optionID}>
                                        <input
                                            type='checkbox'
                                            value={option.optionID}
                                            checked={answers[question.questionID]?.optionIDs?.includes(option.optionID) || false}
                                            onChange={(e) => handleMultiChange(question.questionID, option.optionID, e.target.checked)}
                                        />
                                        <span className='text-body'>{option.text}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* text — textarea */}
                        {question.type === 'text' && (
                            <textarea
                                className='text-body input-field text-answer'
                                rows={3}
                                placeholder='Ваш ответ...'
                                value={answers[question.questionID]?.textAnswer || ''}
                                onChange={(e) => handleTextChange(question.questionID, e.target.value)}
                            />
                        )}
                    </div>
                ))}

                {/* Кнопка отправки */}
                <div className='submit-group'>
                    {submitError && <p className='error-frame' role='alert'>{submitError}</p>}
                    <button
                        type='button'
                        className='button-primary button-submit'
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Отправка...' : 'Отправить ответы'}
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default TakePage;
