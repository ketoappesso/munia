import { NextResponse } from 'next/server';

export class APIError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleAPIError(error: unknown, context?: string) {
  // Log error details for debugging
  const timestamp = new Date().toISOString();
  const errorContext = context ? `[${context}]` : '';

  if (error instanceof APIError) {
    console.error(`${errorContext} API Error at ${timestamp}:`, {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack
    });

    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
        timestamp
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    console.error(`${errorContext} Unhandled Error at ${timestamp}:`, {
      message: error.message,
      stack: error.stack
    });

    // Don't expose internal error details in production
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        error: isDev ? error.message : 'Internal server error',
        timestamp
      },
      { status: 500 }
    );
  }

  // Unknown error type
  console.error(`${errorContext} Unknown Error at ${timestamp}:`, error);

  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      timestamp
    },
    { status: 500 }
  );
}

// Wrapper for API route handlers
export function withErrorHandler(
  handler: Function,
  context?: string
) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleAPIError(error, context);
    }
  };
}