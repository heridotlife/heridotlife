import { getFromLocalStorage, getFromSessionStorage } from '../helper';

describe('helper', () => {
  describe('getFromLocalStorage', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('retrieves value from localStorage', () => {
      localStorage.setItem('testKey', 'testValue');
      const result = getFromLocalStorage('testKey');
      expect(result).toBe('testValue');
    });

    it('returns null when key does not exist', () => {
      const result = getFromLocalStorage('nonExistentKey');
      expect(result).toBeNull();
    });

    it('handles empty string values', () => {
      localStorage.setItem('emptyKey', '');
      const result = getFromLocalStorage('emptyKey');
      expect(result).toBe('');
    });

    it('handles JSON string values', () => {
      const jsonData = JSON.stringify({ name: 'test', value: 123 });
      localStorage.setItem('jsonKey', jsonData);
      const result = getFromLocalStorage('jsonKey');
      expect(result).toBe(jsonData);
    });
  });

  describe('getFromSessionStorage', () => {
    beforeEach(() => {
      // Clear sessionStorage before each test
      sessionStorage.clear();
    });

    it('retrieves value from sessionStorage', () => {
      sessionStorage.setItem('testKey', 'testValue');
      const result = getFromSessionStorage('testKey');
      expect(result).toBe('testValue');
    });

    it('returns null when key does not exist', () => {
      const result = getFromSessionStorage('nonExistentKey');
      expect(result).toBeNull();
    });

    it('handles empty string values', () => {
      sessionStorage.setItem('emptyKey', '');
      const result = getFromSessionStorage('emptyKey');
      expect(result).toBe('');
    });

    it('handles JSON string values', () => {
      const jsonData = JSON.stringify({ name: 'test', value: 123 });
      sessionStorage.setItem('jsonKey', jsonData);
      const result = getFromSessionStorage('jsonKey');
      expect(result).toBe(jsonData);
    });

    it('handles special characters in values', () => {
      const specialValue = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      sessionStorage.setItem('specialKey', specialValue);
      const result = getFromSessionStorage('specialKey');
      expect(result).toBe(specialValue);
    });
  });
});
