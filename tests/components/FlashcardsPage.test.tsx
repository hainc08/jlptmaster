import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FlashcardsReviewPage from '@/app/flashcards/page';

describe('FlashcardsReviewPage Component', () => {
  it('renders front card and flips on click or Space key', () => {
    render(<FlashcardsReviewPage />);

    // Initially front side is shown
    expect(screen.getByText('Nhấn Space hoặc chạm để lật')).toBeInTheDocument();

    // Click card to flip
    const cardContainer = screen.getByRole('button', { name: /Nhấn để lật thẻ flashcard/i });
    fireEvent.click(cardContainer);

    // Back side should now show explanation & meaning
    expect(screen.getByText('Đang xem mặt sau')).toBeInTheDocument();
    expect(screen.getByText(/ÂM HÁN-VIỆT/i)).toBeInTheDocument();

    // Space key flips it back
    fireEvent.keyDown(window, { code: 'Space' });
    expect(screen.getByText('Nhấn Space hoặc chạm để lật')).toBeInTheDocument();
  });

  it('allows grading with buttons and hotkey 3 (GOOD)', () => {
    render(<FlashcardsReviewPage />);

    // Flip first
    fireEvent.keyDown(window, { code: 'Space' });
    expect(screen.getByText('Đang xem mặt sau')).toBeInTheDocument();

    // Press hotkey 3 for GOOD
    fireEvent.keyDown(window, { key: '3' });

    // Should advance to card 2
    expect(screen.getByText(/Thẻ 2 \//i)).toBeInTheDocument();
  });
});
