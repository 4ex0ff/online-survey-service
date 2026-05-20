function IconEyeOff({width = 24, color = "var(--icon-color)", className, style}) {
    return (
        <svg width={width} height={width} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <path d="M10.733 5.07599C13.0624 4.7984 15.4186 5.29081 17.4419 6.47804C19.4651 7.66527 21.0442 9.48207 21.938 11.651C22.0213 11.8755 22.0213 12.1225 21.938 12.347C21.5699 13.2377 21.0843 14.0751 20.494 14.837M14.084 14.158C13.5182 14.7045 12.7604 15.0068 11.9738 15C11.1872 14.9932 10.4348 14.6777 9.87853 14.1214C9.3223 13.5652 9.0068 12.8128 8.99996 12.0262C8.99313 11.2396 9.29551 10.4818 9.84198 9.91599" stroke={color} strokeWidth="var(--icon-strokeWidth)" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.479 17.499C16.1525 18.2848 14.6724 18.776 13.1393 18.9394C11.6062 19.1028 10.0559 18.9345 8.59362 18.4459C7.1313 17.9573 5.79118 17.1599 4.6642 16.1077C3.53722 15.0556 2.64974 13.7734 2.06199 12.348C1.97865 12.1235 1.97865 11.8765 2.06199 11.652C2.94862 9.50186 4.50866 7.69725 6.50799 6.509M1.99999 2L22 22" stroke={color} strokeWidth="var(--icon-strokeWidth)" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default IconEyeOff;
