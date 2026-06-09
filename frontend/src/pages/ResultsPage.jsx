import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { getSurveyResults } from '../api/surveys';
import { logoutUser } from '../api/auth';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { IconArrowLeft, IconReload } from '../components/icons';
import './ResultsPage.scss';

function ResultsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, signOut } = useAuth();

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchResults = useCallback(async () => {
        if (!token) { navigate('/login'); return; }
        setLoading(true);
        setError('');
        try {
            const data = await getSurveyResults(token, id);
            setResults(data);
        } catch (err) {
            if (err.status === 404) {
                setError('Опрос не найден.');
            } else if (err.status === 403) {
                setError('Нет доступа к этому опросу.');
            } else {
                setError('Не удалось загрузить результаты.');
            }
        } finally {
            setLoading(false);
        }
    }, [id, token, navigate]);

    useEffect(() => {
        void Promise.resolve().then(fetchResults);
    }, [fetchResults]);

    const handleLogout = useCallback(async () => {
        try { await logoutUser(token); } catch { /* ignore */ }
        finally { signOut(); navigate('/login'); }
    }, [token, navigate, signOut]);

    // ── Рендер одного вопроса с результатами ──
    const renderQuestion = (question, idx) => {
        const totalVotes = question.options.reduce((sum, opt) => sum + opt.voteCount, 0);

        return (
            <div className='frame result-question-frame' key={question.questionID}>
                <div className='question-meta'>
                    <span className='text-small question-number'>{idx + 1}</span>
                    <h2 className='text-h2 question-content'>{question.content}</h2>
                </div>

                {/* single / multiple — гистограмма */}
                {(question.type === 'single' || question.type === 'multiple') && (
                    <div className='options-results'>
                        {question.options.length === 0 ? (
                            <p className='text-small no-answers'>Ответов пока нет</p>
                        ) : (
                            question.options.map(option => {
                                const pct = totalVotes > 0
                                    ? Math.round((option.voteCount / totalVotes) * 100)
                                    : 0;
                                return (
                                    <div className='option-result-row' key={option.optionID}>
                                        <div className='option-result-label'>
                                            <span className='text-body'>{option.text}</span>
                                            <span className='text-small vote-count'>
                                                {option.voteCount} ({pct}%)
                                            </span>
                                        </div>
                                        <div className='bar-track'>
                                            <div
                                                className='bar-fill'
                                                style={{ width: `${pct}%` }}
                                                role='progressbar'
                                                aria-valuenow={pct}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {totalVotes > 0 && (
                            <p className='text-small total-votes'>Всего голосов: {totalVotes}</p>
                        )}
                    </div>
                )}

                {/* text — список ответов */}
                {question.type === 'text' && (
                    <div className='text-results'>
                        {question.textAnswers.length === 0 ? (
                            <p className='text-small no-answers'>Ответов пока нет</p>
                        ) : (
                            question.textAnswers.map((answer, aIdx) => (
                                <div className='text-answer-item' key={aIdx}>
                                    <span className='text-small answer-index'>{aIdx + 1}</span>
                                    <p className='text-body'>{answer}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ── Состояния страницы ─────────────────────
    let content;
    if (loading) {
        content = (
            <div className='loading-frame'>
                <div className='spinner'></div>
                <p className='text-h2'>Загрузка результатов...</p>
            </div>
        );
    } else if (error) {
        content = (
            <div className='frame error-frame'>
                <p className='text-h2'>{error}</p>
                <button type='button' className='button-primary button-retry' onClick={fetchResults}>
                    <IconReload className='icon-primary' color='#FFFFFF' />
                    <span>Повторить</span>
                </button>
            </div>
        );
    } else if (results) {
        content = (
            <>
                {/* Сводка */}
                <div className='frame results-summary'>
                    <h1 className='text-h1'>{results.title}</h1>
                    <div className='summary-stat'>
                        <span className='text-body stat-label'>
                            Респондентов: 
                        </span>
                        <span className='stat-number'>{results.responseCount}</span>
                    </div>
                    {results.responseCount === 0 && (
                        <p className='text-body no-responses'>Ответов пока нет. Поделитесь ссылкой на опрос!</p>
                    )}
                </div>

                {/* Вопросы с результатами */}
                {results.questions.map((q, idx) => renderQuestion(q, idx))}
            </>
        );
    }

    return (
        <div className='page results-page'>
            <Header content='Результаты опроса' onLogout={handleLogout} />

            <div className='results-container'>
                <button type='button' className='button-tertiary button-back'
                    onClick={() => navigate(`/maker/${id}`)}>
                    <IconArrowLeft className='icon-primary' />
                </button>
                {content}
            </div>

            <Footer />
        </div>
    );
}

export default ResultsPage;
