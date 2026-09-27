// Único límite de acceso a localStorage. Ningún consumidor debe tocar la API directamente:
// así el modo privado, una política del navegador o una cuota agotada se convierten en resultados
// comprobables en vez de excepciones que rompen la interfaz.
export type LocalStorageResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

export function localGet(key: string): LocalStorageResult<string | null> {
  try {
    return { ok: true, value: window.localStorage.getItem(key) };
  } catch (error) {
    return { ok: false, error };
  }
}

export function localSet(key: string, value: string): LocalStorageResult<void> {
  try {
    window.localStorage.setItem(key, value);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error };
  }
}

export function localRemove(key: string): LocalStorageResult<void> {
  try {
    window.localStorage.removeItem(key);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error };
  }
}

export function localGetOrThrow(key: string) {
  const result = localGet(key);
  if (!result.ok) throw result.error;
  return result.value;
}

export function localSetOrThrow(key: string, value: string) {
  const result = localSet(key, value);
  if (!result.ok) throw result.error;
}

export function localRemoveOrThrow(key: string) {
  const result = localRemove(key);
  if (!result.ok) throw result.error;
}
