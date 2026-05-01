const respond = require('../../utils/ApiResponse');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// Helper to get the JSON body from the last call
const body = (res) => res.json.mock.calls[0][0];

describe('ApiResponse — 2xx success methods', () => {
  it('ok() sends 200 with success:true', () => {
    const res = mockRes();
    respond(res).ok('Success', { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(body(res).success).toBe(true);
    expect(body(res).statusCode).toBe(200);
    expect(body(res).message).toBe('Success');
    expect(body(res).data).toEqual({ id: 1 });
  });

  it('created() sends 201 with success:true', () => {
    const res = mockRes();
    respond(res).created('Created', { id: 2 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(body(res).success).toBe(true);
    expect(body(res).statusCode).toBe(201);
  });

  it('ok() omits data key when data is null', () => {
    const res = mockRes();
    respond(res).ok('No data');
    expect(body(res)).not.toHaveProperty('data');
  });

  it('created() omits data key when data is null', () => {
    const res = mockRes();
    respond(res).created('Created');
    expect(body(res)).not.toHaveProperty('data');
  });

  it('ok() includes data when data is an empty array', () => {
    const res = mockRes();
    respond(res).ok('Empty list', []);
    expect(body(res)).toHaveProperty('data');
    expect(body(res).data).toEqual([]);
  });

  it('ok() includes data when data is 0 (falsy but not null)', () => {
    const res = mockRes();
    respond(res).ok('Zero', 0);
    expect(body(res)).toHaveProperty('data');
    expect(body(res).data).toBe(0);
  });
});

describe('ApiResponse — 4xx error methods', () => {
  it('badRequest() sends 400 with success:false', () => {
    const res = mockRes();
    respond(res).badRequest('Bad input');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(body(res).success).toBe(false);
    expect(body(res).message).toBe('Bad input');
  });

  it('unauthorized() sends 401 with success:false', () => {
    const res = mockRes();
    respond(res).unauthorized('No token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(body(res).success).toBe(false);
  });

  it('forbidden() sends 403 with success:false', () => {
    const res = mockRes();
    respond(res).forbidden('Access denied');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(body(res).success).toBe(false);
  });

  it('notFound() sends 404 with success:false', () => {
    const res = mockRes();
    respond(res).notFound('Not found');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(body(res).success).toBe(false);
  });

  it('conflict() sends 409 with success:false', () => {
    const res = mockRes();
    respond(res).conflict('Duplicate email');
    expect(res.status).toHaveBeenCalledWith(409);
    expect(body(res).success).toBe(false);
    expect(body(res).message).toBe('Duplicate email');
  });

  it('4xx methods do not include data key', () => {
    const res = mockRes();
    respond(res).badRequest('Error');
    expect(body(res)).not.toHaveProperty('data');
  });
});

describe('ApiResponse — 5xx error methods', () => {
  it('serverError() sends 500 with success:false', () => {
    const res = mockRes();
    respond(res).serverError('Internal error');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(body(res).success).toBe(false);
    expect(body(res).message).toBe('Internal error');
  });
});

describe('ApiResponse — response shape', () => {
  it('every response includes success, statusCode, and message', () => {
    const methods = ['ok', 'created', 'badRequest', 'unauthorized', 'forbidden', 'notFound', 'conflict', 'serverError'];
    methods.forEach((method) => {
      const res = mockRes();
      respond(res)[method]('test message');
      const b = body(res);
      expect(b).toHaveProperty('success');
      expect(b).toHaveProperty('statusCode');
      expect(b).toHaveProperty('message');
    });
  });

  it('success is true for 2xx and false for 4xx/5xx', () => {
    const cases = [
      { method: 'ok',          expected: true  },
      { method: 'created',     expected: true  },
      { method: 'badRequest',  expected: false },
      { method: 'unauthorized',expected: false },
      { method: 'notFound',    expected: false },
      { method: 'serverError', expected: false },
    ];
    cases.forEach(({ method, expected }) => {
      const res = mockRes();
      respond(res)[method]('msg');
      expect(body(res).success).toBe(expected);
    });
  });

  it('statusCode in body matches HTTP status code sent', () => {
    const cases = [
      { method: 'ok',          code: 200 },
      { method: 'created',     code: 201 },
      { method: 'badRequest',  code: 400 },
      { method: 'unauthorized',code: 401 },
      { method: 'forbidden',   code: 403 },
      { method: 'notFound',    code: 404 },
      { method: 'conflict',    code: 409 },
      { method: 'serverError', code: 500 },
    ];
    cases.forEach(({ method, code }) => {
      const res = mockRes();
      respond(res)[method]('msg');
      expect(res.status).toHaveBeenCalledWith(code);
      expect(body(res).statusCode).toBe(code);
    });
  });
});
