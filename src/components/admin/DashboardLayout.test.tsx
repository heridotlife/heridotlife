import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardLayout from './DashboardLayout';

describe('DashboardLayout mobile menu', () => {
  const renderLayout = () =>
    render(
      <DashboardLayout pathname="/admin/dashboard">
        <div>content</div>
      </DashboardLayout>
    );

  it('keeps the closed menu non-interactive so it cannot swallow nav-bar taps', () => {
    const { container } = renderLayout();

    const menu = container.querySelector('.mobile-menu');
    expect(menu).not.toBeNull();

    // Regression: the closed menu overlaps the nav bar (it is translated up by
    // its own height, hidden only via opacity). Without pointer-events-none its
    // invisible full-width Logout button intercepted taps meant for the burger
    // button and logged the user out.
    expect(menu!.className).toContain('pointer-events-none');
    expect(menu!.className).toContain('invisible');
  });

  it('becomes visible and interactive when the burger button is clicked', () => {
    const { container } = renderLayout();

    fireEvent.click(screen.getByTitle('Toggle menu'));

    const menu = container.querySelector('.mobile-menu');
    expect(menu!.className).toContain('translate-y-0');
    expect(menu!.className).not.toContain('pointer-events-none');
    expect(menu!.className).not.toContain('invisible');
  });

  it('closes again when a nav link is clicked', () => {
    const { container } = renderLayout();

    fireEvent.click(screen.getByTitle('Toggle menu'));
    fireEvent.click(screen.getAllByText('URLs')[1]); // mobile menu copy of the link

    const menu = container.querySelector('.mobile-menu');
    expect(menu!.className).toContain('pointer-events-none');
  });
});
