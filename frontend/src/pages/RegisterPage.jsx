import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import { IconUser, IconMail, IconLock, IconEye, IconEyeOff } from '../components/icons';

function RegisterPage() {
    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    {/* --- Обработчики действий пользователя --- */}
    const handleRegister = () => {
        navigate('/dashboard');
    };

    {/* --- Разметка страницы --- */}
    return (
        <div className="page register-page">
            <div className="frame register-frame">
                {/* --- Заголовок --- */}
                <div className="register-title-group">
                    <h1 className="text-h1">Регистрация</h1>
                    <div className="register-title-line" />
                </div>

                {/* --- Юзернейм --- */}
                <div className="register-input-group">
                    <label htmlFor="username" className="text-small">Имя пользователя</label>
                    <div className="register-input-wrapper">
                        <IconUser className='icon-secondary' />
                        <input
                            className="text-helper register-input-field"
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Как к вам обращаться?"
                        />
                    </div>
                    <div className="register-input-line" />
                </div>

                {/* --- Email --- */}
                <div className="register-input-group">
                    <label htmlFor="email" className="text-small">Email</label>
                    <div className="register-input-wrapper">
                        <IconMail className='icon-secondary' />
                        <input
                            className="text-helper register-input-field"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Введите ваш email"
                        />
                    </div>
                    <div className="register-input-line" />
                </div>

                {/* --- Пароль --- */}
                <div className="register-input-group">
                    <label htmlFor="password" className="text-small">Пароль</label>
                    <div className="register-password-wrapper">
                        <div className="register-input-wrapper">
                            <IconLock className='icon-secondary' />
                            <input
                                className="text-helper register-input-field"
                                id="password"
                                name="password"
                                type={showPassword1 ? 'text' : 'password'}
                                placeholder="Введите ваш пароль"
                            />
                        </div>
                        <button
                            type="button"
                            className="register-password-toggle"
                            onClick={() => setShowPassword1(!showPassword1)}
                        >
                            {showPassword1 ? <IconEyeOff className='icon-secondary' /> : <IconEye className='icon-secondary' />}
                        </button>
                    </div>
                    <div className="register-input-line" />
                </div>

                {/* --- Подтверждение пароля --- */}
                <div className="register-input-group">
                    <label htmlFor="confirmPassword" className="text-small">Подтвердите пароль</label>
                    <div className="register-password-wrapper">
                        <div className="register-input-wrapper">
                            <IconLock className='icon-secondary' />
                            <input
                                className="text-helper register-input-field"
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword2 ? 'text' : 'password'}
                                placeholder="Подтвердите ваш пароль"
                            />
                        </div>
                        <button
                            type="button"
                            className="register-password-toggle"
                            onClick={() => setShowPassword2(!showPassword2)}
                        >
                            {showPassword2 ? <IconEyeOff className='icon-secondary' /> : <IconEye className='icon-secondary' />}
                        </button>
                    </div>
                    <div className="register-input-line" />
                </div>

                {/* --- Кнопки --- */}
                <div className="register-button-group">
                    <button type="button" className="button-primary register-button-primary" onClick={handleRegister}>
                        Зарегистрироваться
                    </button>
                    <button type="button" className="button-secondary register-button-secondary" onClick={() => navigate('/login')}>
                        Назад
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
