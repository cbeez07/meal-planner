export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function jsonError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  console.error(error);
  return Response.json(
    { error: { code: "internal", message: "Something went wrong" } },
    { status: 500 },
  );
}

export function jsonOk(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}
