// @ts-expect-error
const builtin = Deno.core?.decode;

export const decode = (buf: Uint8Array) =>
  builtin !== undefined ? builtin(buf) : new TextDecoder().decode(buf);
