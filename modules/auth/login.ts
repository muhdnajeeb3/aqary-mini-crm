import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/modules/auth/password";
import type { PublicUser } from "@/modules/auth/types";

export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  passwordHash: true,
} as const;

/**
 * Verifies credentials. Returns a public user on success, or null for any
 * failure (unknown email or wrong password) to avoid account enumeration.
 */
export async function authenticateWithPassword(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: publicUserSelect,
  });

  if (!user) {
    // Constant-time-ish dummy compare would be ideal; unknown email still
    // returns the same generic failure without leaking which check failed.
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
