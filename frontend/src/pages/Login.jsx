import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';

// Import your SVG
import messAnimation from '/Users/IT-PC/mess-management-app/frontend/src/assets/login.svg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(email, password);
        if (success) {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
            
            {/* ===== FLOATING KITCHEN ELEMENTS ===== */}
            
            {/* Spoon */}
            <div className="absolute top-10 left-10 text-5xl animate-float-slow opacity-30">
                🥄
            </div>
            
            {/* Chef Hat */}
            <div className="absolute top-20 right-20 text-6xl animate-float-medium opacity-25">
                👨‍🍳
            </div>
            
            {/* Fork */}
            <div className="absolute bottom-20 left-20 text-5xl animate-float-fast opacity-30">
                🍴
            </div>
            
            {/* Knife */}
            <div className="absolute bottom-32 right-32 text-5xl animate-float-slow-delay opacity-25">
                🔪
            </div>
            
            {/* Cooking Pot */}
            <div className="absolute top-1/3 left-5 text-4xl animate-float-medium-delay opacity-20">
                🍲
            </div>
            
            {/* Plate */}
            <div className="absolute bottom-1/3 right-5 text-4xl animate-float-fast-delay opacity-20">
                🍽️
            </div>
            
            {/* Salt & Pepper */}
            <div className="absolute top-1/2 left-1/4 text-3xl animate-float-slow opacity-15">
                🧂
            </div>
            <div className="absolute top-1/3 right-1/4 text-3xl animate-float-medium opacity-15">
                🌶️
            </div>
            
            {/* Rolling Pin */}
            <div className="absolute bottom-1/4 left-1/3 text-4xl animate-float-fast opacity-20">
                🥖
            </div>
            
            {/* Whisk */}
            <div className="absolute top-1/4 left-1/2 text-4xl animate-float-slow-delay opacity-15">
                🥄
            </div>
            
            {/* Flour/Bread */}
            <div className="absolute bottom-10 left-1/2 text-4xl animate-float-medium opacity-15">
                🍞
            </div>
            
            {/* ===== PREMIUM ANIMATED LINES ===== */}

            {/* 1. Glowing Traveling Line - Top with trail effect */}
            <div className="absolute top-0 left-0 w-full h-[2px] overflow-hidden">
                <div className="absolute w-1/4 h-full bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-premium-line-1 shadow-[0_0_30px_rgba(168,85,247,0.8)]"></div>
                <div className="absolute w-1/4 h-full bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-premium-line-1-delay shadow-[0_0_30px_rgba(236,72,153,0.6)]"></div>
            </div>

            {/* 2. Glowing Traveling Line - Bottom with trail effect */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] overflow-hidden">
                <div className="absolute w-1/3 h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-premium-line-2 shadow-[0_0_30px_rgba(59,130,246,0.8)]"></div>
                <div className="absolute w-1/3 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-premium-line-2-delay shadow-[0_0_30px_rgba(6,182,212,0.6)]"></div>
            </div>

            {/* 3. Vertical Traveling Line - Left with glow */}
            <div className="absolute top-0 left-0 w-[2px] h-full overflow-hidden">
                <div className="absolute w-full h-1/3 bg-gradient-to-b from-transparent via-purple-400 to-transparent animate-premium-line-3 shadow-[0_0_30px_rgba(168,85,247,0.8)]"></div>
                <div className="absolute w-full h-1/3 bg-gradient-to-b from-transparent via-fuchsia-400 to-transparent animate-premium-line-3-delay shadow-[0_0_30px_rgba(217,70,239,0.6)]"></div>
            </div>

            {/* 4. Vertical Traveling Line - Right with glow */}
            <div className="absolute top-0 right-0 w-[2px] h-full overflow-hidden">
                <div className="absolute w-full h-1/4 bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-premium-line-4 shadow-[0_0_30px_rgba(59,130,246,0.8)]"></div>
                <div className="absolute w-full h-1/4 bg-gradient-to-b from-transparent via-indigo-400 to-transparent animate-premium-line-4-delay shadow-[0_0_30px_rgba(99,102,241,0.6)]"></div>
            </div>

            {/* 5. Diagonal Glowing Line - Top Right to Bottom Left */}
            {/* <div className="absolute top-0 right-0 w-1/2 h-1/2 overflow-hidden opacity-40">
                <div className="absolute w-[200%] h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-premium-diagonal-1 shadow-[0_0_40px_rgba(168,85,247,0.5)]"></div>
            </div> */}

            {/* 6. Diagonal Glowing Line - Bottom Left to Top Right */}
            {/* <div className="absolute bottom-0 left-0 w-1/2 h-1/2 overflow-hidden opacity-40">
                <div className="absolute w-[200%] h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-premium-diagonal-2 shadow-[0_0_40px_rgba(59,130,246,0.5)]"></div>
            </div> */}

            {/* 7. Orbiting Particle Lines */}
            <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full border border-purple-500/20 animate-spin-slow opacity-30"></div>
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full border border-blue-500/20 animate-spin-slow-reverse opacity-30"></div>

            {/* 8. Floating Glowing Dots */}
            <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-float-dot-1"></div>
            <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-float-dot-2"></div>
            <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.6)] animate-float-dot-3"></div>
            <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-float-dot-4"></div>

            {/* Main Content */}
            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center bg-slate-800/40 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 lg:p-10 border border-white/5 relative z-10">
                
                {/* Left Side - SVG Animation */}
                <div className="hidden lg:flex flex-col items-center justify-center space-y-6">
                    <div className="w-full max-w-md">
                        <img 
                            src={messAnimation} 
                            alt="Mess Management Animation" 
                            className="w-full h-auto animate-float"
                        />
                    </div>
                    <div className="text-center text-white">
                        <h2 className="text-3xl font-bold mb-2">Engineer's Mess</h2>
                        <p className="text-white/50">Survive together, thrive together.</p>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg mb-3">
                            <UtensilsCrossed className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Engineer's Mess</h2>
                        <p className="text-white/50 text-sm">Survive together, thrive together.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-700" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-700" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/30"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Signing In...</span>
                                </div>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 text-" />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-white/40">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-xs text-white/20">
                            All Right Reserved by <span className="font-medium text-white/30">Diprodip Das</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;