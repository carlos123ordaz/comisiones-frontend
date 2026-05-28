import { createContext, useContext, useEffect, useState } from 'react';

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

    return (
        <ThemeCtx.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
            {children}
        </ThemeCtx.Provider>
    );
}

export const useTheme = () => useContext(ThemeCtx);
