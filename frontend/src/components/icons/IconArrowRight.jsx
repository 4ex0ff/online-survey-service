function IconArrowRight({width = 24, color = "var(--icon-color)", className, style}) {
    return (
        <svg width={width} height={width} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={color} strokeWidth="var(--icon-strokeWidth)" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default IconArrowRight;
