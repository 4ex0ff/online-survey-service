function IconChevronRight({width = 24, color = "var(--icon-color)", className, style}) {
    return (
        <svg width={width} height={width} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <path d="M9 18L15 12L9 6" stroke={color} stroke-width="var(--icon-stroke-width)" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    );
}

export default IconChevronRight;

