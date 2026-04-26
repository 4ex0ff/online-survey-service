import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import { IconClipboard, IconUserCircle, IconSearch, IconFilter, IconMoreVertical, IconDoorOpen, IconX, IconReload } from '../components/icons';

function DashboardPage() {
    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [surveys, setSurveys] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    {/* Загрузка данных с сервера */}
    {/* Временная заглушка с тестовыми данными и имитацией задержки */}
    useEffect(() => {
        const fetchSurveys = async () => {
            try {
                setLoading(true);
                setError('');
                await new Promise(resolve => setTimeout(resolve, 1000));
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

    {/* Фильтрация и поиск по опросам */}
    const filteredByStatus = surveys.filter(survey => {
        if (filter === 'published') return survey.status === 'published';
        if (filter === 'draft') return survey.status === 'draft';
        if (filter === 'closed') return survey.status === 'closed';
        return true;
    });

    const filteredByTitle = filteredByStatus.filter(survey =>
        survey.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    {/* Обработчики действий пользователя */}
    const handleLogout = () => {
        navigate('/login');
    };

    const handleCreateSurvey = () => {
        alert('WIP: скоро здесь будет конструктор опросов');
    };

    {/* --- Разметка страницы --- */}
    return(
        <div className='page dashboard-page'>
            <header className='site-header'>
                <button className='header-logo' type='button' onClick={() => navigate('/')}>
                    <IconClipboard className='icon-primary' />
                </button>
                <label className='text-h1'>Сервис опросов</label>
                <button className='header-button-logout' type='button' onClick={handleLogout}>
                    <IconDoorOpen className='icon-primary' />
                </button>
            </header>

            <div className='dashboard-controls'>
                <button type='button' className='button-primary dashboard-button-create' onClick={handleCreateSurvey}>
                    <span className='dashboard-create-full'>+Создать</span>
                    <span className='dashboard-create-short'>+</span>
                </button>
                <div className='frame dashboard-search-wrapper'>
                    <IconSearch className='icon-secondary' />
                    <input
                        className='text-body dashboard-search-field'
                        type='text'
                        placeholder='Поиск'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button type='button' className='button-tertiary dashboard-button-filter' onClick={() => alert('WIP')}>
                    <IconFilter className='icon-secondary' />
                </button>
            </div>

            <div className={`dashboard-surveys-group ${loading || error || (filteredByTitle.length === 0) ? 'centered' : ''}`}>
                {loading ? (
                    <div className='frame dashboard-surveys-loading'>
                        <div className='dashboard-spinner'></div>
                        <p className='text-h2'>Загрузка...</p>
                    </div>
                ) : error ? (
                    <div className='frame dashboard-surveys-error'>
                        <p className='text-h2'>{error}</p>
                        <button type='button' className='button-primary dashboard-button-retry' onClick={fetchSurveys}>
                            <IconReload className='icon-primary' color='#FFFFFF' />
                            <span>Повторить</span>
                        </button>
                    </div>
                ) : filteredByTitle.length === 0 ? (
                    <div className='frame dashboard-surveys-empty'>
                        <p className='text-h2'>
                            {surveys.length === 0 ? 'У вас пока нет опросов' : 'Не найдено соответствующих опросов'}
                        </p>
                    </div>
                ) : (
                    <div className='dashboard-surveys-grid'>
                        {filteredByTitle.map(survey => (
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
                                <div className='dashboard-survey-info'>
                                    <p className='text-small'>Ответов: {survey.responses}</p>
                                    <p className='text-small'>{survey.createdAt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <footer className='site-footer'>
                <p className='text-helper'>© 2026 Сервис опросов. Все права защищены.</p>
                <p className='text-helper'>Сделано с любовью командой №10 🩷</p>
            </footer>
        </div>
    );
}

export default DashboardPage;
