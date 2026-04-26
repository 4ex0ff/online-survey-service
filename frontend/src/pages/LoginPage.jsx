import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { IconMail, IconLock, IconEye, IconEyeOff } from '../components/icons';

function LoginPage() {
    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    {/* --- Обработчики действий пользователя --- */}
    const handleLogin = () => {
        navigate('/dashboard');
    };

    {/* --- Разметка страницы --- */}
    return (
        <div className="page login-page">
            <div className="frame login-frame">
                {/* --- Заголовок --- */}
                <div className="login-title-group">
                    <h1 className="text-h1">Авторизация</h1>
                    <div className="login-title-line" />
                </div>

                {/* --- Email --- */}
                <div className="login-input-group">
                    <label htmlFor="email" className="login-input-label text-small">Email</label>
                    <div className="login-input-wrapper">
                        <IconMail className='icon-secondary' />
                        <input
                            className="text-helper login-input-field"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Введите ваш email"
                        />
                    </div>
                    <div className="login-input-line" />
                </div>

                {/* --- Пароль --- */}
                <div className="login-input-group">
                    <label htmlFor="password" className="login-input-label text-small">Пароль</label>
                    <div className="login-password-wrapper">
                        <div className="login-input-wrapper">
                            <IconLock className='icon-secondary' />
                            <input
                                className="text-helper login-input-field"
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Введите ваш пароль"
                            />
                        </div>
                        <button
                            type="button"
                            className="login-password-toggle"
                            onClick={() => setShowPassword(prev => !prev)}
                        >
                            {showPassword ? <IconEyeOff className='icon-secondary' /> : <IconEye className='icon-secondary' />}
                        </button>
                    </div>
                    <div className="login-input-line" />
                </div>

                {/* --- Кнопка входа --- */}
                <button type="button" className="button-primary login-button-primary" onClick={handleLogin}>
                    Войти
                </button>

                {/* --- Ссылка на регистрацию --- */}
                <div className="login-register-group">
                    <p className="text-small">Если у вас нет аккаунта</p>
                    <button type="button" className="text-small login-register-link" onClick={() => navigate('/register')}>
                        Вы можете зарегистрироваться здесь!
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
