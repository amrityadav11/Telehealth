import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

/**
 * Handles the redirect from Google OAuth.
 * URL: /auth/callback?token=<jwt>
 * Stores the token, fetches user info, then redirects to dashboard.
 */
const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error || !token) {
            toast.error('Google sign-in failed. Please try again.');
            navigate('/login', { replace: true });
            return;
        }

        // Store token
        localStorage.setItem('token', token);

        // Fetch user info
        api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(({ data }) => {
                localStorage.setItem('user', JSON.stringify(data.user));
                dispatch({ type: 'auth/login/fulfilled', payload: { token, user: data.user } });
                toast.success(`Welcome, ${data.user.name}!`);

                if (data.user.role === 'admin') navigate('/admin/dashboard', { replace: true });
                else if (data.user.role === 'doctor') navigate('/doctor/dashboard', { replace: true });
                else navigate('/patient/dashboard', { replace: true });
            })
            .catch(() => {
                toast.error('Authentication failed. Please try again.');
                navigate('/login', { replace: true });
            });
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
            <Spinner size="lg" />
            <p className="text-gray-600 font-medium">Completing sign-in...</p>
        </div>
    );
};

export default AuthCallback;
