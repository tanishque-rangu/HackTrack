import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { ThemeTransitionProvider, useThemeTransition } from './ThemeTransitionProvider';

function TestConsumer() {
  const { actualTheme } = useTheme();
  const { changeTheme, isPlaying, reducedEffects, setReducedEffects } = useThemeTransition();

  return (
    <div>
      <span data-testid="current-theme">{actualTheme}</span>
      <span data-testid="is-playing">{isPlaying ? 'playing' : 'idle'}</span>
      <span data-testid="reduced">{reducedEffects ? 'reduced' : 'full'}</span>

      <button data-testid="toggle-btn" onClick={() => changeTheme(actualTheme === 'dark' ? 'light' : 'dark')}>
        Toggle
      </button>
      <button data-testid="reduce-btn" onClick={() => setReducedEffects(!reducedEffects)}>
        Reduce
      </button>
    </div>
  );
}

describe('ThemeTransition state machine & provider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in idle state', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeTransitionProvider>
          <TestConsumer />
        </ThemeTransitionProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId('is-playing').textContent).toBe('idle');
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
  });

  it('transitions idle -> playing -> complete on theme toggle', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeTransitionProvider>
          <TestConsumer />
        </ThemeTransitionProvider>
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');

    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId('is-playing').textContent).toBe('playing');

    // Fast-forward past flash & theme swap (0.5s for dark-to-light)
    act(() => {
      vi.advanceTimersByTime(550);
    });
    expect(screen.getByTestId('current-theme').textContent).toBe('light');

    // Fast-forward past completion
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('is-playing').textContent).toBe('idle');
  });

  it('guards against double-clicking during animation', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeTransitionProvider>
          <TestConsumer />
        </ThemeTransitionProvider>
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');

    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId('is-playing').textContent).toBe('playing');

    // Double click should be ignored
    act(() => {
      fireEvent.click(toggleBtn);
    });
    expect(screen.getByTestId('is-playing').textContent).toBe('playing');
  });

  it('handles reduced-motion fallback cleanly (200ms cross-fade)', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeTransitionProvider>
          <TestConsumer />
        </ThemeTransitionProvider>
      </ThemeProvider>
    );

    // Turn on reduced effects
    act(() => {
      fireEvent.click(screen.getByTestId('reduce-btn'));
    });

    expect(screen.getByTestId('reduced').textContent).toBe('reduced');

    const toggleBtn = screen.getByTestId('toggle-btn');
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId('is-playing').textContent).toBe('playing');

    // Fast forward 120ms (theme swap happens at 100ms in reduced mode)
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(screen.getByTestId('current-theme').textContent).toBe('light');

    // Fast forward remaining time
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId('is-playing').textContent).toBe('idle');
  });

  it('allows skipping animation via Escape key', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeTransitionProvider>
          <TestConsumer />
        </ThemeTransitionProvider>
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId('is-playing').textContent).toBe('playing');

    // Press Escape
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(screen.getByTestId('is-playing').textContent).toBe('idle');
  });
});
