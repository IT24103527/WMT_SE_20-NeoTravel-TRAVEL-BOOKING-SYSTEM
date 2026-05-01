/**
 * Standardized API response helper.
 * Ensures every endpoint returns a consistent JSON shape:
 * { success, statusCode, message, data }
 */
class ApiResponse {
  constructor(res) {
    this.res = res;
  }

  send(statusCode, message, data = null) {
    const body = { success: statusCode < 400, statusCode, message };
    if (data !== null) body.data = data;
    return this.res.status(statusCode).json(body);
  }

  // 2xx
  ok(message, data)      { return this.send(200, message, data); }
  created(message, data) { return this.send(201, message, data); }

  // 4xx
  badRequest(message)    { return this.send(400, message); }
  unauthorized(message)  { return this.send(401, message); }
  forbidden(message)     { return this.send(403, message); }
  notFound(message)      { return this.send(404, message); }
  conflict(message)      { return this.send(409, message); }

  // 5xx
  serverError(message)   { return this.send(500, message); }
}

const respond = (res) => new ApiResponse(res);

module.exports = respond;
