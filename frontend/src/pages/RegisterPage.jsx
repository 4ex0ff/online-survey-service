import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { registerUser } from "../api/auth";
import { getApiErrorMessage } from "../api/errorMessages";
import { IconEye, IconEyeOff, IconLock, IconMail, IconUser } from "../components/icons";
import "./RegisterPage.css";

function RegisterPage() {
  // Register адаптирует внешнюю форму под контракт backend: name, email, password.
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", passwordConfirmation: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const validateForm = useCallback(() => {
    // Проверяем ограничения backend перед запросом: name >= 2, password >= 8.
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = "Имя пользователя обязательно";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Имя должно содержать минимум 2 символа";
    }

    if (!formData.email) {
      newErrors.email = "Email обязателен";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Неверный формат email";
    }

    if (!formData.password) {
      newErrors.password = "Пароль обязателен";
    } else if (formData.password.length < 8) {
      newErrors.password = "Пароль должен содержать не менее 8 символов";
    }

    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Подтверждение пароля обязательно";
    } else if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Пароли не совпадают";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      setFormData((current) => ({ ...current, [name]: value }));

      if (errors[name] || errors.general) {
        setErrors((current) => ({ ...current, [name]: "", general: "" }));
      }
    },
    [errors],
  );

  const handleRegister = useCallback(
    async (event) => {
      // Register endpoint пока не возвращает token, поэтому пользователь продолжает через /login.
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setErrors({});

      try {
        await registerUser({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });
        navigate("/login", {
          replace: true,
          state: { message: "Регистрация прошла успешно. Теперь войдите в систему." },
        });
      } catch (error) {
        setErrors({ general: getApiErrorMessage(error, "Не удалось зарегистрироваться") });
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate, validateForm],
  );

  return (
    <div className="page register-page">
      <form className="frame register-frame" onSubmit={handleRegister} noValidate>
        <div className="register-title-group">
          <h1 className="text-h1">Регистрация</h1>
          <div className="register-title-line" />
        </div>

        <div className="register-input-group">
          <label htmlFor="name" className="text-small">
            Имя пользователя <span className="required-star">*</span>
          </label>
          <div className="register-input-wrapper">
            <IconUser className="icon-secondary" />
            <input
              className="text-helper register-input-field"
              id="name"
              name="name"
              type="text"
              placeholder="Как к вам обращаться?"
              value={formData.name}
              onChange={handleInputChange}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              autoComplete="name"
            />
          </div>
          <div className="register-input-line" />
          {errors.name ? (
            <p id="name-error" className="text-helper error-frame">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="register-input-group">
          <label htmlFor="email" className="text-small">
            Email <span className="required-star">*</span>
          </label>
          <div className="register-input-wrapper">
            <IconMail className="icon-secondary" />
            <input
              className="text-helper register-input-field"
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleInputChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="email"
            />
          </div>
          <div className="register-input-line" />
          {errors.email ? (
            <p id="email-error" className="text-helper error-frame">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="register-input-group">
          <label htmlFor="password" className="text-small">
            Пароль <span className="required-star">*</span>
          </label>
          <div className="register-password-wrapper">
            <div className="register-input-wrapper">
              <IconLock className="icon-secondary" />
              <input
                className="text-helper register-input-field"
                id="password"
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Введите ваш пароль"
                value={formData.password}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                autoComplete="new-password"
              />
            </div>
            <button
              type="button"
              className="register-password-toggle"
              onClick={() => setIsPasswordVisible((current) => !current)}
              aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
            >
              {isPasswordVisible ? <IconEyeOff className="icon-secondary" /> : <IconEye className="icon-secondary" />}
            </button>
          </div>
          <div className="register-input-line" />
          {errors.password ? (
            <p id="password-error" className="text-helper error-frame">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="register-input-group">
          <label htmlFor="passwordConfirmation" className="text-small">
            Подтвердите пароль <span className="required-star">*</span>
          </label>
          <div className="register-password-wrapper">
            <div className="register-input-wrapper">
              <IconLock className="icon-secondary" />
              <input
                className="text-helper register-input-field"
                id="passwordConfirmation"
                name="passwordConfirmation"
                type={isConfirmPasswordVisible ? "text" : "password"}
                placeholder="Подтвердите ваш пароль"
                value={formData.passwordConfirmation}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.passwordConfirmation)}
                aria-describedby={errors.passwordConfirmation ? "passwordConfirmation-error" : undefined}
                autoComplete="new-password"
              />
            </div>
            <button
              type="button"
              className="register-password-toggle"
              onClick={() => setIsConfirmPasswordVisible((current) => !current)}
              aria-label={isConfirmPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
            >
              {isConfirmPasswordVisible ? <IconEyeOff className="icon-secondary" /> : <IconEye className="icon-secondary" />}
            </button>
          </div>
          <div className="register-input-line" />
          {errors.passwordConfirmation ? (
            <p id="passwordConfirmation-error" className="text-helper error-frame">
              {errors.passwordConfirmation}
            </p>
          ) : null}
        </div>

        <div className="register-submit-group">
          {errors.general ? (
            <div className="error-frame" role="alert">
              {errors.general}
            </div>
          ) : null}

          <button type="submit" className="button-primary register-button-primary" disabled={loading}>
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
          <button type="button" className="button-secondary register-button-secondary" onClick={() => navigate("/login")}>
            Назад
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegisterPage;
