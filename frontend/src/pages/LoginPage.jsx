import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { IconMail, IconLock, IconEye, IconEyeOff } from '../components/icons';

function LoginPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        console.log('Попытка входа');
        alert('Демо-режим: вход выполнен (заглушка)');
        // Здесь позже будет запрос к бэкенду
    };

    return (
        <div className="page login-page">
            <div className="frame login-frame">
                {/* --- Заголовок --- */}
                <div className="login-title-group">
                    <div className="login-title-label">Авторизация</div>
                    <div className="login-title-line"></div>
                </div>

                {/* --- Почта --- */}
                <div className="login-input-group">
                    <div className="login-input-label">Email</div>
                    <div className="login-input-wrapper">
                        <IconMail width={24} height={24}/>
                        <input className="login-input-field" name='email' type='email' placeholder='Введите ваш email' />
                    </div>
                    <div className="login-input-line"></div>
                </div>

                {/* --- Пароль --- */}
                <div className="login-input-group">
                    <div className="login-input-label">Пароль</div>
                    <div className="login-password-wrapper">
                        <div className="login-input-wrapper">
                            <IconLock width={24} height={24} />
                            <input className="login-input-field" name='password' type={showPassword ? 'text' : 'password'} placeholder='Введите ваш пароль' />
                        </div>
                        <button className="login-password-toggle" type='button' onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ?
                            (<IconEyeOff width={24} height={24} />)
                            :
                            (<IconEye width={24} height={24} />)
                            }
                        </button>
                    </div>
                    <div className="login-input-line"></div>
                </div>

                {/*  --- Кнопка "Войти" ---   */}
                <button className="button-primary login-button-primary" type='button' onClick={handleLogin}>
                    Войти
                </button>

                {/*  --- Текст о регистрации ---   */}
                <div className="login-register-group">
                    <div className="login-register-text">Если у вас нет аккаунта</div>
                    <button className="login-register-link" onClick={() => navigate('/register')}>
                        Вы можете зарегистрироваться здесь!
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;