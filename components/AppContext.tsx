import React, { createContext, useContext } from 'react';

export const AppContext = createContext<{
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
} | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppContext.Provider');
  return context;
};
