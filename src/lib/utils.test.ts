import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges standard strings', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('handles conditional classes using objects', () => {
    expect(cn('text-red-500', { 'bg-blue-500': true, 'hidden': false })).toBe('text-red-500 bg-blue-500');
  });

  it('handles twMerge conflict resolution (later classes take precedence)', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles array of classes', () => {
    expect(cn(['text-red-500', 'bg-blue-500'])).toBe('text-red-500 bg-blue-500');
  });

  it('handles falsy values safely', () => {
    expect(cn('text-red-500', null, undefined, false, '', 0, 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('handles nested structures', () => {
    expect(cn('text-red-500', ['bg-blue-500', { 'flex': true, 'hidden': false }])).toBe('text-red-500 bg-blue-500 flex');
  });
});
