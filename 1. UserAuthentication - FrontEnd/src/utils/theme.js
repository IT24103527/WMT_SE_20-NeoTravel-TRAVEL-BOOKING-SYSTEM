// ─── Clean White & Dark Blue Palette ──────────────────────────────────────
export const colors = {
  // Backgrounds — clean white, layered light greys
  bg:           '#FFFFFF',   // pure white base
  surface:      '#F4F6FB',   // very light blue-grey surface
  surfaceHigh:  '#EAF0FA',   // elevated input / card bg
  card:         '#FFFFFF',   // card background (white with border)

  // Borders — soft blue-grey
  border:       '#D0D9EC',
  borderLight:  '#E2E8F5',

  // Brand — dark navy blue as the primary accent
  primary:      '#1A3A6B',   // deep navy blue
  primaryLight: '#2E5BA8',   // medium blue highlight
  primaryDark:  '#0F2347',   // darker navy shadow
  accent:       '#2563EB',   // bright blue for secondary accents

  // Text
  textPrimary:  '#0F172A',   // near-black (slate)
  textSecondary:'#475569',   // medium slate grey
  textMuted:    '#94A3B8',   // light slate

  // Status
  success:      '#16A34A',   // green
  danger:       '#DC2626',   // red
  warning:      '#D97706',   // amber
  info:         '#2563EB',   // blue

  white:        '#FFFFFF',
};

export const shadow = {
  shadowColor:   '#1A3A6B',
  shadowOffset:  { width: 0, height: 6 },
  shadowOpacity: 0.10,
  shadowRadius:  20,
  elevation:     10,
};

export const shadowSm = {
  shadowColor:   '#1A3A6B',
  shadowOffset:  { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius:  8,
  elevation:     4,
};
