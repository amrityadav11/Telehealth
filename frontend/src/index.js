import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store/store';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: { background: '#363636', color: '#fff' },
                    success: { style: { background: '#16a34a' } },
                    error: { style: { background: '#dc2626' } },
                }}
            />
        </Provider>
    </React.StrictMode>
);

// ── PWA Service Worker Registration ──────────────────────────────────────
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration.scope);

                // Check for updates every 60 seconds
                setInterval(() => registration.update(), 60 * 1000);
            })
            .catch((err) => {
                console.warn('Service Worker registration failed:', err);
            });
    });
}
