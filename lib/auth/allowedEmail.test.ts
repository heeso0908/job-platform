import { describe, it, expect } from 'vitest';
import { isAllowedSignupEmail } from './allowedEmail';

describe('isAllowedSignupEmail', () => {
  it('allows an exact case-insensitive match', () => {
    expect(isAllowedSignupEmail('You@Example.com', 'you@example.com')).toBe(true);
  });

  it('rejects a different email', () => {
    expect(isAllowedSignupEmail('other@example.com', 'you@example.com')).toBe(false);
  });

  it('rejects when allowedEmail is empty', () => {
    expect(isAllowedSignupEmail('you@example.com', '')).toBe(false);
  });
});
