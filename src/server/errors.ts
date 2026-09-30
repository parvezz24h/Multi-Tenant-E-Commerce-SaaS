/** Expected, user-facing failures. Anything else is treated as a 500. */
export class AppError extends Error {
  constructor(
    public readonly code: "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "LIMIT_REACHED" | "INVALID",
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

/** Convert a thrown error into form state; rethrow anything unexpected. */
export function toActionState(error: unknown): ActionState {
  if (error instanceof AppError) {
    return error.field
      ? { ok: false, fieldErrors: { [error.field]: [error.message] } }
      : { ok: false, message: error.message };
  }
  throw error;
}
