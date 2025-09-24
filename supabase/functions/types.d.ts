declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
    }
  }
  
  const Deno: {
    env: Deno.Env;
  };
}

export {};
