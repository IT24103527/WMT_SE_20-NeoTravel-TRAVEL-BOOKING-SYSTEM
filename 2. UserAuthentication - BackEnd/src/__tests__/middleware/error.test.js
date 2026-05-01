const errorMiddleware = require('../../middleware/error.middleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorMiddleware', () => {
  const req  = {};
  const next = jest.fn();

  it('handles AppError with correct statusCode', () => {
    const res = mockRes();
    const err = { message: 'Not found', statusCode: 404, isOperational: true };
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Not found' }));
  });

  it('defaults to 500 for unknown errors', () => {
    const res = mockRes();
    errorMiddleware(new Error('Unexpected'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('handles Mongoose CastError (invalid ObjectId)', () => {
    const res = mockRes();
    const err = { name: 'CastError', path: '_id', value: 'bad-id', message: 'Cast error' };
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain('_id');
  });

  it('handles Mongoose duplicate key error (code 11000)', () => {
    const res = mockRes();
    const err = { code: 11000, keyValue: { email: 'x@x.com' }, message: 'Duplicate' };
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toContain('email');
  });

  it('handles Mongoose ValidationError', () => {
    const res = mockRes();
    const err = {
      name: 'ValidationError',
      errors: { username: { message: 'Username is required' } },
      message: 'Validation failed',
    };
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json.mock.calls[0][0].message).toContain('Username is required');
  });

  it('handles JWT JsonWebTokenError', () => {
    const res = mockRes();
    const err = { name: 'JsonWebTokenError', message: 'invalid signature' };
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('handles JWT TokenExpiredError', () => {
    const res = mockRes();
    const err = { name: 'TokenExpiredError', message: 'jwt expired' };
    errorMiddleware(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
