function IconFilter({width = 24, color = "var(--icon-color)", className, style}) {
    return (
        <svg width={width} height={width} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke={color} strokeWidth="var(--icon-strokeWidth)" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default IconFilter;
