import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: string;
  details?: string[];
  fieldErrors?: Record<string, string>;
};

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function jsonError(
  status: number,
  error: string,
  extras?: Pick<ApiErrorBody, "details" | "fieldErrors">,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error,
      ...(extras?.details ? { details: extras.details } : {}),
      ...(extras?.fieldErrors ? { fieldErrors: extras.fieldErrors } : {}),
    },
    { status },
  );
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export class ConfigValidationError extends HttpError {
  readonly details: string[];

  constructor(message: string, details: string[]) {
    super(400, message);
    this.name = "ConfigValidationError";
    this.details = details;
  }
}

export class FieldValidationError extends HttpError {
  readonly fieldErrors: Record<string, string>;

  constructor(
    fieldErrors: Record<string, string>,
    message = "Validation failed",
  ) {
    super(422, message);
    this.name = "FieldValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function toErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ConfigValidationError) {
    return jsonError(error.status, error.message, { details: error.details });
  }

  if (error instanceof FieldValidationError) {
    return jsonError(error.status, error.message, {
      fieldErrors: error.fieldErrors,
    });
  }

  if (error instanceof HttpError) {
    return jsonError(error.status, error.message);
  }

  console.error(error);
  return jsonError(500, "Internal server error");
}
