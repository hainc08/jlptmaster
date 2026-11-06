import { ZodError } from "zod";
import { authErrorResponse } from "@/src/server/services/auth-service";

/** Business-rule failure with an HTTP status and a stable machine-readable code. */
export class AdminError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
    this.name = "AdminError";
  }
}

/** Maps any error thrown by an admin handler to the shared `{ error: { code, message } }` envelope. */
export function handleAdminError(error: unknown): Response {
  if (error instanceof AdminError) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") } },
      { status: 400 },
    );
  }
  const auth = authErrorResponse(error);
  if (auth) return auth;
  console.error("[admin] unexpected error", error);
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "Đã xảy ra lỗi không mong muốn" } }, { status: 500 });
}
