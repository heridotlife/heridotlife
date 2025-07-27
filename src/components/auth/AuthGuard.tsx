'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  fallback = <div>Loading...</div>,
  redirectTo = '/login',
}: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Include cookies
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          // Not authenticated, redirect to login
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Show children only if authenticated
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // This should not be reached as we redirect in useEffect
  return null;
}
