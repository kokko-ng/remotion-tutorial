import React, {createContext, useContext} from 'react';
import {themes, type Theme} from './tokens';

const ThemeContext = createContext<Theme>(themes.chalkboard);
const DebugContext = createContext<boolean>(false);

export const ThemeProvider: React.FC<{
  preset: string;
  debugLayout?: boolean;
  children: React.ReactNode;
}> = ({preset, debugLayout = false, children}) => {
  const theme = themes[preset];
  if (!theme) {
    throw new Error(`Unknown preset "${preset}". Available: ${Object.keys(themes).join(', ')}`);
  }
  return (
    <ThemeContext.Provider value={theme}>
      <DebugContext.Provider value={debugLayout}>{children}</DebugContext.Provider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => useContext(ThemeContext);
export const useDebugLayout = (): boolean => useContext(DebugContext);
