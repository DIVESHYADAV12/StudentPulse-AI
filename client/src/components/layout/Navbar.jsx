import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  Target, 
  BrainCircuit, 
  TrendingUp, 
  Bot, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Skill Gap', path: '/skill-gap', icon: Target },
    { name: 'Interview Prep', path: '/interview', icon: BrainCircuit },
    { name: 'Action Plan', path: '/action-plan', icon: TrendingUp },
    { name: 'Career Mentor', path: '/mentor', icon: Bot },
  ];

  return (
    <header className="border-b border-cream-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-forest-900 group-hover:bg-forest-800 flex items-center justify-center text-white shadow-premium transition-colors">
            <Sparkles className="w-6 h-6 text-forest-300" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-forest-950 flex items-center gap-1.5">
              StudentPulse <span className="text-forest-600 font-extrabold">AI</span>
            </span>
            <p className="text-[11px] text-navy-800/60 font-semibold uppercase tracking-wider">Career Readiness</p>
          </div>
        </NavLink>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-cream-100/60 p-1.5 rounded-2xl border border-cream-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-forest-900 shadow-soft border border-cream-200/60'
                      : 'text-navy-800/70 hover:text-navy-950 hover:bg-white/50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Account & Mobile Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <NavLink 
            to="/profile"
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-cream-100/80 hover:bg-cream-200/80 border border-cream-200 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-forest-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {user?.full_name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-navy-900 truncate max-w-[120px]">{user?.full_name}</p>
              <p className="text-[10px] text-forest-700 font-medium">Student</p>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="hidden sm:inline-flex p-2 rounded-xl text-navy-800/60 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-cream-100 border border-cream-200 text-navy-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-cream-200 bg-white px-6 py-4 space-y-2 shadow-premium">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-forest-50 text-forest-900 border border-forest-200'
                      : 'text-navy-800 hover:bg-cream-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-forest-700" />
                {item.name}
              </NavLink>
            );
          })}
          <div className="pt-3 border-t border-cream-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
