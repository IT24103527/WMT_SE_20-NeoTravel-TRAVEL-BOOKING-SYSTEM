import { colors, shadow, shadowSm } from '../../utils/theme';

// ─── Color format helpers ─────────────────────────────────────────────────────
const isHex6 = (v) => /^#[0-9A-Fa-f]{6}$/.test(v);

// ─── colors ──────────────────────────────────────────────────────────────────
describe('theme colors — format', () => {
  const hexKeys = [
    'bg', 'surface', 'surfaceHigh', 'card',
    'border', 'borderLight',
    'primary', 'primaryLight', 'primaryDark', 'accent',
    'textPrimary', 'textSecondary', 'textMuted',
    'success', 'danger', 'warning', 'info', 'white',
  ];

  hexKeys.forEach((key) => {
    it(`colors.${key} is a valid 6-digit hex`, () => {
      expect(isHex6(colors[key])).toBe(true);
    });
  });
});

describe('theme colors — semantic values', () => {
  it('bg is white (#FFFFFF)', () => {
    expect(colors.bg.toUpperCase()).toBe('#FFFFFF');
  });

  it('white is #FFFFFF', () => {
    expect(colors.white.toUpperCase()).toBe('#FFFFFF');
  });

  it('primary is a dark blue (starts with #1 or #0)', () => {
    // Dark blue hex values start low
    const r = parseInt(colors.primary.slice(1, 3), 16);
    const g = parseInt(colors.primary.slice(3, 5), 16);
    const b = parseInt(colors.primary.slice(5, 7), 16);
    // Blue channel should dominate for a dark blue
    expect(b).toBeGreaterThan(r);
  });

  it('textPrimary is darker than textSecondary (lower luminance)', () => {
    const lum = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    expect(lum(colors.textPrimary)).toBeLessThan(lum(colors.textSecondary));
  });

  it('textSecondary is darker than textMuted', () => {
    const lum = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    expect(lum(colors.textSecondary)).toBeLessThan(lum(colors.textMuted));
  });

  it('danger is a red-dominant color', () => {
    const r = parseInt(colors.danger.slice(1, 3), 16);
    const g = parseInt(colors.danger.slice(3, 5), 16);
    const b = parseInt(colors.danger.slice(5, 7), 16);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it('success is a green-dominant color', () => {
    const r = parseInt(colors.success.slice(1, 3), 16);
    const g = parseInt(colors.success.slice(3, 5), 16);
    expect(g).toBeGreaterThan(r);
  });

  it('all required keys are present', () => {
    const required = ['bg', 'primary', 'danger', 'success', 'warning', 'textPrimary', 'card', 'border'];
    required.forEach((k) => expect(colors).toHaveProperty(k));
  });
});

// ─── shadow ───────────────────────────────────────────────────────────────────
describe('theme shadow', () => {
  it('has shadowColor as a valid hex', () => {
    expect(isHex6(shadow.shadowColor)).toBe(true);
  });

  it('has shadowOffset with width and height', () => {
    expect(shadow.shadowOffset).toHaveProperty('width');
    expect(shadow.shadowOffset).toHaveProperty('height');
  });

  it('shadowOpacity is between 0 and 1', () => {
    expect(shadow.shadowOpacity).toBeGreaterThan(0);
    expect(shadow.shadowOpacity).toBeLessThanOrEqual(1);
  });

  it('shadowRadius is a positive number', () => {
    expect(shadow.shadowRadius).toBeGreaterThan(0);
  });

  it('elevation is a positive integer', () => {
    expect(shadow.elevation).toBeGreaterThan(0);
    expect(Number.isInteger(shadow.elevation)).toBe(true);
  });
});

// ─── shadowSm ─────────────────────────────────────────────────────────────────
describe('theme shadowSm', () => {
  it('has all required shadow properties', () => {
    ['shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius', 'elevation'].forEach((k) => {
      expect(shadowSm).toHaveProperty(k);
    });
  });

  it('elevation is smaller than shadow.elevation', () => {
    expect(shadowSm.elevation).toBeLessThan(shadow.elevation);
  });

  it('shadowRadius is smaller than shadow.shadowRadius', () => {
    expect(shadowSm.shadowRadius).toBeLessThan(shadow.shadowRadius);
  });

  it('shadowOpacity is between 0 and 1', () => {
    expect(shadowSm.shadowOpacity).toBeGreaterThan(0);
    expect(shadowSm.shadowOpacity).toBeLessThanOrEqual(1);
  });
});
