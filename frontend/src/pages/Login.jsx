import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import PasswordPeekAnimation from '../components/PasswordPeekAnimation';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isTypingPassword, setIsTypingPassword] = useState(false);
    const { login, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(username, password);
        if (success) {
            // Navigation will happen automatically via useEffect when user state updates
        } else {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8 items-center max-w-5xl w-full">
                {/* Character on the left */}
                <div className="hidden lg:block flex-shrink-0">
                    <PasswordPeekAnimation isTyping={isTypingPassword} />
                </div>
                
                {/* Login Form */}
                <Card className="max-w-md w-full space-y-8 p-8 flex-grow">
                    <div>
                        {/* Show character on mobile */}
                        <div className="lg:hidden mb-6">
                            <PasswordPeekAnimation isTyping={isTypingPassword} />
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Sign in to your account
                        </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                            create a new account
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <Input
                            id="username"
                            label="Username"
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                        />
                        <Input
                            id="password"
                            label="Password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setIsTypingPassword(true)}
                            onBlur={() => setIsTypingPassword(false)}
                            placeholder="Password"
                        />
                    </div>

                    <div>
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full flex justify-center"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>
                </form>
            </Card>
            </div>
        </div>
    );
};

export default Login;
