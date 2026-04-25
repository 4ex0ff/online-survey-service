import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import { IconClipboard, IconUserCircle, IconSearch, IconFilter, IconMoreVertical, IconDoorOpen } from '../components/icons';

function DashboardPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [surveys, setSurveys] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    {/* --- Получение опросов --- */}
    useEffect(() => {
        const fetchSurveys = async () => {
            try {
                setLoading(true);
                setError('');
                
                // TODO: заменить на реальный API-запрос
                // const response = await fetch('/api/surveys');
                // const data = await response.json();
                // setSurveys(data);
                
                // Заглушка для демонстрации
                await new Promise(resolve => setTimeout(resolve, 1000));
                {/*
                */}
                const testSurveys = [
                    { id: 1, title: 'Опрос про котиков', status: 'closed', responses: 23, createdAt: '01.04.2025' },
                    { id: 2, title: 'Как вам наш сервис?', status: 'draft', responses: 0, createdAt: '12.04.2025' },
                    { id: 3, title: 'Оценка нового функционала', status: 'published', responses: 47, createdAt: '05.04.2025' },
                    { id: 4, title: 'Мероприятие 2025', status: 'published', responses: 12, createdAt: '01.04.2025' },
                    { id: 5, title: 'Новый опрос', status: 'draft', responses: 0, createdAt: '15.04.2025' },
                ];
                setSurveys(testSurveys);
            } catch (err) {
                setError('Не удалось загрузить опросы');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchSurveys();
    }, []);

    {/* --- Фильтрация по статусу --- */}
    const filteredByStatus = surveys.filter(survey => {
        if (filter === 'published') return survey.status === 'published';
        if (filter === 'draft') return survey.status === 'draft';
        if (filter === 'closed') return survey.status === 'closed';
        return true;
    });

    {/* --- Поиск --- */}
    const filteredByTitle = filteredByStatus.filter(survey =>
        survey.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLogout = () => {
        navigate('/login')
    };

    const handleCreateSurvey = () => {
        console.log('Попытка создания опроса');
        alert('WIP: скоро здесь будет конструктор опросов');
    };

    const handleEditSurvey = (id) => {
        console.log('Попытка редактирования опроса');
        alert('WIP: скоро здесь будет конструктор опросов');
    };

    const handleViewStats = (id) => {
        console.log('Попытка просмотра статистики');
        alert('WIP: скоро здесь будет страница статистики');
    };

    const handleDeleteSurvey = (id) => {
        console.log('Попытка удаления опроса');
        alert('WIP')
    };

    return(
        <div className='page dashboard-page'>
            {/* --- Header --- */}
            <header>
                <div className='header-logo' onClick={() => navigate('/')}>
                    <IconClipboard width={32} height={32} />
                </div>
                <div className='h1'>Сервис опросов</div>
                <button className='header-button-logout'
                onClick={handleLogout}>
                    <IconDoorOpen width={32} height={32} />
                </button>
            </header>

            {/* --- Управление опросами --- */}
            <div className='dashboard-controls'>
                <button className='button-primary dashboard-button-create'
                onClick={handleCreateSurvey}>
                    + Создать
                </button>
                <div className='frame dashboard-search-wrapper'>
                    <IconSearch width={32} height={32} />
                    <input className='p1 dashboard-search-field'
                    type='text'
                    placeholder='Поиск'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <button className='button-tertiary dashboard-button-filter'
                onClick={() => {alert('WIP')}}>
                    <IconFilter width={32} height={32} />
                </button>
            </div>

            {/* --- Опросы --- */}
            <div className={`dashboard-surveys-group ${loading || error || (filteredByTitle.length === 0) ? 'centered' : ''}`}>
                {loading ? (
                    <div className='frame dashboard-surveys-loading'>
                        <div className='dashboard-spinner'></div>
                        <div className='h2'>Загрузка...</div>
                    </div>
                ) : error ? (
                    <div className="frame dashboard-surveys-error">
                        <div className='h2'>{error}</div>
                        <button className="button-primary dashboard-button-retry"
                        onClick={() => window.location.reload()}>
                            Повторить
                        </button>
                    </div>
                ) : (filteredByTitle.length) === 0 ? (
                    <div className='frame dashboard-surveys-empty'>
                        {surveys.length === 0 ? (
                            <div className='h2'>У вас пока нет опросов</div>
                        ) : (
                            <div className='h2'>Не найдено соответствующих опросов</div>
                        )}
                    </div>
                ) : (
                    <div className='dashboard-surveys-grid'>
                        {filteredByTitle.map(survey => (
                            <div className='frame dashboard-survey-card'
                            key={survey.id}>
                                <div className='dashboard-survey-header'>
                                    <div className='h2 dashboard-survey-title'>{survey.title}</div>
                                    <button className='dashboard-survey-actions'
                                    onClick={() => {alert('WIP')}}>
                                        <IconMoreVertical width={24} height={24} />
                                    </button>
                                </div>
                                <div className='p2 ${survey.status}'>
                                    {survey.status === 'published' ? 'Опубликован'
                                    : (survey.status === 'draft') ? 'Черновик'
                                    : 'Закрыт'}
                                </div>
                                <div className='dashboard-survey-info'>
                                    <div className='p2'>Ответов: {survey.responses}</div>
                                    <div className='p2'>{survey.createdAt}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- Footer --- */}
            <footer>
                <div className='help-text'>© 2025 SurveyService. Все права защищены.</div>
                <div className='help-text'>Сделано с любовью командой №10 🩷</div>
            </footer>
        </div>
    );
}

export default DashboardPage;