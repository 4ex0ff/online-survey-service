import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { getSurveys, deleteSurvey } from '../api/surveys';
import { getSurveyErrorMessage } from '../api/errorMessages';
import { logoutUser } from '../api/auth';
import './DashboardPage.scss';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { IconSearch, IconFilter, IconTrash, IconReload, IconX } from '../components/icons';

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
    return (
        <div className='toast-container'>
            {toasts.map(t => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    {t.message}
                </div>
            ))}
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState([]);

    const show = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return { toasts, show };
}

// ── Компонент ────────────────────────────────────────────────────────────────
function DashboardPage() {
    const navigate = useNavigate();
    const { token, signOut } = useAuth();
    const { toasts, show: showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [surveys, setSurveys] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const fetchSurveys = useCallback(async () => {
        if (!token) { navigate('/login'); return; }
        setLoading(true);
        setError('');
        try {
            const data = await getSurveys(token);
            const formatted = data.map(survey => ({
                id: survey.surveyID,
                title: survey.title,
                status: survey.status,
                publishedAt: survey.publishedAt,
                createdAt: survey.publishedAt
                    ? new Date(survey.publishedAt).toLocaleDateString('ru-RU')
                    : '—'
            }));
            setSurveys(formatted);
        } catch (err) {
            console.error('Fetch surveys error:', err);
            setError(getSurveyErrorMessage(err, 'Не удалось загрузить опросы.'));
        } finally {
            setLoading(false);
        }
    }, [navigate, token]);

    useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredSurveys = useMemo(() => {
        let result = surveys;
        if (filter !== 'all') result = result.filter(s => s.status === filter);
        if (debouncedQuery.trim()) {
            const q = debouncedQuery.toLowerCase();
            result = result.filter(s => s.title.toLowerCase().includes(q));
        }
        return result;
    }, [surveys, filter, debouncedQuery]);

    const handleLogout = useCallback(async () => {
        try { await logoutUser(token); } catch (err) { console.error(err); }
        finally { signOut(); navigate('/login'); }
    }, [token, navigate, signOut]);

    const handleDeleteSurvey = useCallback(async (surveyId, surveyTitle) => {
        if (!window.confirm(`Удалить опрос "${surveyTitle}"? Это действие нельзя отменить.`)) return;
        try {
            await deleteSurvey(token, surveyId);
            setSurveys(prev => prev.filter(s => s.id !== surveyId));
            showToast('Опрос удалён', 'success');
        } catch (err) {
            console.error('Delete error:', err);
            showToast(getSurveyErrorMessage(err, 'Не удалось удалить опрос'), 'error');
        }
    }, [token, showToast]);

    const handleCopyLink = useCallback((surveyId) => {
        const link = `${window.location.origin}/survey/${surveyId}`;
        navigator.clipboard.writeText(link)
            .then(() => showToast('Ссылка скопирована!', 'success'))
            .catch(() => showToast('Не удалось скопировать ссылку', 'error'));
    }, [showToast]);

    // ── Контент ──────────────────────────────────────────────────────────────
    let content;
    if (loading) {
        content = (
            <div className='loading-frame'>
                <div className='spinner'></div>
                <p className='text-h2'>Загрузка...</p>
            </div>
        );
    } else if (error) {
        content = (
            <div className='frame surveys-error'>
                <p className='text-h2'>{error}</p>
                <button type='button' className='button-primary button-retry' onClick={fetchSurveys}>
                    <IconReload className='icon-primary' color='#FFFFFF' />
                    <span>Повторить</span>
                </button>
            </div>
        );
    } else if (filteredSurveys.length === 0) {
        content = (
            <div className='frame surveys-empty'>
                <p className='text-h2'>
                    {surveys.length === 0 ? 'У вас пока нет опросов' : 'Не найдено соответствующих опросов'}
                </p>
            </div>
        );
    } else {
        content = (
            <div className='surveys-grid'>
                {filteredSurveys.map(survey => (
                    <div className='frame survey-card' key={survey.id}>
                        <div className='survey-header'>
                            <h2 className='text-h2 survey-title' onClick={() => navigate(`/maker/${survey.id}`)}>
                                {survey.title}
                            </h2>
                            <button type='button' className='button-icon'
                                onClick={() => handleDeleteSurvey(survey.id, survey.title)}>
                                <IconTrash className='icon-secondary' />
                            </button>
                        </div>

                        <span className={`text-small survey-status--${survey.status}`}>
                            {survey.status === 'published' ? 'Опубликован'
                                : survey.status === 'draft' ? 'Черновик'
                                : 'Закрыт'}
                        </span>

                        <p className='text-small'>{survey.createdAt}</p>

                        {/* Кнопки для опубликованных опросов */}
                        {survey.status === 'published' && (
                            <div className='survey-actions'>
                                <button
                                    type='button'
                                    className='button-secondary button-small'
                                    onClick={() => handleCopyLink(survey.id)}
                                >
                                    Скопировать ссылку
                                </button>
                                <button
                                    type='button'
                                    className='button-secondary button-small'
                                    onClick={() => navigate(`/survey/${survey.id}/results`)}
                                >
                                    Результаты
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className='page dashboard-page'>
            <Header onLogout={handleLogout} />

            <div className='controls-group'>
                <button type='button' className='button-primary button-create'
                    onClick={() => navigate('/maker')}>
                    <IconX className='icon-primary' color='white' />
                </button>
                <div className='frame search-wrapper'>
                    <IconSearch className='icon-primary' />
                    <input
                        className='text-body input-field'
                        type='text'
                        placeholder='Поиск'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className='button-tertiary filter-select-wrapper'>
                    <IconFilter className='icon-primary filter-select-icon' />
                    <select className='text-body input-field filter-select'
                        value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value='all'> | Все опросы</option>
                        <option value='published'> | Опубликован</option>
                        <option value='draft'> | Черновик</option>
                        <option value='closed'> | Закрыт</option>
                    </select>
                </div>
            </div>

            <div className='surveys-group'>
                {content}
            </div>

            <Toast toasts={toasts} />
            <Footer />
        </div>
    );
}

export default DashboardPage;
