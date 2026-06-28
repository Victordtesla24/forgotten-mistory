// Extend Playwright Locator with custom extensions used in overhaul tests
import type { Locator } from '@playwright/test';

declare module '@playwright/test' {
  interface Locator {
    /** Returns true if the element is currently in the DOM */
    isAttached(): Promise<boolean>;
  }
}
