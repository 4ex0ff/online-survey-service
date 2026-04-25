function IconTextLong({width = 24, color = "var(--icon-color)", className, style}) {
    return (
        <svg width={width} height={width} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <path d="M15 18H3M21 6H3M21 12H3" stroke={color} stroke-width="var(--icon-stroke-width)" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    );
}

export default IconTextLong;

