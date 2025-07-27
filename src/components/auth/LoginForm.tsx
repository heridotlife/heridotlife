'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

import Button from '@/components/buttons/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function LoginForm({
  onSuccess,
  redirectTo = '/dashboard',
}: LoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<LoginFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Redirect to dashboard or specified page
      router.push(redirectTo);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6 w-full max-w-md'>
      <div>
        <label
          htmlFor='email'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Email Address
        </label>
        <input
          type='email'
          id='email'
          name='email'
          value={formData.email}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder='Enter your email'
          disabled={isLoading}
        />
        {errors.email && (
          <p className='mt-1 text-sm text-red-600'>{errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor='password'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Password
        </label>
        <input
          type='password'
          id='password'
          name='password'
          value={formData.password}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.password ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder='Enter your password'
          disabled={isLoading}
        />
        {errors.password && (
          <p className='mt-1 text-sm text-red-600'>{errors.password}</p>
        )}
      </div>

      {submitError && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{submitError}</p>
        </div>
      )}

      <Button type='submit' disabled={isLoading} className='w-full'>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
