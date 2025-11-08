/* eslint-disable @typescript-eslint/no-explicit-any */
interface ErrorDetail {
  type: string;
  loc: string[];
  msg: string;
  input: string;
  ctx: {
    max_length?: number;
    [key: string]: any;
  };
}

interface ErrorResponse {
  detail: ErrorDetail[] | string;
}

export function getApiErrorMessage(error: any): string {
  // If error has a detail property
  if (error.detail) {
    // Case 1: detail is an array (validation errors)
    if (Array.isArray(error.detail)) {
      const errorResponse = error as ErrorResponse;
      // Return the first error message
      const firstError = (errorResponse.detail as ErrorDetail[])[0];
      const fieldName =
        firstError.loc.length > 1 ? firstError.loc[1] : firstError.loc[0];
      return `${fieldName}: ${firstError.msg}`;
    }
    // Case 2: detail is a string
    else if (typeof error.detail === 'string') {
      return error.detail;
    }
  }

  // Fallback for unexpected error formats
  return error.message || 'An error occurred. Please try again later.';
}
