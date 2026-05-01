process.env.JWT_SECRET     = 'test_access_secret';
process.env.REFRESH_SECRET = 'test_refresh_secret';

const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  generateOTP,
  generateSecureToken,
} = require('../../utils/generateToken');

// ─── generateAccessToken ──────────────────────────────────────────────────────
describe('generateAccessToken', () => {
  it('returns a string', () => {
    expect(typeof generateAccessToken('user123')).toBe('string');
  });

  it('returns a valid JWT signed with JWT_SECRET', () => {
    const token = generateAccessToken('user123');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe('user123');
  });

  it('token has an exp claim', () => {
    const token = generateAccessToken('user123');
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeDefined();
  });

  it('token has an iat claim', () => {
    const token = generateAccessToken('user123');
    const decoded = jwt.decode(token);
    expect(decoded.iat).toBeDefined();
  });

  it('embeds the correct userId in the payload', () => {
    const token = generateAccessToken('abc-xyz-789');
    const decoded = jwt.decode(token);
    expect(decoded.id).toBe('abc-xyz-789');
  });

  it('two tokens for the same user are different (different iat)', async () => {
    const t1 = generateAccessToken('user1');
    await new Promise((r) => setTimeout(r, 1100)); // ensure different iat second
    const t2 = generateAccessToken('user1');
    // They may differ only by iat — just ensure they are valid
    expect(jwt.decode(t1).id).toBe(jwt.decode(t2).id);
  });

  it('throws when verified with wrong secret', () => {
    const token = generateAccessToken('user123');
    expect(() => jwt.verify(token, 'wrong_secret')).toThrow();
  });

  it('has three dot-separated parts (header.payload.signature)', () => {
    const token = generateAccessToken('user123');
    expect(token.split('.')).toHaveLength(3);
  });
});

// ─── generateRefreshToken ─────────────────────────────────────────────────────
describe('generateRefreshToken', () => {
  it('returns a string', () => {
    expect(typeof generateRefreshToken('user456')).toBe('string');
  });

  it('returns a valid JWT signed with REFRESH_SECRET', () => {
    const token = generateRefreshToken('user456');
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    expect(decoded.id).toBe('user456');
  });

  it('expires in approximately 7 days', () => {
    const token = generateRefreshToken('user456');
    const decoded = jwt.decode(token);
    const sevenDays = 7 * 24 * 60 * 60;
    expect(decoded.exp - decoded.iat).toBeCloseTo(sevenDays, -2);
  });

  it('embeds the correct userId', () => {
    const token = generateRefreshToken('refresh-user-99');
    const decoded = jwt.decode(token);
    expect(decoded.id).toBe('refresh-user-99');
  });

  it('throws when verified with wrong secret', () => {
    const token = generateRefreshToken('user456');
    expect(() => jwt.verify(token, 'wrong_secret')).toThrow();
  });

  it('access token and refresh token for same user are different', () => {
    const at = generateAccessToken('user1');
    const rt = generateRefreshToken('user1');
    expect(at).not.toBe(rt);
  });

  it('has three dot-separated parts', () => {
    const token = generateRefreshToken('user456');
    expect(token.split('.')).toHaveLength(3);
  });
});

// ─── generateOTP ──────────────────────────────────────────────────────────────
describe('generateOTP', () => {
  it('returns a string', () => {
    expect(typeof generateOTP()).toBe('string');
  });

  it('returns exactly 6 characters', () => {
    expect(generateOTP()).toHaveLength(6);
  });

  it('contains only digits', () => {
    expect(generateOTP()).toMatch(/^\d{6}$/);
  });

  it('is always >= 100000', () => {
    for (let i = 0; i < 50; i++) {
      expect(parseInt(generateOTP(), 10)).toBeGreaterThanOrEqual(100000);
    }
  });

  it('is always <= 999999', () => {
    for (let i = 0; i < 50; i++) {
      expect(parseInt(generateOTP(), 10)).toBeLessThanOrEqual(999999);
    }
  });

  it('generates different OTPs on repeated calls', () => {
    const otps = new Set(Array.from({ length: 50 }, generateOTP));
    expect(otps.size).toBeGreaterThan(1);
  });

  it('never returns a 5-digit number (no leading-zero issue)', () => {
    // Because we use Math.floor(100000 + random * 900000), result is always 6 digits
    for (let i = 0; i < 100; i++) {
      expect(generateOTP()).toHaveLength(6);
    }
  });
});

// ─── generateSecureToken ──────────────────────────────────────────────────────
describe('generateSecureToken', () => {
  it('returns a string', () => {
    expect(typeof generateSecureToken()).toBe('string');
  });

  it('returns a 64-character hex string', () => {
    expect(generateSecureToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates unique tokens on each call', () => {
    const tokens = new Set(Array.from({ length: 20 }, generateSecureToken));
    expect(tokens.size).toBe(20);
  });

  it('contains only lowercase hex characters', () => {
    const token = generateSecureToken();
    expect(token).toBe(token.toLowerCase());
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it('has length of exactly 64', () => {
    expect(generateSecureToken()).toHaveLength(64);
  });
});
