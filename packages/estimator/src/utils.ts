export const sum = (arr: number[]): number => {
  return arr.reduce((prev, curr) => prev + curr, 0);
};

export const median = (arr: number[]): number => {
  if (arr.length === 0) return Number.NaN;
  if (arr.length === 1) return arr[0];

  arr.sort((a, b) => a - b);

  const midpoint = Math.floor(arr.length / 2);

  return arr.length % 2 ? arr[midpoint] : (arr[midpoint - 1] + arr[midpoint]) / 2;
};

export const abortableDelay = (ms: number, abortSignal: AbortSignal) => {
  return new Promise<void>((resolve) => {
    if (abortSignal.aborted) {
      return resolve();
    }

    const listener = () => {
      resolve();
      clearTimeout(timeout);
    };

    const timeout = setTimeout(() => {
      resolve();
      abortSignal.removeEventListener("abort", listener);
    }, ms);
    abortSignal.addEventListener("abort", listener, { once: true });
  });
};

export const createDebugLog =
  (debug?: boolean) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...data: any[]) => {
    if (debug) {
      console.log("DEBUG:", ...data);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const typedObjectKeys = <T extends Record<string | number, any>>(obj: T): (keyof T)[] => {
  return Object.keys(obj);
};
