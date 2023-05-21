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

export const delay = (ms: number) => {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), ms);
    });
};
