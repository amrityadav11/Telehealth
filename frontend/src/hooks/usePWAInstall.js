import { useState, useEffect } from 'react';

/**
 * usePWAInstall
 * Returns { canInstall, install, isInstalled }
 * - canInstall: true when the browser is ready to show the install prompt
 * - install(): triggers the native install prompt
 * - isInstalled: true if already running as a standalone PWA
 */
const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed (running in standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            setIsInstalled(true);
            return;
        }

        const handler = (e) => {
            e.preventDefault(); // prevent auto-prompt
            setDeferredPrompt(e);
            setCanInstall(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Listen for successful install
        window.addEventListener('appinstalled', () => {
            setCanInstall(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setCanInstall(false);
            setDeferredPrompt(null);
        }
    };

    return { canInstall, install, isInstalled };
};

export default usePWAInstall;
