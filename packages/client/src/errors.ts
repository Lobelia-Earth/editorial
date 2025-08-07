export class EditorialError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly statusText?: string
  ) {
    super(message);
    this.name = "EditorialError";
  }
}

export class EditorialNetworkError extends EditorialError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "EditorialNetworkError";
  }
}

export class EditorialNotFoundError extends EditorialError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, 404, "Not Found");
    this.name = "EditorialNotFoundError";
  }
}

export class EditorialValidationError extends EditorialError {
  constructor(message: string) {
    super(message, 400, "Bad Request");
    this.name = "EditorialValidationError";
  }
}
