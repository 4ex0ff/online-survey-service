import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import { IconUser, IconMail, IconLock, IconEye, IconEyeOff } from '../components/icons';

function RegisterPage() {
    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    {/* --- Обработчики действий пользователя --- */}
    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!formData.username) {
            newErrors.username = 'Имя пользователя обязательно';
        }

        if (!formData.email) {
            newErrors.email = 'Email обязателен';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Неверный формат email';
        }
    
        if (!formData.password) {
            newErrors.password = 'Пароль обязателен';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Пароль должен содержать не менее 8 символов';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Подтверждение пароля обязательно';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Пароли не совпадают';
        }
    
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleInputChange = useCallback((event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
        if (errors.general) {
            setErrors((prev) => ({ ...prev, general: '' }));
        }
    }, [errors]);

    const handleRegister = useCallback(async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    username: formData.username
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Не удалось зарегистрироваться';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            navigate('/dashboard');
        }catch (error) {
            setErrors({ general: error.message || 'Не удалось зарегистрироваться' });
        } finally {
            setLoading(false);
        }
    }, [formData, navigate, validateForm]);

    {/* --- Разметка страницы --- */}
    return (
        <div className="page register-page">
            <form className="frame register-frame" onSubmit={handleRegister}>
                {/* --- Заголовок --- */}
                <div className="register-title-group">
                    <h1 className="text-h1">Регистрация</h1>
                    <div className="register-title-line" />
                </div>

                {/* --- Юзернейм --- */}
                <div className="register-input-group">
                    <label htmlFor="username" className="text-small">
                        Имя пользователя <span className="required-star">*</span>
                    </label>
                    <div className="register-input-wrapper">
                        <IconUser className='icon-secondary' />
                        <input
                            className="text-helper register-input-field"
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Как к вам обращаться?"
                            value={formData.username}
                            onChange={handleInputChange}
                            aria-invalid={!!errors.username}
                            aria-describedby={errors.username ? 'username-error' : undefined}
                        />
                    </div>
                    <div className="register-input-line" />
                    {errors.username &&
                        <p id="username-error" className="text-helper error-frame">
                            {errors.username}
                        </p>
                    }
                </div>

                {/* --- Email --- */}
                <div className="register-input-group">
                    <label htmlFor="email" className="text-small">
                        Email <span className="required-star">*</span>
                    </label>
                    <div className="register-input-wrapper">
                        <IconMail className='icon-secondary' />
                        <input
                            className="text-helper register-input-field"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                    </div>
                    <div className="register-input-line" />
                    {errors.email &&
                        <p id="email-error" className="text-helper error-frame">
                            {errors.email}
                        </p>
                    }
                </div>

                {/* --- Пароль --- */}
                <div className="register-input-group">
                    <label htmlFor="password" className="text-small">
                        Пароль <span className="required-star">*</span>
                    </label>
                    <div className="register-password-wrapper">
                        <div className="register-input-wrapper">
                            <IconLock className='icon-secondary' />
                            <input
                                className="text-helper register-input-field"
                                id="password"
                                name="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                placeholder="Введите ваш пароль"
                                value={formData.password}
                                onChange={handleInputChange}
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? 'password-error' : undefined}
                            />
                        </div>
                        <button
                            type="button"
                            className="register-password-toggle"
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        >
                            {isPasswordVisible ? <IconEyeOff className='icon-secondary' /> : <IconEye className='icon-secondary' />}
                        </button>
                    </div>
                    <div className="register-input-line" />
                    {errors.password &&
                        <p id="password-error" className="text-helper error-frame">
                            {errors.password}
                        </p>
                    }
                </div>

                {/* --- Подтверждение пароля --- */}
                <div className="register-input-group">
                    <label htmlFor="confirmPassword" className="text-small">
                        Подтвердите пароль <span className="required-star">*</span>
                    </label>
                    <div className="register-password-wrapper">
                        <div className="register-input-wrapper">
                            <IconLock className='icon-secondary' />
                            <input
                                className="text-helper register-input-field"
                                id="confirmPassword"
                                name="confirmPassword"
                                type={isConfirmPasswordVisible ? 'text' : 'password'}
                                placeholder="Подтвердите ваш пароль"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                aria-invalid={!!errors.confirmPassword}
                                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                            />
                        </div>
                        <button
                            type="button"
                            className="register-password-toggle"
                            onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        >
                            {isConfirmPasswordVisible ? <IconEyeOff className='icon-secondary' /> : <IconEye className='icon-secondary' />}
                        </button>
                    </div>
                    <div className="register-input-line" />
                    {errors.confirmPassword &&
                        <p id="confirmPassword-error" className="text-helper error-frame">
                            {errors.confirmPassword}
                        </p>
                    }
                </div>

                {/* --- Кнопки --- */}
                <div className="register-submit-group">
                    {/* --- Общая ошибка --- */}
                    {errors.general &&
                        <div className="error-frame" role="alert">
                            {errors.general}
                        </div>
                    }

                    <button type="submit" className="button-primary register-button-primary">
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                    <button type="button" className="button-secondary register-button-secondary" onClick={() => navigate('/login')}>
                        Назад
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RegisterPage;
