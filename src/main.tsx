import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Filter out benign internal worker warnings like "Dependent image isn't ready yet"
if (typeof window !== 'undefined') {
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    const firstArg = typeof args[0] === 'string' ? args[0] : '';
    if (firstArg.includes("Dependent image isn't ready yet") || firstArg.includes("Canvas is not ready")) {
      return;
    }
    origWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
