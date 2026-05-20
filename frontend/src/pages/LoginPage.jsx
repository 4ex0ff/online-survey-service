import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { loginUser } from "../api/auth";
import { getApiErrorMessage } from "../api/errorMessages";
import { IconEye, IconEyeOff, IconLock, IconMail } from "../components/icons";
import { useAuth } from "../providers/useAuth";
import "./LoginPage.css";

function LoginPage() {
  // Эта страница сохраняет внешний визуальный layout, но отправляет данные через наш помощник /api/auth/login.
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const successMessage = location.state?.message || "";
  const redirectPath = location.state?.from || "/dashboard";

  const validateForm = useCallback(() => {
    // Клиентская валидация предотвращает очевидные 400-ответы и быстрее даёт обратную связь.
    const newErrors = {};

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

  const handleSubmit = useCallback(
    async (event) => {
      // Успешный login сохраняет token + user в AuthProvider и открывает защищённый dashboard.
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setErrors({});

      try {
        const response = await loginUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });
        signIn({ token: response.token, user: response.user });
        navigate(redirectPath, { replace: true });
      } catch (error) {
        setErrors({ general: getApiErrorMessage(error, "Не удалось выполнить вход") });
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate, redirectPath, signIn, validateForm],
  );

  return (
    <div className="page login-page">
      <form className="frame login-frame" onSubmit={handleSubmit} noValidate>
        <div className="login-title-group">
          <h1 className="text-h1 dashboard-title-label">Авторизация</h1>
          <div className="login-title-line" />
        </div>

        {successMessage ? <div className="form-success">{successMessage}</div> : null}

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
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="email"
            />
          </div>
          <div className="login-input-line" />
          {errors.email ? (
            <p id="email-error" className="text-helper error-frame">
              {errors.email}
            </p>
          ) : null}
        </div>

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
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Введите ваш пароль"
                value={formData.password}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                autoComplete="current-password"
              />
            </div>
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setIsPasswordVisible((current) => !current)}
              aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
            >
              {isPasswordVisible ? <IconEyeOff className="icon-secondary" /> : <IconEye className="icon-secondary" />}
            </button>
          </div>
          <div className="login-input-line" />
          {errors.password ? (
            <p id="password-error" className="text-helper error-frame">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="login-submit-group">
          {errors.general ? (
            <div className="error-frame" role="alert">
              {errors.general}
            </div>
          ) : null}

          <button type="submit" className="button-primary login-button-primary" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </div>

        <div className="login-register-group">
          <p className="text-small">Если у вас нет аккаунта</p>
          <button type="button" className="text-small login-register-link" onClick={() => navigate("/register")}>
            Вы можете зарегистрироваться здесь!
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
