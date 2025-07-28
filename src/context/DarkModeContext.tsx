'use client';

// /src/context/DarkModeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type DarkModeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const DarkModeContext = createContext<DarkModeContextType | undefined>(
  undefined,
);

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [darkMode, setDarkMode] = useState<boolean>(false); // Default to false for SSR

  // Initialize dark mode on client side
  useEffect(() => {
    // Check local storage for user preference
    const storedMode = localStorage.getItem('darkMode');
    if (storedMode !== null) {
      setDarkMode(storedMode === 'true');
    } else {
      // If not set, check the user's system preference
      const prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', String(newMode));
      }
      return newMode;
    });
  };

  useEffect(() => {
    // Set body class based on darkMode state
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
