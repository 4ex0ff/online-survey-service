export function validateLoginForm(formData) {
    const errors = {};

    if (!formData.email) {
        errors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Неверный формат email';
    }

    if (!formData.password) {
        errors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
        errors.password = 'Пароль должен содержать не менее 8 символов';
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
}

export function validateRegisterForm(formData) {
    const errors = {};

    if (!formData.name) {
        errors.name = 'Имя обязательно';
    }

    if (!formData.email) {
        errors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Неверный формат email';
    }

    if (!formData.password) {
        errors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
        errors.password = 'Пароль должен содержать не менее 8 символов';
    }

    if (!formData.confirmPassword) {
        errors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Пароли не совпадают';
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
}

export function validateSurveyForm(formData) {
    const errors = {};

    if (!formData.title.trim()) {
        errors.title = 'Название опроса обязательно';
    }

    if (formData.closedAt && new Date(formData.closedAt) < new Date()) {
        errors.closedAt = 'Некорректная дата закрытия опроса';
    }

    if (formData.questions.length === 0) {
        errors.questions = 'Добавьте хотя бы один вопрос';
    }

    for (const q of formData.questions) {
        const questionErrors = {};
        if (!q.content.trim()) {
            questionErrors.content = 'Текст вопроса обязателен';
        }
        if (q.type === 'single' || q.type === 'multiple') {
            if (!q.options || q.options.length < 2) {
                questionErrors.optionsCount = 'Для вопросов c одним или несколькими вариантами ответа нужно добавить хотя бы 2 варианта ответа';
            } else {
                if (q.options.some(opt => !opt.text.trim())) {
                    const optionErrors = {};
                    q.options.forEach(opt => {
                        if (!opt.text.trim()) {
                            optionErrors[opt.id || opt.optionID] = 'Текст варианта обязателен';
                        }
                    });
                    questionErrors.options = optionErrors;
                }
            }
        }
        if (Object.keys(questionErrors).length > 0) {
            errors[q.id || q.questionID] = questionErrors;
        }
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
}

export function validateSurveyResponse(survey, answers) {
    const errorsId = [];

    for (const question of survey.questions) {
        if (!question.isRequired) continue;

        const answer = answers[question.questionID];
        if (question.type === 'text') {
            if (!answer || !answer.trim() === '') {
                errorsId.push(question.orderPriority + 1);
            }
        } else if (question.type === 'single') {
            if (!answer) {
                errorsId.push(question.orderPriority + 1);
            }
        } else if (question.type === 'multiple') {
            if (!answer || answer.length === 0) {
                errorsId.push(question.orderPriority + 1);
            }
        }
    }

    return {
        errorsId,
        isValid: Object.keys(errors).length === 0
    };
}