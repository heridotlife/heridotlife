'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import Button from '@/components/buttons/Button';

const urlSchema = z.object({
  originalUrl: z.string().url('Please provide a valid URL'),
  shortUrl: z
    .string()
    .min(3, 'Short URL must be at least 3 characters')
    .max(20, 'Short URL must be less than 20 characters')
    .optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  categoryIds: z.array(z.number()).optional().default([]),
});

type UrlFormData = z.infer<typeof urlSchema>;

interface Category {
  id: number;
  name: string;
}

interface UrlFormProps {
  urlId?: number;
  initialData?: Partial<UrlFormData>;
  className?: string;
}

export default function UrlForm({
  urlId,
  initialData,
  className = '',
}: UrlFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<UrlFormData>({
    originalUrl: initialData?.originalUrl || '',
    shortUrl: initialData?.shortUrl || '',
    title: initialData?.title || '',
    categoryIds: initialData?.categoryIds || [],
  });
  const [errors, setErrors] = useState<Partial<UrlFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof UrlFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleCategoryChange = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds?.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...(prev.categoryIds || []), categoryId],
    }));
  };

  const validateForm = (): boolean => {
    try {
      urlSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<UrlFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            const fieldName = err.path[0] as string;
            if (fieldName in fieldErrors) {
              (fieldErrors as any)[fieldName] = err.message;
            }
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
      const url = urlId ? `/api/urls/${urlId}` : '/api/urls';
      const method = urlId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save URL');
      }

      // Redirect to URLs list
      router.push('/dashboard/urls');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to save URL',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div>
        <label
          htmlFor='originalUrl'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Original URL *
        </label>
        <input
          type='url'
          id='originalUrl'
          name='originalUrl'
          value={formData.originalUrl}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.originalUrl ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder='https://example.com'
          disabled={isLoading}
        />
        {errors.originalUrl && (
          <p className='mt-1 text-sm text-red-600'>{errors.originalUrl}</p>
        )}
      </div>

      <div>
        <label
          htmlFor='title'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Title *
        </label>
        <input
          type='text'
          id='title'
          name='title'
          value={formData.title}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder='Enter a title for your URL'
          disabled={isLoading}
        />
        {errors.title && (
          <p className='mt-1 text-sm text-red-600'>{errors.title}</p>
        )}
      </div>

      <div>
        <label
          htmlFor='shortUrl'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Custom Short URL (Optional)
        </label>
        <div className='flex'>
          <span className='inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm'>
            {typeof window !== 'undefined'
              ? window.location.origin
              : 'https://heri.life'}
            /
          </span>
          <input
            type='text'
            id='shortUrl'
            name='shortUrl'
            value={formData.shortUrl}
            onChange={handleInputChange}
            className={`flex-1 px-3 py-2 border rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.shortUrl ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder='custom-name'
            disabled={isLoading}
          />
        </div>
        {errors.shortUrl && (
          <p className='mt-1 text-sm text-red-600'>{errors.shortUrl}</p>
        )}
        <p className='mt-1 text-sm text-gray-500'>
          Leave empty to generate automatically
        </p>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Categories (Optional)
        </label>
        {loadingCategories ? (
          <div className='animate-pulse space-y-2'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-4 bg-gray-200 rounded' />
            ))}
          </div>
        ) : (
          <div className='space-y-2'>
            {categories.map((category) => (
              <label key={category.id} className='flex items-center'>
                <input
                  type='checkbox'
                  checked={formData.categoryIds?.includes(category.id) || false}
                  onChange={() => handleCategoryChange(category.id)}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  disabled={isLoading}
                />
                <span className='ml-2 text-sm text-gray-700'>
                  {category.name}
                </span>
              </label>
            ))}
            {categories.length === 0 && (
              <p className='text-sm text-gray-500'>No categories available</p>
            )}
          </div>
        )}
      </div>

      {submitError && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{submitError}</p>
        </div>
      )}

      <div className='flex justify-end space-x-3'>
        <Button
          type='button'
          variant='light'
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type='submit' disabled={isLoading}>
          {isLoading ? 'Saving...' : urlId ? 'Update URL' : 'Create URL'}
        </Button>
      </div>
    </form>
  );
}
