import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, fullName, password);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 selection:bg-forest-100 selection:text-forest-900">
      <div className="max-w-md w-full bg-white rounded-3xl border border-cream-200/80 p-8 shadow-premium">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-forest-900 text-white flex items-center justify-center mx-auto mb-4 shadow-premium">
            <Sparkles className="w-8 h-8 text-forest-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">Create Student Account</h1>
          <p className="text-sm text-navy-800/70 mt-1">Start your journey toward becoming career-ready</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-navy-800/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full pl-11 pr-4 py-3 bg-cream-50/60 border border-cream-200 rounded-xl text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
              University Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-navy-800/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                className="w-full pl-11 pr-4 py-3 bg-cream-50/60 border border-cream-200 rounded-xl text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
              Password (min. 6 characters)
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
            className="w-full btn-primary py-3 text-sm mt-3 font-bold"
          >
            {loading ? 'Creating Account...' : 'Get Started Free'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-cream-200 text-xs text-navy-800/70">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-forest-700 hover:text-forest-800 underline decoration-forest-300">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
