import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SiteHeader } from './SiteHeader.js';

describe('SiteHeader', () => {
  it('updates the mobile menu button state when opened', () => {
    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: '메뉴 열기' });
    fireEvent.click(menuButton);

    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    expect(menuButton.getAttribute('aria-label')).toBe('메뉴 닫기');
  });
});
