import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { loginUser } from '../api/auth';
import { getAuthErrorMessage } from '../api/errorMessages';
import './LoginPage.scss';
import { IconMail, IconLock, IconEye, IconEyeOff } from '../components/icons';

function LoginPage() {
    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const success = location.state?.message || "";

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
                const data = await loginUser({
                    email: formData.email,
                    password: formData.password
                });
                signIn({ token: data.token, user: data.user });
                navigate('/dashboard');
            } catch (error) {
                setErrors({ general: getAuthErrorMessage(error, 'Не удалось выполнить вход') });
            } finally {
                setLoading(false);
            }
        },
        [formData, navigate, validateForm, signIn]
    );

    {/* --- Разметка страницы --- */}
    return (
        <div className="page login-page">
            <form className="frame" onSubmit={handleSubmit}>
                {/* --- Заголовок --- */}
                <div className="title-group">
                    <h1 className="text-h1">Авторизация</h1>
                    <div className="line-separator" />
                    {success &&
                        <div className='success-frame' role='status'>
                            {success}
                        </div>
                    }
                </div>

                {/* --- Email --- */}
                <div className="input-group">
                    <label htmlFor="email" className="text-body">
                        Email <span className="required-star">*</span>
                    </label>
                    <div className="input-wrapper">
                        <IconMail className="icon-secondary" />
                        <input
                            className="text-helper input-field"
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
                    <div className="input-line" />
                    {errors.email &&
                        <p id="email-error" className="input-error">
                            {errors.email}
                        </p>
                    }
                </div>

                {/* --- Пароль --- */}
                <div className="input-group">
                    <label htmlFor="password" className="text-body">
                        Пароль <span className="required-star">*</span>
                    </label>
                    <div className="password-wrapper">
                        <div className="input-wrapper">
                            <IconLock className="icon-secondary" />
                            <input
                                className="text-helper input-field"
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
                            className="button-icon"
                            onClick={() => setIsPasswordVisible((prev) => !prev)}
                            >
                            {isPasswordVisible ? (
                                <IconEyeOff className="icon-secondary" />
                            ) : (
                                <IconEye className="icon-secondary" />
                            )}
                        </button>
                    </div>
                    <div className="input-line" />
                    {errors.password &&
                        <p id="password-error" className="input-error">
                            {errors.password}
                        </p>
                    }
                </div>

                <div className="submit-group">
                    {/* --- Общая ошибка --- */}
                    {errors.general &&
                        <div className="error-frame" role="alert">
                            {errors.general}
                        </div>
                    }

                    {/* --- Кнопка входа --- */}
                    <button type="submit" className="button-primary" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </div>

                {/* --- Ссылка на регистрацию --- */}
                <div className="register-group">
                    <p className="text-small">Если у вас нет аккаунта</p>
                    <button type="button" className="text-small text-link" onClick={() => navigate('/register')}>
                        Вы можете зарегистрироваться здесь!
                    </button>
                </div>
            </form>
        </div>
    );
}

export default LoginPage;