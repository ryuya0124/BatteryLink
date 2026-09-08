export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function readObject(request) {
  let value;
  try { value = await request.json(); }
  catch { throw new ApiError(400, "Invalid JSON"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "JSON object required");
  }
  return value;
}

export function errorResponse(error) {
  const status = error instanceof ApiError ? error.status : 500;
  return Response.json({ error: status === 500 ? "Internal Server Error" : error.message }, { status });
}
