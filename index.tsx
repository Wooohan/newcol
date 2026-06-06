import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LegalPage from './components/Legal/LegalPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Public, login-free legal route. Accessible directly via link, e.g.
// https://<domain>/privacy-and-terms-and-conditions
const LEGAL_PATH = '/privacy-and-terms-and-conditions';
const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isLegalRoute = currentPath === LEGAL_PATH;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isLegalRoute ? <LegalPage /> : <App />}
  </React.StrictMode>
);
