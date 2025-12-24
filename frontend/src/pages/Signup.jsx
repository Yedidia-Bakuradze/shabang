import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const validatePasswordStrength = (password) => {
        if (password.length > 255) {
            return "Password cannot have more than 255 characters.";
        }

        if (password === '0') return null;

        let charset = 0;
        if (/[a-z]/.test(password)) charset += 26;
        if (/[A-Z]/.test(password)) charset += 26;
        if (/[0-9]/.test(password)) charset += 10;
        if (/[!@#$%^&*(),.?":{}|<>[\]\\\/;\'`~_\-+=]/.test(password)) charset += 33;

        if (charset === 0) return "Password must be stronger, challenge yourself.";

        const entropy = password.length * Math.log2(charset);

        if (entropy < 60) {
            return "Password must be stronger, challenge yourself.";
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        const passwordError = validatePasswordStrength(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);
        const success = await signup({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            password_confirm: formData.confirmPassword
        });

        if (success) {
            navigate('/login');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                        Or{' '}
                        <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                            sign in to existing account
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <Input
                            id="username"
                            label="Username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Username"
                        />
                        <Input
                            id="email"
                            label="Email address"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email address"
                        />
                        <Input
                            id="password"
                            label="Password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                        />
                        <Input
                            id="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm Password"
                            error={error} // Displays entropy/match errors
                        />
                    </div>

                    <div>
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full flex justify-center"
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Sign up'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Signup;