import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';

function RegisterPage() {
    const navigate = useNavigate();
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    
    return (
        <div className='page'>
            <div className="frame">
                {/*  --- Заголовок ---   */}
                <div className="title-wrapper">
                    <div className="title-label">Регистрация</div>
                    <div className="title-line"></div>
                </div>

                {/* --- Юзернейм --- */}
                <div className="field-wrapper">
                    <div className="field-label">Имя пользователя</div>
                    <div className="field-input">
                        <div className='input-wrapper'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <input className="input" name="username" type='username' placeholder="Как к вам обращаться?" />
                        </div>
                    </div>
                    <div className="field-line"></div>
                </div>

                {/*  --- Почта ---   */}
                <div className="field-wrapper">
                    <div className="field-label">Email</div>
                    <div className="field-input">
                        <div className='input-wrapper'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 7L13.009 12.727C12.7039 12.9042 12.3573 12.9976 12.0045 12.9976C11.6517 12.9976 11.3051 12.9042 11 12.727L2 7" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <input className="input" name="email" type="email" placeholder="Введите ваш email" />
                        </div>
                    </div>
                    <div className="field-line"></div>
                </div>

                {/*  --- Пароль ---   */}
                <div className="field-wrapper">
                    <div className="field-label">Пароль</div>
                    <div className="field-input">
                        <div className="input-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <input className="input" name="password" type={showPassword1 ? "text" : "password"} placeholder="Введите ваш пароль" />
                        </div>
                        <button className="password-toggle" type="button" onClick={() => setShowPassword1(!showPassword1)}>
                            {showPassword1 ?
                            (<svg name='closedEyeIcon' width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.733 5.07599C13.0624 4.7984 15.4186 5.29081 17.4419 6.47804C19.4651 7.66527 21.0442 9.48207 21.938 11.651C22.0213 11.8755 22.0213 12.1225 21.938 12.347C21.5699 13.2377 21.0843 14.0751 20.494 14.837M14.084 14.158C13.5182 14.7045 12.7604 15.0068 11.9738 15C11.1872 14.9932 10.4348 14.6777 9.87853 14.1214C9.3223 13.5652 9.0068 12.8128 8.99996 12.0262C8.99313 11.2396 9.29551 10.4818 9.84198 9.91599" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M17.479 17.499C16.1525 18.2848 14.6724 18.776 13.1393 18.9394C11.6062 19.1028 10.0559 18.9345 8.59362 18.4459C7.1313 17.9573 5.79118 17.1599 4.6642 16.1077C3.53722 15.0556 2.64974 13.7734 2.06199 12.348C1.97865 12.1235 1.97865 11.8765 2.06199 11.652C2.94862 9.50186 4.50866 7.69725 6.50799 6.509M1.99999 2L22 22" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>)
                            :
                            (<svg name='openEyeIcon' width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.06202 12.348C1.97868 12.1235 1.97868 11.8765 2.06202 11.652C2.87372 9.68385 4.25153 8.00103 6.02079 6.81689C7.79004 5.63275 9.87106 5.00061 12 5.00061C14.129 5.00061 16.21 5.63275 17.9792 6.81689C19.7485 8.00103 21.1263 9.68385 21.938 11.652C22.0214 11.8765 22.0214 12.1235 21.938 12.348C21.1263 14.3161 19.7485 15.999 17.9792 17.1831C16.21 18.3672 14.129 18.9994 12 18.9994C9.87106 18.9994 7.79004 18.3672 6.02079 17.1831C4.25153 15.999 2.87372 14.3161 2.06202 12.348Z" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>)
                            }
                        </button>
                    </div>
                    <div className="field-line"></div>
                </div>

                {/*  --- Подтверждение пароля ---   */}
                <div className="field-wrapper">
                    <div className="field-label">Подтвердите пароль</div>
                    <div className="field-input">
                        <div className="input-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <input className="input" name="password" type={showPassword2 ? "text" : "password"} placeholder="Подтвердите ваш пароль" />
                        </div>
                        <button className="password-toggle" type="button" onClick={() => setShowPassword2(!showPassword2)}>
                            {showPassword2 ?
                            (<svg name='closedEyeIcon' width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.733 5.07599C13.0624 4.7984 15.4186 5.29081 17.4419 6.47804C19.4651 7.66527 21.0442 9.48207 21.938 11.651C22.0213 11.8755 22.0213 12.1225 21.938 12.347C21.5699 13.2377 21.0843 14.0751 20.494 14.837M14.084 14.158C13.5182 14.7045 12.7604 15.0068 11.9738 15C11.1872 14.9932 10.4348 14.6777 9.87853 14.1214C9.3223 13.5652 9.0068 12.8128 8.99996 12.0262C8.99313 11.2396 9.29551 10.4818 9.84198 9.91599" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M17.479 17.499C16.1525 18.2848 14.6724 18.776 13.1393 18.9394C11.6062 19.1028 10.0559 18.9345 8.59362 18.4459C7.1313 17.9573 5.79118 17.1599 4.6642 16.1077C3.53722 15.0556 2.64974 13.7734 2.06199 12.348C1.97865 12.1235 1.97865 11.8765 2.06199 11.652C2.94862 9.50186 4.50866 7.69725 6.50799 6.509M1.99999 2L22 22" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>)
                            :
                            (<svg name='openEyeIcon' width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.06202 12.348C1.97868 12.1235 1.97868 11.8765 2.06202 11.652C2.87372 9.68385 4.25153 8.00103 6.02079 6.81689C7.79004 5.63275 9.87106 5.00061 12 5.00061C14.129 5.00061 16.21 5.63275 17.9792 6.81689C19.7485 8.00103 21.1263 9.68385 21.938 11.652C22.0214 11.8765 22.0214 12.1235 21.938 12.348C21.1263 14.3161 19.7485 15.999 17.9792 17.1831C16.21 18.3672 14.129 18.9994 12 18.9994C9.87106 18.9994 7.79004 18.3672 6.02079 17.1831C4.25153 15.999 2.87372 14.3161 2.06202 12.348Z" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>)
                            }
                        </button>
                    </div>
                    <div className="field-line"></div>
                </div>

                {/*  --- Кнопки ---   */}
                <div className='button-wrapper'>
                    {/*  --- Кнопка "Зарегистрироваться" ---   */}
                    <button className="button-register" type="button">Зарегистрироваться</button>
                    {/*  --- Кнопка "Назад" ---   */}
                    <button className="button-back" type="button" onClick={() => navigate('/login')}>
                        Назад
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;