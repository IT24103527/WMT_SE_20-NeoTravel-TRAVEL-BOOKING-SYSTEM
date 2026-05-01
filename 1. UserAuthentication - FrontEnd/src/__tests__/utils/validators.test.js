import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateUsername,
} from '../../utils/validators';

// ─── validateEmail ────────────────────────────────────────────────────────────
describe('validateEmail', () => {
  it('returns null for valid simple email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('returns null for email with plus tag', () => {
    expect(validateEmail('user+tag@sub.domain.org')).toBeNull();
  });

  it('returns null for email with numeric local part', () => {
    expect(validateEmail('123@domain.io')).toBeNull();
  });

  it('returns error string for empty string', () => {
    expect(validateEmail('')).toBeTruthy();
  });

  it('returns error string for null', () => {
    expect(validateEmail(null)).toBeTruthy();
  });

  it('returns error string for undefined', () => {
    expect(validateEmail(undefined)).toBeTruthy();
  });

  it('returns error for email without @', () => {
    expect(validateEmail('userexample.com')).toBeTruthy();
  });

  it('returns error for email without domain', () => {
    expect(validateEmail('user@')).toBeTruthy();
  });

  it('returns error for email without TLD', () => {
    expect(validateEmail('user@domain')).toBeTruthy();
  });

  it('returns error for email with spaces', () => {
    expect(validateEmail('user @example.com')).toBeTruthy();
  });

  it('returns error for email with double @', () => {
    expect(validateEmail('user@@example.com')).toBeTruthy();
  });

  it('error message contains "Email"', () => {
    const msg = validateEmail('');
    expect(msg).toMatch(/email/i);
  });
});

// ─── validatePassword ─────────────────────────────────────────────────────────
describe('validatePassword', () => {
  it('returns null for a fully valid password', () => {
    expect(validatePassword('Test@1234')).toBeNull();
  });

  it('returns null for a long complex password', () => {
    expect(validatePassword('Secure#Pass99!!')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validatePassword('')).toBeTruthy();
  });

  it('returns error for null', () => {
    expect(validatePassword(null)).toBeTruthy();
  });

  it('returns error for password shorter than 8 chars', () => {
    expect(validatePassword('Ab1!')).toBeTruthy();
  });

  it('returns error for exactly 7 chars', () => {
    expect(validatePassword('Ab1!xyz')).toBeTruthy();
  });

  it('returns null for exactly 8 chars meeting all rules', () => {
    expect(validatePassword('Ab1!xyzw')).toBeNull();
  });

  it('returns error when no uppercase letter', () => {
    expect(validatePassword('test@1234')).toBeTruthy();
  });

  it('returns error when no number', () => {
    expect(validatePassword('Test@abcd')).toBeTruthy();
  });

  it('returns error when no special character', () => {
    expect(validatePassword('Test1234')).toBeTruthy();
  });

  it('returns error for all-lowercase with special and number', () => {
    expect(validatePassword('test@1234')).toBeTruthy();
  });

  it('error message mentions the specific rule violated', () => {
    const msg = validatePassword('alllowercase1!');
    expect(msg).toMatch(/uppercase/i);
  });
});

// ─── validatePhone ────────────────────────────────────────────────────────────
describe('validatePhone', () => {
  it('returns null for valid international number with +', () => {
    expect(validatePhone('+12345678901')).toBeNull();
  });

  it('returns null for 7-digit minimum number', () => {
    expect(validatePhone('1234567')).toBeNull();
  });

  it('returns null for number with spaces (stripped)', () => {
    expect(validatePhone('+44 7911 123456')).toBeNull();
  });

  it('returns null for 15-digit maximum number', () => {
    expect(validatePhone('123456789012345')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validatePhone('')).toBeTruthy();
  });

  it('returns error for null', () => {
    expect(validatePhone(null)).toBeTruthy();
  });

  it('returns error for phone with letters', () => {
    expect(validatePhone('123abc456')).toBeTruthy();
  });

  it('returns error for phone shorter than 7 digits', () => {
    expect(validatePhone('12345')).toBeTruthy();
  });

  it('returns error for phone longer than 15 digits', () => {
    expect(validatePhone('1234567890123456')).toBeTruthy();
  });

  it('returns error for phone with only special chars', () => {
    expect(validatePhone('---')).toBeTruthy();
  });

  it('error message mentions phone', () => {
    const msg = validatePhone('');
    expect(msg).toMatch(/phone/i);
  });
});

// ─── validateUsername ─────────────────────────────────────────────────────────
describe('validateUsername', () => {
  it('returns null for a normal name', () => {
    expect(validateUsername('JohnDoe')).toBeNull();
  });

  it('returns null for minimum 2-char name', () => {
    expect(validateUsername('ab')).toBeNull();
  });

  it('returns null for exactly 32-char name', () => {
    expect(validateUsername('a'.repeat(32))).toBeNull();
  });

  it('returns null for name with spaces', () => {
    expect(validateUsername('John Doe')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validateUsername('')).toBeTruthy();
  });

  it('returns error for null', () => {
    expect(validateUsername(null)).toBeTruthy();
  });

  it('returns error for single character', () => {
    expect(validateUsername('a')).toBeTruthy();
  });

  it('returns error for 33-char name (over limit)', () => {
    expect(validateUsername('a'.repeat(33))).toBeTruthy();
  });

  it('returns error for whitespace-only string', () => {
    expect(validateUsername('   ')).toBeTruthy();
  });

  it('returns error for single space', () => {
    expect(validateUsername(' ')).toBeTruthy();
  });

  it('error message mentions "Name"', () => {
    const msg = validateUsername('');
    expect(msg).toMatch(/name/i);
  });
});
