import { compare } from "bcryptjs";

/** Compare a plaintext password to a bcrypt hash. Never log either value. */
export async function verifyPassword(
  plaintext: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plaintext, passwordHash);
}
