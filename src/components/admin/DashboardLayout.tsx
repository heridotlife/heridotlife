'use client';

import { LogOut, Menu, Moon, Sun, X } from '../ui/icons';
import { useEffect, useState } from 'react';
import Button from '../ui/Button';

function DashboardLayout({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const shouldBeDark = savedTheme
      ? savedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isMobileMenuOpen &&
        !target.closest('.mobile-menu') &&
        !target.closest('.mobile-menu-button')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  if (!mounted) {
    return null;
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/urls', label: 'URLs' },
    { href: '/admin/categories', label: 'Categories' },
    { href: '/admin/blog', label: 'Blog' },
    { href: '/admin/cache', label: 'Cache' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Logo and Desktop Nav */}
            <div className="flex items-center space-x-8">
              <a
                href="/admin/dashboard"
                className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Admin<span className="text-sky-500">.</span>
              </a>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex space-x-2">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                      pathname === item.href
                        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Right Side - Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="md"
                icon={isDark ? Sun : Moon}
                className="min-h-[44px] min-w-[44px] p-2 text-amber-500 dark:text-sky-600"
                title="Toggle theme"
              />

              {/* User Info */}
              <div className="text-sm text-slate-500 dark:text-slate-400">Admin</div>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="primary"
                size="md"
                icon={LogOut}
                className="min-h-[44px] bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 hover:from-sky-600 hover:to-cyan-600 dark:hover:from-sky-700 dark:hover:to-cyan-700 shadow-md hover:shadow-lg"
              >
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Theme Toggle */}
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="md"
                icon={isDark ? Sun : Moon}
                className="min-h-[44px] min-w-[44px] p-2 text-amber-500 dark:text-sky-600"
                title="Toggle theme"
              />

              {/* Hamburger Menu Button */}
              <Button
                onClick={toggleMobileMenu}
                variant="ghost"
                size="md"
                icon={isMobileMenuOpen ? X : Menu}
                className="mobile-menu-button min-h-[44px] min-w-[44px] p-2 text-slate-600 dark:text-slate-300"
                title="Toggle menu"
              />
            </div>
          </div>
        </div>

        {/* Mobile Slide-out Menu */}
        <div
          className={`md:hidden mobile-menu absolute top-full left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-lg transform transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-2">
            {/* Navigation Links */}
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block min-h-[44px] px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </a>
            ))}

            {/* Mobile User Info */}
            <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-4 pt-4">
              Logged in as <span className="font-medium">Admin</span>
            </div>

            {/* Mobile Logout Button */}
            <Button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              variant="primary"
              size="md"
              icon={LogOut}
              className="min-h-[44px] bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 hover:from-sky-600 hover:to-cyan-600 dark:hover:from-sky-700 dark:hover:to-cyan-700 shadow-md hover:shadow-lg"
              fullWidth
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
