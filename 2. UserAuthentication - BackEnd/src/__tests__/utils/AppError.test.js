const AppError = require('../../utils/AppError');

describe('AppError', () => {
  // ── Constructor ────────────────────────────────────────────────────────────
  it('creates error with message and statusCode', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('defaults statusCode to 500 when not provided', () => {
    const err = new AppError('Server error');
    expect(err.statusCode).toBe(500);
  });

  it('captures stack trace', () => {
    const err = new AppError('Test', 400);
    expect(err.stack).toBeDefined();
    expect(typeof err.stack).toBe('string');
  });

  it('is an instance of AppError', () => {
    const err = new AppError('Test', 400);
    expect(err instanceof AppError).toBe(true);
  });

  it('is an instance of Error', () => {
    const err = new AppError('Test', 400);
    expect(err instanceof Error).toBe(true);
  });

  // ── isOperational flag ─────────────────────────────────────────────────────
  it('always sets isOperational to true', () => {
    const err = new AppError('Any message', 422);
    expect(err.isOperational).toBe(true);
  });

  // ── Various status codes ───────────────────────────────────────────────────
  it('stores 400 Bad Request', () => {
    const err = new AppError('Bad input', 400);
    expect(err.statusCode).toBe(400);
  });

  it('stores 401 Unauthorized', () => {
    const err = new AppError('Unauthorized', 401);
    expect(err.statusCode).toBe(401);
  });

  it('stores 403 Forbidden', () => {
    const err = new AppError('Forbidden', 403);
    expect(err.statusCode).toBe(403);
  });

  it('stores 409 Conflict', () => {
    const err = new AppError('Conflict', 409);
    expect(err.statusCode).toBe(409);
  });

  it('stores 422 Unprocessable Entity', () => {
    const err = new AppError('Validation failed', 422);
    expect(err.statusCode).toBe(422);
  });

  // ── Message preservation ───────────────────────────────────────────────────
  it('preserves the exact message string', () => {
    const msg = 'Email already in use';
    const err = new AppError(msg, 409);
    expect(err.message).toBe(msg);
  });

  it('handles empty string message', () => {
    const err = new AppError('', 400);
    expect(err.message).toBe('');
  });

  // ── Stack trace ────────────────────────────────────────────────────────────
  it('stack trace starts with the Error message line', () => {
    const err = new AppError('Test', 400);
    // Stack should begin with "Error: Test"
    expect(err.stack).toMatch(/^Error: Test/);
  });
});
