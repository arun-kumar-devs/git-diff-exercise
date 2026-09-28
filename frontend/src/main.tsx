import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/repositories/:owner/:repository/commit/:commitSHA" element={<App />} />
        <Route path="*" element={<Navigate to="/repositories/golemfactory/clay/commit/a1bf367b3af680b1182cc52bb77ba095764a11f9" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
