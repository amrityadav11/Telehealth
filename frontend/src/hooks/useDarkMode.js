import { useState, useEffect } from 'react';

const useDarkMode = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) return saved === 'true';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('darkMode', isDark);
    }, [isDark]);

    return [isDark, setIsDark];
};

export default useDarkMode;
