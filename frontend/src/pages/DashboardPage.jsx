import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../providers/useAuth";
import './DashboardPage.css';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { IconSearch, IconFilter, IconMoreVertical, IconReload } from '../components/icons';

function DashboardPage() {
    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const { token, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [surveys, setSurveys] = useState([]);
    const [filter, setFilter] = useState('all');    // 'all', 'published', 'draft', 'closed'
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    {/*
        const testSurveys = [
            { id: 1, title: 'Опрос про котиков', status: 'closed', createdAt: '01.04.2025' },
            { id: 2, title: 'Как вам наш сервис?', status: 'draft', createdAt: '12.04.2025' },
            { id: 3, title: 'Оценка нового функционала', status: 'published', createdAt: '05.04.2025' },
            { id: 4, title: 'Мероприятие 2025', status: 'published', createdAt: '01.04.2025' },
            { id: 5, title: 'Новый опрос', status: 'draft', createdAt: '15.04.2025' },
        ];
    */}
    
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
    }, [navigate]);

    useEffect(() => {
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
        signOut();
        navigate('/login');
    }, [navigate]);

    const handleCreateSurvey = () => {
        alert('Страница создания опросов в разработке');
    };

    const handleSurveyAction = (surveyId) => {
        alert(`Действия с опросом в разработке`);
    };

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
            <div className='frame dashboard-surveys-error'>
                <p className='text-h2'>{error}</p>
                <button type='button' className='button-primary dashboard-button-retry' onClick={handleRetry}>
                    <IconReload className='icon-primary' color='#FFFFFF' />
                    <span>Повторить</span>
                </button>
            </div>
        );
    } else if (filteredSurveys.length === 0) {
        content = (
            <div className='frame dashboard-surveys-empty'>
                <p className='text-h2'>
                    {surveys.length === 0 ? 'У вас пока нет опросов' : 'Не найдено соответствующих опросов'}
                </p>
            </div>
        );
    } else {
        content = (
            <div className='dashboard-surveys-grid'>
                {filteredSurveys.map(survey => (
                    <div className='frame dashboard-survey-card' key={survey.id}>
                        <div className='dashboard-survey-header'>
                            <h2 className='text-h2 dashboard-survey-title'>{survey.title}</h2>
                            <button type='button' className='dashboard-survey-actions' onClick={() => alert('WIP')}>
                                <IconMoreVertical className='icon-secondary' />
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
            <div className='dashboard-controls'>
                <button type='button' className='button-primary dashboard-button-create' onClick={handleCreateSurvey}>
                    <span className='dashboard-create-full'>+Создать</span>
                    <span className='dashboard-create-short'>+</span>
                </button>
                <div className='frame dashboard-search-wrapper'>
                    <IconSearch className='icon-primary' />
                    <input
                        className='text-body dashboard-search-field'
                        type='text'
                        placeholder='Поиск'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button type='button' className='button-tertiary dashboard-button-filter' onClick={() => alert('Фильтрация опросов в разработке')}>
                    <IconFilter className='icon-primary' />
                </button>
            </div>

            {/* --- Список опросов --- */}
            <div className={'dashboard-surveys-group'}>
                {content}
            </div>

            {/* --- Footer --- */}
            <Footer />
        </div>
    );
}

export default DashboardPage;
