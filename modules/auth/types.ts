import type { Role } from "@prisma/client";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type SessionPayload = {
  sub: string;
};
