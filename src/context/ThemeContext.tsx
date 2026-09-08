import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'paper' | 'white' | 'sepia' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('mindrise_theme') as AppTheme;
      if (['paper', 'white', 'sepia', 'dark'].includes(saved)) {
        return saved;
      }
      return 'paper'; // Default to warm editorial paper/white
    } catch {
      return 'paper';
    }
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('mindrise_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const order: AppTheme[] = ['paper', 'white', 'sepia', 'dark'];
    const nextIndex = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply background to body
    if (theme === 'paper') {
      document.body.style.backgroundColor = '#F9F7F2';
      document.body.style.color = '#1A1A1A';
    } else if (theme === 'white') {
      document.body.style.backgroundColor = '#FFFFFF';
      document.body.style.color = '#111827';
    } else if (theme === 'sepia') {
      document.body.style.backgroundColor = '#F4ECD8';
      document.body.style.color = '#2C2416';
    } else if (theme === 'dark') {
      document.body.style.backgroundColor = '#0B0F19';
      document.body.style.color = '#F1F5F9';
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
