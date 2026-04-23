import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import { IconUser, IconMail, IconLock, IconEye, IconEyeOff } from '../components/icons';

function RegisterPage() {
    const navigate = useNavigate();
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    
    const handleRegister = () => {
        console.log('Попытка регистрации');
        alert('Демо-режим: регистрация выполнена (заглушка)');
        // Здесь позже будет запрос к бэкенду
    };

    return (
        <div className="page register-page">
            <div className="frame register-frame">
                {/* --- Заголовок --- */}
                <div className="register-title-group">
                    <div className="register-title-label">Регистрация</div>
                    <div className="register-title-line"></div>
                </div>

                {/* --- Юзернейм --- */}
                <div className="register-input-group">
                    <div className="register-input-label">Имя пользователя</div>
                    <div className="register-input-wrapper">
                        <IconUser width={24} height={24} />
                        <input className="register-input-field" name='username' type='username' placeholder='Как к вам обращаться?' />
                    </div>
                    <div className="register-input-line"></div>
                </div>

                {/* --- Почта --- */}
                <div className="register-input-group">
                    <div className="register-input-label">Email</div>
                    <div className="register-input-wrapper">
                        <IconMail width={24} height={24} />
                        <input className="register-input-field" name='email' type='email' placeholder='Введите ваш email' />
                    </div>
                    <div className="register-input-line"></div>
                </div>

                {/* --- Пароль --- */}
                <div className="register-input-group">
                    <div className="register-input-label">Пароль</div>
                    <div className="register-password-wrapper">
                        <div className="register-input-wrapper">
                            <IconLock width={24} height={24} />
                            <input className="register-input-field" name='password' type={showPassword1 ? 'text' : 'password'} placeholder='Введите ваш пароль' />
                        </div>
                        <button className="register-password-toggle" type='button' onClick={() => setShowPassword1(!showPassword1)}>
                            {showPassword1 ?
                            (<IconEyeOff width={24} height={24} />)
                            :
                            (<IconEye width={24} height={24} />)
                            }
                        </button>
                    </div>
                    <div className="register-input-line"></div>
                </div>

                {/* --- Подтверждение пароля --- */}
                <div className="register-input-group">
                    <div className="register-input-label">Подтвердите пароль</div>
                    <div className="register-password-wrapper">
                        <div className="register-input-wrapper">
                            <IconLock width={24} height={24} />
                            <input className="register-input-field" name="password" type={showPassword2 ? "text" : "password"} placeholder="Подтвердите ваш пароль" />
                        </div>
                        <button className="register-password-toggle" type='button' onClick={() => setShowPassword2(!showPassword2)}>
                            {showPassword2 ?
                            (<IconEyeOff width={24} height={24} />)
                            :
                            (<IconEye width={24} height={24} />)
                            }
                        </button>
                    </div>
                    <div className="register-input-line"></div>
                </div>

                {/* --- Кнопки --- */}
                <div className="register-button-group">
                    {/*  --- Кнопка "Зарегистрироваться" ---   */}
                    <button className="button-primary register-button-primary" type='button'onClick={handleRegister}>
                        Зарегистрироваться
                    </button>
                    {/*  --- Кнопка "Назад" ---   */}
                    <button className="button-secondary register-button-secondary" type='button' onClick={() => navigate('/login')}>
                        Назад
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;