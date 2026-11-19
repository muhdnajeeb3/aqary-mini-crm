import { expect } from "vitest";
import { cookieStoreMock } from "./cookie-jar";

export async function loginAs(email: string): Promise<void> {
  const { POST } = await import("@/app/api/auth/login/route");
  const response = await POST(
    new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        host: "localhost:3000",
      },
      body: JSON.stringify({
        email,
        password: "AqaryDemo!2026",
      }),
    }),
  );
  expect(response.status).toBe(200);
  expect(cookieStoreMock.get("aqary_session")?.value).toBeTypeOf("string");
}

export function sameOriginRequest(
  url: string,
  method: string,
  body?: unknown,
): Request {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      host: "localhost:3000",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function crossOriginRequest(
  url: string,
  method: string,
  body?: unknown,
): Request {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
      host: "localhost:3000",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
