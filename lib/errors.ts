export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function toAppError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError("予期しないエラーが発生しました。", 500);
}
