import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/api/http";
import { readVerifiedSessionUserId } from "@/modules/auth/session";
import type { PublicUser } from "@/modules/auth/types";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * Requires a valid signed session and a matching user in the database.
 * Role comes from Prisma (authoritative), not from the JWT.
 */
export async function requireAuth(): Promise<PublicUser> {
  const userId = await readVerifiedSessionUserId();
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }

  return toPublicUser(user);
}

/** Requires an authenticated user whose current DB role is ADMIN. */
export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  return user;
}
