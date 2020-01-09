export function delay(ms: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

interface PromiseFulfilledResult<T> {
    status: "fulfilled";
    value: T;
}
interface PromiseRejectedResult {
    status: "rejected";
    reason: any;
}
type PromiseSettledResult<T> = PromiseFulfilledResult<T> | PromiseRejectedResult;

export function allPromiseSettled<T>(values: Array<Promise<T>>): Promise<Array<PromiseSettledResult<T>>> {
    return Promise.all<PromiseSettledResult<T>>(values.map(promise => promise.then(value => <PromiseFulfilledResult<T>>({
        status: "fulfilled",
        value,
    })).catch((reason: any) => <PromiseRejectedResult>({
        status: "rejected",
        reason,
    }))));
}
