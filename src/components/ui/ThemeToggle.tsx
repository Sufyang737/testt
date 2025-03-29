"use client";

import { useState, useEffect } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Verificar preferencia guardada en localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      // Cambiar a modo claro
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      // Cambiar a modo oscuro
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors duration-200 ${className}`}
      aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {darkMode ? (
        <SunIcon className="w-5 h-5 text-yellow-300" />
      ) : (
        <MoonIcon className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );
} 