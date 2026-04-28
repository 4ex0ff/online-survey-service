import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { IconMail, IconLock, IconEye, IconEyeOff } from '../components/icons';

function LoginPage() {
    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    {/* --- Обработчики действий пользователя --- */}
    const validateForm = useCallback(() => {
        const newErrors = {};

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleInputChange = useCallback(
        (event) => {
            const { name, value } = event.target;
            setFormData((prev) => ({ ...prev, [name]: value }));

            if (errors[name]) {
                setErrors((prev) => ({ ...prev, [name]: '' }));
            }
            if (errors.general) {
                setErrors((prev) => ({ ...prev, general: '' }));
            }
        },
        [errors]
    );

    const handleSubmit = useCallback(
        async (event) => {
            event.preventDefault();

            if (!validateForm()) {
                return;
            }

            setLoading(true);
            setErrors({});

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    }),
                });

                if (!response.ok) {
                    let errorMessage = 'Не удалось выполнить вход';
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
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } catch (error) {
                setErrors({ general: error.message || 'Не удалось выполнить вход' });
            } finally {
                setLoading(false);
            }
        },
        [formData, navigate, validateForm]
    );

    {/* --- Разметка страницы --- */}
    return (
        <div className="page login-page">
            <form className="frame login-frame" onSubmit={handleSubmit}>
                {/* --- Заголовок --- */}
                <div className="login-title-group">
                    <h1 className="text-h1">Авторизация</h1>
                    <div className="login-title-line" />
                </div>

                {/* --- Email --- */}
                <div className="login-input-group">
                    <label htmlFor="email" className="login-input-label text-small">
                        Email <span className="required-star">*</span>
                    </label>
                    <div className="login-input-wrapper">
                        <IconMail className="icon-secondary" />
                        <input
                            className="text-helper login-input-field"
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
                    <div className="login-input-line" />
                    {errors.email &&
                        <p id="email-error" className="text-helper error-frame">
                            {errors.email}
                        </p>
                    }
                </div>

                {/* --- Пароль --- */}
                <div className="login-input-group">
                    <label htmlFor="password" className="login-input-label text-small">
                        Пароль <span className="required-star">*</span>
                    </label>
                    <div className="login-password-wrapper">
                        <div className="login-input-wrapper">
                            <IconLock className="icon-secondary" />
                            <input
                                className="text-helper login-input-field"
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
                            className="login-password-toggle"
                            onClick={() => setIsPasswordVisible((prev) => !prev)}
                            >
                            {isPasswordVisible ? (
                                <IconEyeOff className="icon-secondary" />
                            ) : (
                                <IconEye className="icon-secondary" />
                            )}
                        </button>
                    </div>
                    <div className="login-input-line" />
                    {errors.password &&
                        <p id="password-error" className="text-helper error-frame">
                            {errors.password}
                        </p>
                    }
                </div>

                <div className="login-submit-group">
                    {/* --- Общая ошибка --- */}
                    {errors.general &&
                        <div className="error-frame" role="alert">
                            {errors.general}
                        </div>
                    }

                    {/* --- Кнопка входа --- */}
                    <button type="submit" className="button-primary login-button-primary" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </div>

                {/* --- Ссылка на регистрацию --- */}
                <div className="login-register-group">
                    <p className="text-small">Если у вас нет аккаунта</p>
                    <button type="button" className="text-small login-register-link" onClick={() => navigate('/register')}>
                        Вы можете зарегистрироваться здесь!
                    </button>
                </div>
            </form>
        </div>
    );
}

export default LoginPage;
