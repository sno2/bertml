// @ts-expect-error
const builtin = Deno.core?.encode;

export const encode = (s: string) =>
  builtin !== undefined ? builtin(s) : new TextEncoder().encode(s);
