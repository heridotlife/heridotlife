'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserSettings {
  name: string;
  email: string;
  image: string | null;
  preferences: {
    emailNotifications: boolean;
    defaultPrivacy: 'public' | 'private';
    timezone: string;
    language: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user settings');
      }

      const data = await response.json();

      // Mock settings data - in real app this would come from a settings API
      const mockSettings: UserSettings = {
        name: data.user.name || '',
        email: data.user.email || '',
        image: data.user.image,
        preferences: {
          emailNotifications: true,
          defaultPrivacy: 'public',
          timezone: 'UTC',
          language: 'en',
        },
      };

      setSettings(mockSettings);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch user settings',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!settings) return;

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              [parent]: {
                ...(prev[parent as keyof UserSettings] as Record<string, any>),
                [child]: value,
              },
            }
          : null,
      );
    } else {
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              [field]: value,
            }
          : null,
      );
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // In a real app, this would call a settings API
      // For now, we'll simulate a successful save
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess('Settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to save settings',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/login');
      } else {
        setError('Failed to logout');
      }
    } catch (error) {
      setError('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mb-4'></div>
          <div className='space-y-4'>
            <div className='h-12 bg-gray-200 rounded'></div>
            <div className='h-12 bg-gray-200 rounded'></div>
            <div className='h-12 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className='space-y-6'>
        <div className='text-center py-8'>
          <div className='text-red-600 mb-4'>{error}</div>
          <button
            onClick={fetchUserSettings}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className='space-y-6'>
        <div className='text-center py-8'>
          <div className='text-gray-600 mb-4'>No settings available</div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Settings</h1>
        <p className='text-gray-600'>
          Manage your account preferences and settings
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className='p-4 bg-green-50 border border-green-200 rounded-md'>
          <p className='text-sm text-green-600'>{success}</p>
        </div>
      )}

      {error && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      {/* Profile Settings */}
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Profile Information
          </h2>
        </div>
        <div className='p-6 space-y-4'>
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Name
            </label>
            <input
              type='text'
              id='name'
              value={settings.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={saving}
            />
          </div>

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
              value={settings.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>Preferences</h2>
        </div>
        <div className='p-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-medium text-gray-900'>
                Email Notifications
              </h3>
              <p className='text-sm text-gray-500'>
                Receive notifications about your URL performance
              </p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.preferences.emailNotifications}
                onChange={(e) =>
                  handleInputChange(
                    'preferences.emailNotifications',
                    e.target.checked,
                  )
                }
                className='sr-only peer'
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label
              htmlFor='privacy'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Default Privacy
            </label>
            <select
              id='privacy'
              value={settings.preferences.defaultPrivacy}
              onChange={(e) =>
                handleInputChange('preferences.defaultPrivacy', e.target.value)
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={saving}
            >
              <option value='public'>Public</option>
              <option value='private'>Private</option>
            </select>
          </div>

          <div>
            <label
              htmlFor='timezone'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Timezone
            </label>
            <select
              id='timezone'
              value={settings.preferences.timezone}
              onChange={(e) =>
                handleInputChange('preferences.timezone', e.target.value)
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={saving}
            >
              <option value='UTC'>UTC</option>
              <option value='America/New_York'>Eastern Time</option>
              <option value='America/Chicago'>Central Time</option>
              <option value='America/Denver'>Mountain Time</option>
              <option value='America/Los_Angeles'>Pacific Time</option>
            </select>
          </div>

          <div>
            <label
              htmlFor='language'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Language
            </label>
            <select
              id='language'
              value={settings.preferences.language}
              onChange={(e) =>
                handleInputChange('preferences.language', e.target.value)
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={saving}
            >
              <option value='en'>English</option>
              <option value='es'>Spanish</option>
              <option value='fr'>French</option>
              <option value='de'>German</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Account Actions
          </h2>
        </div>
        <div className='p-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-medium text-gray-900'>Export Data</h3>
              <p className='text-sm text-gray-500'>
                Download your URLs and analytics data
              </p>
            </div>
            <button
              className='px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-900'
              disabled={saving}
            >
              Export
            </button>
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-medium text-gray-900'>
                Delete Account
              </h3>
              <p className='text-sm text-gray-500'>
                Permanently delete your account and all data
              </p>
            </div>
            <button
              className='px-4 py-2 text-sm font-medium text-red-600 hover:text-red-900'
              disabled={saving}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-end space-x-3'>
        <button
          onClick={handleLogout}
          className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          disabled={saving}
        >
          Logout
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
