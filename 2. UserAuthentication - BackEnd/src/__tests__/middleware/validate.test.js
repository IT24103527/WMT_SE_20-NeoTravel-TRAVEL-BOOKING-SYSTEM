const validate = require('../../middleware/validate.middleware');

const mockReq  = (body) => ({ body });
const mockRes  = () => ({ status: jest.fn(), json: jest.fn() });
const mockNext = () => jest.fn();

describe('validate middleware — passing cases', () => {
  it('calls next() with no args when all required fields are present', () => {
    const req  = mockReq({ email: 'a@b.com', password: 'secret' });
    const next = mockNext();
    validate(['email', 'password'])(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next() when validating a single field that is present', () => {
    const req  = mockReq({ email: 'a@b.com' });
    const next = mockNext();
    validate(['email'])(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when validating an empty fields array', () => {
    const req  = mockReq({});
    const next = mockNext();
    validate([])(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when extra fields are present beyond required', () => {
    const req  = mockReq({ email: 'a@b.com', password: 'secret', extra: 'ignored' });
    const next = mockNext();
    validate(['email', 'password'])(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('validate middleware — failing cases', () => {
  it('calls next(AppError) when a required field is missing', () => {
    const req  = mockReq({ email: 'a@b.com' });
    const next = mockNext();
    validate(['email', 'password'])(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('password');
  });

  it('calls next(AppError) when a field is empty string', () => {
    const req  = mockReq({ email: '', password: 'secret' });
    const next = mockNext();
    validate(['email', 'password'])(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('email');
  });

  it('calls next(AppError) when a field is whitespace only', () => {
    const req  = mockReq({ email: '   ', password: 'secret' });
    const next = mockNext();
    validate(['email', 'password'])(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next(AppError) when all fields are missing', () => {
    const req  = mockReq({});
    const next = mockNext();
    validate(['username', 'email', 'password'])(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(400);
  });

  it('error message lists all missing fields', () => {
    const req  = mockReq({});
    const next = mockNext();
    validate(['username', 'email', 'password'])(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.message).toContain('username');
    expect(err.message).toContain('email');
    expect(err.message).toContain('password');
  });

  it('calls next(AppError) when field value is null', () => {
    const req  = mockReq({ email: null, password: 'secret' });
    const next = mockNext();
    validate(['email', 'password'])(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next() when field value is 0 (numeric zero is a valid value)', () => {
    const req  = mockReq({ count: 0 });
    const next = mockNext();
    validate(['count'])(req, mockRes(), next);
    // 0 stringifies to "0" which is non-empty — should pass validation
    expect(next).toHaveBeenCalledWith();
  });

  it('error has isOperational true', () => {
    const req  = mockReq({});
    const next = mockNext();
    validate(['email'])(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.isOperational).toBe(true);
  });
});
