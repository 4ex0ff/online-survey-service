import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import './DashboardPage.scss';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { IconSearch, IconFilter, IconTrash, IconReload, IconX } from '../components/icons';

function DashboardPage() {
    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const { token, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [surveys, setSurveys] = useState([]);
    const [filter] = useState('all');    // 'all', 'published', 'draft', 'closed'
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    
    {/* --- Загрузка опросов --- */}
    const fetchSurveys = useCallback(async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/surveys', {
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

            const data = await response.json(); // Массив объектов
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
            setError('Не удалось загрузить опросы.');
        } finally {
            setLoading(false);
        }
    }, [navigate, token, signOut]);

    useEffect(() => {
        // Новая загрузка нужна при смене token/signOut/navigate, eslint rule здесь слишком строгий для async fetch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSurveys();
    }, [fetchSurveys]);

    {/* --- Фильтрация и поиск --- */}
    // Дебаунс для оптимизации поиска
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredSurveys = useMemo(() => {
        let result = surveys;
        if (filter !== 'all') {
            result = result.filter(s => s.status === filter);
        }
        if (debouncedQuery.trim()) {
            const q = debouncedQuery.toLowerCase();
            result = result.filter(s => s.title.toLowerCase().includes(q));
        }
        return result;
    }, [surveys, filter, debouncedQuery]);

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

    const handleCreateSurvey = () => {
        navigate('/maker');
    };

    const handleDeleteSurvey = useCallback(async (surveyId, surveyTitle) => {
        if (!window.confirm(`Удалить опрос "${surveyTitle}"? Это действие нельзя отменить.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/surveys/${surveyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
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
                    // Если тело ошибки не JSON, используем статус HTTP.
                }
                throw new Error(errorMessage);
            }

            setSurveys(prevSurveys => prevSurveys.filter(s => s.id !== surveyId));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Не удалось удалить опрос: ' + err.message);
        }
    }, [token, signOut, navigate, setSurveys]);

    const handleRetry = () => fetchSurveys();

    {/* --- Состояния сетки опросов --- */}
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
                <button type='button' className='button-primary button-retry' onClick={handleRetry}>
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
                            <button type='button' className='button-icon' onClick={() => handleDeleteSurvey(survey.id, survey.title)}>
                                <IconTrash className='icon-secondary' />
                            </button>
                        </div>
                        <span className={`text-small survey-status--${survey.status}`}>
                            {survey.status === 'published' ? 'Опубликован'
                                : survey.status === 'draft' ? 'Черновик'
                                : 'Закрыт'}
                        </span>
                        <p className='text-small'>{survey.createdAt}</p>
                    </div>
                ))}
            </div>
        )
    }

    {/* --- Разметка страницы --- */}
    return(
        <div className='page dashboard-page'>
            {/* --- Header --- */}
            <Header onLogout={handleLogout} />

            {/* --- Управление --- */}
            <div className='controls-group'>
                <button type='button' className='button-primary button-create' onClick={handleCreateSurvey}>
                    <IconX className='icon-primary ' color='white' />
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
                <button type='button' className='button-tertiary button-filter' onClick={() => alert('Фильтрация опросов в разработке')}>
                    <IconFilter className='icon-primary' />
                </button>
            </div>

            {/* --- Список опросов --- */}
            <div className={'surveys-group'}>
                {content}
            </div>

            {/* --- Footer --- */}
            <Footer />
        </div>
    );
}

export default DashboardPage;
