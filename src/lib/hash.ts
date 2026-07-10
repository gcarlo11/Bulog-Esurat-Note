import crypto from "crypto";

export interface LetterHashInput {
  id: string;
  letterNumber: string;
  subject: string;
  sender: string;
  recipient: string;
  letterDate: Date | string;
}

/**
 * Menghasilkan nilai Cryptographic Hash SHA-256 yang stabil dari properti surat.
 * Berguna untuk memverifikasi integritas data surat di UI.
 */
export function generateLetterHash(letter: LetterHashInput): string {
  const content = `${letter.id}-${letter.letterNumber}-${letter.subject}-${letter.sender}-${letter.recipient}-${new Date(letter.letterDate).toISOString()}`;
  return crypto.createHash("sha256").update(content).digest("hex");
}
