// Patch the broken localStorage that Claude Code injects into the Node process.
// In a real browser or production environment this file has no effect.
export async function register() {
  if (typeof localStorage !== 'undefined' && typeof localStorage.getItem !== 'function') {
    const store = new Map<string, string>()
    ;(globalThis as any).localStorage = {
      getItem:    (k: string) => store.get(k) ?? null,
      setItem:    (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear:      () => store.clear(),
      key:        (i: number) => [...store.keys()][i] ?? null,
      get length() { return store.size },
    }
  }
}
