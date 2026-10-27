import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PracticeQuizPage from '@/app/practice/page';

const mockQuestionsData = [
  {
    id: 'q-test-1',
    prompt: '毎朝、コーヒーを（　　）。',
    skillTag: 'Ngữ pháp',
    options: [
      { id: 'opt-1', text: '食べます' },
      { id: 'opt-2', text: '飲みます' },
      { id: 'opt-3', text: '行きます' },
      { id: 'opt-4', text: '見ます' },
    ],
  },
];

describe('PracticeQuizPage Component (TDD Server-Side Grading)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches questions from API and renders without answer leaks', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockQuestionsData }),
    } as Response);

    render(<PracticeQuizPage />);

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/practice/questions');

    await waitFor(() => {
      expect(screen.getByText(/毎朝、コーヒーを/)).toBeInTheDocument();
      expect(screen.getByText('飲みます')).toBeInTheDocument();
    });

    // Make sure explanation is NOT visible initially
    expect(screen.queryByText(/Chính xác!/i)).not.toBeInTheDocument();
  });

  it('submits answer to /api/v1/practice/submit and displays explanation on response', async () => {
    // 1. Initial questions fetch
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockQuestionsData }),
      } as Response)
      // 2. Submit answer fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isCorrect: true,
          correctOptionId: 'opt-2',
          explanationVi: 'Động từ "uống" trong tiếng Nhật là 飲みます (nomimasu).',
        }),
      } as Response);

    render(<PracticeQuizPage />);

    await waitFor(() => {
      expect(screen.getByText('飲みます')).toBeInTheDocument();
    });

    // Click on option 2 button
    const optionBtn = screen.getByRole('button', { name: /飲みます/i });
    fireEvent.click(optionBtn);

    // Submit button should now be enabled
    const submitBtn = screen.getByRole('button', { name: /Kiểm tra đáp án/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    // Verify submission payload
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: 'q-test-1', selectedOptionId: 'opt-2' }),
    });

    // Verify server-side result rendered
    await waitFor(() => {
      expect(screen.getByText(/Chính xác!/i)).toBeInTheDocument();
      expect(
        screen.getByText('Động từ "uống" trong tiếng Nhật là 飲みます (nomimasu).')
      ).toBeInTheDocument();
    });
  });
});
