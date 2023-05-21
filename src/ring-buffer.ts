export class RingBuffer<T> {
    private readonly max: number;
    private readonly data: Array<T>;

    constructor(sizeMax: number) {
        this.max = sizeMax;
        this.data = [];
    }

    push(x: T) {
        if (this.data.length === this.max) {
            this.data.shift();
        }

        this.data.push(x);
    }

    get() {
        return this.data;
    }
}
