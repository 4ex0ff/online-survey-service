function IconArrowLeft({width = 24, color = "var(--icon-color)", className, style}) {
    return (
        <svg width={width} height={width} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <path d="M12 19L5 12M5 12L12 5M5 12H19" stroke={color} strokeWidth="var(--icon-strokeWidth)" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default IconArrowLeft;
