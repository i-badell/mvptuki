// Thin wrapper for traceability and future extensibility.
export const generateQrToken = (): string => crypto.randomUUID()
