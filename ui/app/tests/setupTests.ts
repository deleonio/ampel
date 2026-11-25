import {
  toBeInTheDocument,
  toHaveTextContent,
  toHaveAttribute,
} from '@testing-library/jest-dom/matchers';
import { expect, vi } from 'vitest';

vi.mock('@public-ui/react-v19', () => import('./kolibriMock'));

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-ignore
// eslint-disable-next-line no-undef
(globalThis as typeof globalThis & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver =
  ResizeObserver;

expect.extend({ toBeInTheDocument, toHaveTextContent, toHaveAttribute });
