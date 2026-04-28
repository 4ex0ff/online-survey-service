import { useNavigate } from 'react-router-dom';
import { IconClipboard, IconDoorOpen } from '../icons';

function Header({ content = 'Сервис опросов', onLogout }) {
    const navigate = useNavigate();

    return (
        <header className='site-header'>
            <div className='header-logo' onClick={() => navigate('/')}>
                <IconClipboard className='icon-primary' />
            </div>
            <label className='text-h1'>{content}</label>
            <button type='button' className='header-button-logout' onClick={onLogout}>
                <IconDoorOpen className='icon-primary' />
            </button>
        </header>
    );
}

export default Header;