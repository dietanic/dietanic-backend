
import React, { useState } from 'react';
import { useAuth } from '../App';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Mail, Lock, User as UserIcon, Loader, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        let success = false;
        if (isLogin) {
            success = await signIn(formData.email, formData.password);
        } else {
            success = await signUp(formData.email, formData.password, formData.name);
        }

        setIsLoading(false);
        
        if (success) {
            const redirect = searchParams.get('redirect') || '/';
            navigate(redirect);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center pt-16 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center items-center gap-2 mb-6 group">
                    <div className="bg-brand-600 p-2 rounded-full shadow-md group-hover:scale-110 transition-transform">
                        <Leaf className="text-white h-6 w-6" fill="currentColor" />
                    </div>
                    <span className="font-black text-3xl tracking-tight text-brand-900">Dietanic</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <button 
                        onClick={() => setIsLogin(!isLogin)} 
                        className="font-medium text-brand-600 hover:text-brand-500 underline focus:outline-none"
                    >
                        {isLogin ? 'start your fresh journey today' : 'sign in if you have one'}
                    </button>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                                        placeholder="Jane Doe"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>

                        {isLogin && (
                            <div className="flex items-center justify-end">
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-brand-600 hover:text-brand-500">
                                        Forgot your password?
                                    </a>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="animate-spin h-5 w-5" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                
                {!isLogin && (
                    <p className="mt-6 text-center text-xs text-gray-500">
                        By signing up, you agree to our{' '}
                        <Link to="/terms" className="font-medium text-brand-600 hover:text-brand-500">Terms</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="font-medium text-brand-600 hover:text-brand-500">Privacy Policy</Link>.
                    </p>
                )}
            </div>
        </div>
    );
};
