export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class BadRequest extends ApiError {
  constructor(message: string, code: string = 'BAD_REQUEST') {
    super(400, message, code);
  }
}

export class Unauthorized extends ApiError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(401, message, code);
  }
}

export class NotFound extends ApiError {
  constructor(message: string, code: string = 'NOT_FOUND') {
    super(404, message, code);
  }
}

export class Conflict extends ApiError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(409, message, code);
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error', code: string = 'INTERNAL_SERVER_ERROR') {
    super(500, message, code);
  }
}
