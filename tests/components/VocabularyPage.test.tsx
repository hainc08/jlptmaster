import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VocabularyPage from '@/app/vocabulary/page';

const mockVocabData = [
  {
    id: 'vocab-1',
    surface: '先生',
    reading: 'せんせい',
    romaji: 'sensei',
    pos: 'Danh từ',
    meaningVi: 'Giáo viên, thầy cô giáo',
    exampleJa: '田中先生は日本語を教えています。',
    exampleVi: 'Thầy Tanaka đang dạy tiếng Nhật.',
  },
  {
    id: 'vocab-2',
    surface: '学生',
    reading: 'がくせい',
    romaji: 'gakusei',
    pos: 'Danh từ',
    meaningVi: 'Học sinh, sinh viên',
    exampleJa: '私は大学生です。',
    exampleVi: 'Tôi là sinh viên đại học.',
  },
];

describe('VocabularyPage Component (TDD Frontend Integration)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state then displays items fetched from /api/v1/vocabulary', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockVocabData }),
    } as Response);

    render(<VocabularyPage />);

    // Should fetch from api
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/vocabulary'));

    // Wait for items to be displayed
    await waitFor(() => {
      expect(screen.getByText('Giáo viên, thầy cô giáo')).toBeInTheDocument();
      expect(screen.getByText('Học sinh, sinh viên')).toBeInTheDocument();
    });
  });

  it('displays empty state when no items match search query', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    render(<VocabularyPage />);

    await waitFor(() => {
      expect(screen.getByText(/Không tìm thấy từ vựng nào/i)).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Database connection failed' } }),
    } as Response);

    render(<VocabularyPage />);

    await waitFor(() => {
      expect(screen.getByText(/Lỗi khi tải dữ liệu từ vựng/i)).toBeInTheDocument();
    });
  });
});
