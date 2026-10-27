import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RubyText } from '@/app/components/RubyText';

describe('RubyText Component', () => {
  it('renders semantic <ruby> with <rt> and <rp> fallback when reading is provided', () => {
    const { container } = render(<RubyText kanji="先生" reading="せんせい" />);
    
    const rubyElement = container.querySelector('ruby');
    expect(rubyElement).toBeInTheDocument();
    expect(rubyElement).toHaveTextContent('先生');
    
    const rtElement = container.querySelector('rt');
    expect(rtElement).toBeInTheDocument();
    expect(rtElement).toHaveTextContent('せんせい');

    const rpElements = container.querySelectorAll('rp');
    expect(rpElements.length).toBe(2);
    expect(rpElements[0]).toHaveTextContent('(');
    expect(rpElements[1]).toHaveTextContent(')');
  });

  it('renders plain text without ruby if reading is identical or not provided', () => {
    const { container } = render(<RubyText kanji="ねこ" reading="ねこ" />);
    expect(container.querySelector('ruby')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('ねこ');
  });
});
