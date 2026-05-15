import './MakerQuestionCard.scss';
import { IconChevronDown, IconCircle, IconGripHorizontal, IconSquare, IconToggleOff, IconToggleOn, IconTrash, IconX } from "../icons";

function QuestionCard({ question, onUpdate, onDelete, createNewOption, error = {}, isEditable = true }) {
    const handleChangeText = (e) => {
        onUpdate(question.id || question.questionID, { content: e.target.value });
    };

    const handleChangeType = (e) => {
        onUpdate(question.id || question.questionID, { type: e.target.value });
    };

    const handleChangeRequired = () => {
        onUpdate(question.id || question.questionID, { isRequired: !question.isRequired });
    };

    const handleAddOption = () => {
        const nextOrder = (question.options?.length || 0) + 1;
        const newOption = createNewOption(nextOrder);
        onUpdate(question.id || question.questionID, {
            options: [...(question.options || []), newOption]
        });
    };

    const handleUpdateOption = (optId, newText) => {
        const updated = question.options.map(opt =>
            (opt.id === optId || opt.optionID === optId)
                ? { ...opt, text: newText }
                : opt
        );
        onUpdate(question.id || question.questionID, { options: updated });
    };

    const handleDeleteOption = (optId) => {
        const remaining = question.options.filter(opt =>
            opt.id !== optId && opt.optionID !== optId
        );
        
        const reordered = remaining.map((opt, idx) => ({
            ...opt,
            order: idx + 1
        }));
        
        onUpdate(question.id || question.questionID, { options: reordered });
    };

    const handleDeleteQuestion = () => {
        onDelete(question.id || question.questionID);
    };

    let optionsContent;
    if (question.type === 'text') {
        optionsContent = (
            <div className="input-group">
                <textarea
                    className="text-body input-field"
                    rows='1'
                    placeholder="Развёрнутый ответ"
                    disabled
                />
                <div className="input-line" />
            </div>
        );
    } else if (question.type === 'single' || question.type === 'multiple') {
        optionsContent = (
            <div className="input-group">
                {error?.optionsCount && <p className='input-error'>{error.optionsCount}</p>}
                <div className="options-list">
                    {(question.options || []).map(option => (
                        <div className="input-group option-wrapper" key={option.id || option.optionID}>
                            <div className="input-wrapper">
                                {question.type === 'single' 
                                    ? <IconCircle className="icon-secondary" color="#777777"/>
                                    : <IconSquare className="icon-secondary" color="#777777"/>
                                }
                                <div className='input-group'>
                                    <input
                                        className={'input-field'}
                                        id={`option-${option.id || option.optionID}`}
                                        value={option.text}
                                        onChange={(e) => handleUpdateOption(option.id || option.optionID, e.target.value)}
                                        placeholder="Вариант ответа"
                                        disabled={!isEditable}
                                        aria-invalid={!!error?.options?.[option.id || option.optionID]}
                                        aria-describedby={error?.options?.[option.id || option.optionID] ? `option-${option.id || option.optionID}-error` : undefined}
                                    />
                                    {error?.options?.[option.id || option.optionID] && 
                                        <p id={`option-${option.id || option.optionID}-error`} className='input-error' role='alert'>
                                            {error.options[option.id || option.optionID]}
                                        </p>
                                    }
                                </div>
                            </div>
                            {isEditable && (
                                <button
                                    className="button-icon"
                                    type="button"
                                    onClick={() => handleDeleteOption(option.id || option.optionID)}
                                >
                                    <IconX className="icon-secondary" />
                                </button>
                            )}
                        </div>
                    ))}
                    {isEditable && (
                        <button type="button" className="button-add-option" onClick={handleAddOption}>
                            <div className="input-wrapper">
                                {question.type === 'single' 
                                    ? <IconCircle className="icon-secondary" color="#777777"/>
                                    : <IconSquare className="icon-secondary" color="#777777"/>
                                }
                                Добавить вариант
                            </div>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="frame maker-question-card">
            {isEditable && <IconGripHorizontal className="icon-primary" color="#777777" />}
            <div className="content-group">
                <div className="title-group">
                    <div className="input-group">
                        <input
                            className={'text-h3 input-field'}
                            id={`question-${question.id || question.questionID}`}
                            value={question.content}
                            onChange={handleChangeText}
                            disabled={!isEditable}
                            placeholder="Новый вопрос"
                            aria-invalid={!!error?.content}
                            aria-describedby={error?.content ? `question-${question.id || question.questionID}-error` : undefined}
                        />
                        <div className="input-line" />
                        {error?.content && <p id={`question-${question.id || question.questionID}-error`} className='input-error' role='alert'>{error.content}</p>}
                    </div>
                    <div className="type-select-wrapper">
                        <select 
                            className="text-body input-field type-select" 
                            value={question.type} 
                            onChange={handleChangeType}
                            disabled={!isEditable}
                        >
                            <option value="single">Один из списка</option>
                            <option value="multiple">Несколько из списка</option>
                            <option value="text">Текст</option>
                        </select>
                        <IconChevronDown className="icon-primary type-select-icon" />
                    </div>
                </div>

                <div className="options-group">
                    {optionsContent}
                </div>

                <div className="line-separator" />
                <div className="footer-group">
                    <div className="input-wrapper">
                        {isEditable && (
                            <button
                                type="button"
                                className="button-icon"
                                onClick={handleChangeRequired}
                            >
                                {question.isRequired 
                                    ? <IconToggleOn className="icon-primary" />
                                    : <IconToggleOff className="icon-primary" />
                                }
                            </button>
                        )}
                        <span className="text-body">
                            {question.isRequired ? 'Обязательный вопрос' : 'Опциональный вопрос'}
                        </span>
                    </div>
                    {isEditable && (
                        <button 
                            type="button" 
                            className="button-icon"
                            onClick={handleDeleteQuestion}
                        >
                            <IconTrash className="icon-primary" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuestionCard;