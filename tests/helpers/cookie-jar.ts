type CookieRecord = {
  name: string;
  value: string;
};

const jar = new Map<string, string>();

export function resetCookieJar(): void {
  jar.clear();
}

export function getCookieJarValue(name: string): string | undefined {
  return jar.get(name);
}

export const cookieStoreMock = {
  get(name: string): CookieRecord | undefined {
    const value = jar.get(name);
    if (value === undefined) {
      return undefined;
    }
    return { name, value };
  },
  set(
    name: string,
    value: string,
    _options?: Record<string, unknown>,
  ): void {
    if (value === "" || _options?.maxAge === 0) {
      jar.delete(name);
      return;
    }
    jar.set(name, value);
  },
  delete(name: string): void {
    jar.delete(name);
  },
};
