import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => { vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
// jsdom has no modal top layer. Browser QA separately verifies native focus trapping.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
  this.querySelector('button, input, a')?.focus();
};
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
afterEach(() => { cleanup(); localStorage.clear(); });
