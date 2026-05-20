import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { getAuthErrorMessage } from '../api/errorMessages';
import './RegisterPage.scss';
import { IconUser, IconMail, IconLock, IconEye, IconEyeOff } from '../components/icons';

function RegisterPage() {
    {/* --- Состояния компонента --- */}
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    {/* --- Обработчики действий пользователя --- */}
    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!formData.name) {
            newErrors.name = 'Имя обязательно';
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
            await registerUser({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            navigate('/login', { state: { message: 'Регистрация прошла успешно! Войдите в аккаунт.' } });
        } catch (error) {
            setErrors({ general: getAuthErrorMessage(error, 'Не удалось зарегистрироваться') });
        } finally {
            setLoading(false);
        }
    }, [formData, navigate, validateForm]);

    {/* --- Разметка страницы --- */}
    return (
        <div className="page register-page">
            <form className="frame" onSubmit={handleRegister}>
                {/* --- Заголовок --- */}
                <div className="title-group">
                    <h1 className="text-h1">Регистрация</h1>
                    <div className="line-separator" />
                </div>

                {/* --- Юзернейм --- */}
                <div className="input-group">
                    <label htmlFor="name" className="text-body">
                        Имя пользователя <span className="required-star">*</span>
                    </label>
                    <div className="input-wrapper">
                        <IconUser className='icon-secondary' />
                        <input
                            className="text-helper input-field"
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Как к вам обращаться?"
                            value={formData.name}
                            onChange={handleInputChange}
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? 'name-error' : undefined}
                        />
                    </div>
                    <div className="input-line" />
                    {errors.name &&
                        <p id="name-error" className="input-error">
                            {errors.name}
                        </p>
                    }
                </div>

                {/* --- Email --- */}
                <div className="input-group">
                    <label htmlFor="email" className="text-body">
                        Email <span className="required-star">*</span>
                    </label>
                    <div className="input-wrapper">
                        <IconMail className='icon-secondary' />
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
                            <IconLock className='icon-secondary' />
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
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        >
                            {isPasswordVisible ? <IconEyeOff className='icon-secondary' /> : <IconEye className='icon-secondary' />}
                        </button>
                    </div>
                    <div className="input-line" />
                    {errors.password &&
                        <p id="password-error" className="input-error">
                            {errors.password}
                        </p>
                    }
                </div>

                {/* --- Подтверждение пароля --- */}
                <div className="input-group">
                    <label htmlFor="confirmPassword" className="text-body">
                        Подтвердите пароль <span className="required-star">*</span>
                    </label>
                    <div className="password-wrapper">
                        <div className="input-wrapper">
                            <IconLock className='icon-secondary' />
                            <input
                                className="text-helper input-field"
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
                            className="button-icon"
                            onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        >
                            {isConfirmPasswordVisible ? <IconEyeOff className='icon-secondary' /> : <IconEye className='icon-secondary' />}
                        </button>
                    </div>
                    <div className="input-line" />
                    {errors.confirmPassword &&
                        <p id="confirmPassword-error" className="input-error">
                            {errors.confirmPassword}
                        </p>
                    }
                </div>

                {/* --- Кнопки --- */}
                <div className="submit-group">
                    {/* --- Общая ошибка --- */}
                    {errors.general &&
                        <div className="error-frame" role="alert">
                            {errors.general}
                        </div>
                    }

                    <button type="submit" className="button-primary">
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                    <button type="button" className="button-secondary" onClick={() => navigate('/login')}>
                        Назад
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RegisterPage;
