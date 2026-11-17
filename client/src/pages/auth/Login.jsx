import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, Zap } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const performLogin = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.response?.data?.detail || 
        (err.code === "ERR_NETWORK" 
          ? "Cannot connect to server. Ensure backend is running on port 8005 (PYTHONPATH=. python run.py)" 
          : "Failed to login. Please verify your email and password.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(email, password);
  };

  const handleOneClickDemo = () => {
    setEmail('student@university.edu');
    setPassword('password123');
    performLogin('student@university.edu', 'password123');
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 selection:bg-forest-100 selection:text-forest-900">
      <div className="max-w-md w-full bg-white rounded-3xl border border-cream-200/80 p-8 shadow-premium">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-forest-900 text-white flex items-center justify-center mx-auto mb-4 shadow-premium">
            <Sparkles className="w-8 h-8 text-forest-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-navy-800/70 mt-1">Sign in to your Career Readiness command center</p>
        </div>

        {/* One-Click Demo Button */}
        <div className="mb-6 p-4 rounded-2xl bg-forest-50/80 border border-forest-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-soft">
          <div>
            <p className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-forest-600 text-forest-600" /> Demo Account
            </p>
            <p className="text-[11px] text-forest-800/80 mt-0.5">student@university.edu</p>
          </div>
          <button
            type="button"
            onClick={handleOneClickDemo}
            disabled={loading}
            className="w-full sm:w-auto text-xs font-bold text-white bg-forest-700 hover:bg-forest-800 px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign In as Demo'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-navy-800/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-11 pr-4 py-3 bg-cream-50/60 border border-cream-200 rounded-xl text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-navy-800/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-cream-50/60 border border-cream-200 rounded-xl text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-sm mt-2 font-bold"
          >
            {loading ? 'Authenticating...' : 'Sign In to StudentPulse'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-cream-200 text-xs text-navy-800/70">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-forest-700 hover:text-forest-800 underline decoration-forest-300">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
