const ORDER_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Customers need a short, readable reference (e.g. FS-2K9X7) when talking
// about an order on WhatsApp or as a bKash payment reference.
export function generateOrderCode(): string {
  let suffix = "";

  for (let i = 0; i < 5; i++) {
    suffix += ORDER_CODE_CHARS[Math.floor(Math.random() * ORDER_CODE_CHARS.length)];
  }

  return `FS-${suffix}`;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}
