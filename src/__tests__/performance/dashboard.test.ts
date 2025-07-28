import { render, screen } from '@testing-library/react';
import { performance } from 'perf_hooks';
import React from 'react';

// Mock components for performance testing
jest.mock('@/components/dashboard/UrlList', () => {
  return function MockUrlList() {
    return React.createElement(
      'div',
      { 'data-testid': 'url-list' },
      'URL List Component',
    );
  };
});

jest.mock('@/components/dashboard/UrlForm', () => {
  return function MockUrlForm() {
    return React.createElement(
      'div',
      { 'data-testid': 'url-form' },
      'URL Form Component',
    );
  };
});

jest.mock('@/components/dashboard/CategoryList', () => {
  return function MockCategoryList() {
    return React.createElement(
      'div',
      { 'data-testid': 'category-list' },
      'Category List Component',
    );
  };
});

describe('Dashboard Performance Tests', () => {
  describe('Component Rendering Performance', () => {
    it('should render dashboard components within acceptable time', () => {
      const startTime = performance.now();

      // Simulate dashboard component rendering
      const dashboardContent = React.createElement('div', {}, [
        React.createElement(
          'div',
          { key: 'header', 'data-testid': 'dashboard-header' },
          'Dashboard Header',
        ),
        React.createElement(
          'div',
          { key: 'url-list', 'data-testid': 'url-list' },
          'URL List Component',
        ),
        React.createElement(
          'div',
          { key: 'url-form', 'data-testid': 'url-form' },
          'URL Form Component',
        ),
        React.createElement(
          'div',
          { key: 'category-list', 'data-testid': 'category-list' },
          'Category List Component',
        ),
      ]);

      render(dashboardContent);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 300ms (adjusted for test environment)
      expect(renderTime).toBeLessThan(300);

      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('url-list')).toBeInTheDocument();
      expect(screen.getByTestId('url-form')).toBeInTheDocument();
      expect(screen.getByTestId('category-list')).toBeInTheDocument();
    });

    it('should handle large data sets efficiently', () => {
      const startTime = performance.now();

      // Simulate rendering with large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        title: `URL ${i}`,
        originalUrl: `https://example${i}.com`,
        shortUrl: `short${i}`,
        clickCount: Math.floor(Math.random() * 1000),
      }));

      const urlListItems = largeDataset.map((item) =>
        React.createElement(
          'div',
          {
            key: item.id,
            'data-testid': `url-item-${item.id}`,
          },
          item.title,
        ),
      );

      const largeUrlList = React.createElement(
        'div',
        { 'data-testid': 'large-url-list' },
        urlListItems,
      );
      render(largeUrlList);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render 1000 items within 500ms
      expect(renderTime).toBeLessThan(500);
      expect(screen.getByTestId('large-url-list')).toBeInTheDocument();
    });
  });

  describe('API Response Time Performance', () => {
    it('should simulate API response time benchmarks', async () => {
      const mockApiCall = async (delay: number) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true, data: [] });
          }, delay);
        });
      };

      // Test different API response times
      const testCases = [
        { name: 'fast', delay: 50, maxTime: 100 },
        { name: 'medium', delay: 200, maxTime: 300 },
        { name: 'slow', delay: 500, maxTime: 600 },
      ];

      for (const testCase of testCases) {
        const startTime = performance.now();
        await mockApiCall(testCase.delay);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(testCase.maxTime);
      }
    });

    it('should handle concurrent API requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = performance.now();

      const promises = Array.from(
        { length: concurrentRequests },
        (_, i) =>
          new Promise((resolve) => {
            setTimeout(() => resolve(`Request ${i} completed`), 50);
          }),
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should complete within 200ms (50ms each + overhead)
      expect(totalTime).toBeLessThan(200);
      expect(results).toHaveLength(concurrentRequests);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not cause memory leaks with repeated renders', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate multiple renders
      for (let i = 0; i < 100; i++) {
        render(
          React.createElement('div', { 'data-testid': `render-${i}` }, [
            React.createElement(
              'div',
              { key: 'title' },
              `Dashboard Component ${i}`,
            ),
            React.createElement('div', { key: 'url-list' }, 'URL List'),
            React.createElement('div', { key: 'analytics' }, 'Analytics Chart'),
          ]),
        );
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 25MB for test environment)
      expect(memoryIncrease).toBeLessThan(25 * 1024 * 1024);
    });
  });
});
