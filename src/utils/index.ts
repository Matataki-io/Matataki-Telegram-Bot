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

export function filterNotNull<T>(array: Array<(T | null)>) {
    const result = new Array<T>();

    for (const item of array) {
        if (item === null) {
            continue;
        }

        result.push(item);
    }

    return result;
}


export function check(test: any, errMsg: string) {
  if (!test) { throw new Error(errMsg); }
}
export function checkNotNull<T>(val: T | null | undefined,errMsg:string): T {
  if (val) {
    return val;
  } else {
    throw new Error(errMsg);
  }
}
export function checkWith<T>(val: T, checker: (v: T) => any, errMsg: string): T {
  if (!checker(val)) { throw new Error(errMsg); } else {
    return val;
  }
}
export function replaceErr<T>(thunk: () => T, errMsg: string): T {
  try {
    return thunk();
  } catch (err) {
    throw new Error(errMsg);
  }
}
export async function asyncReplaceErr<T>(p: Promise<T>, errMsg: string): Promise<T> {
  try {
    return await p;
  } catch (err) {
    throw new Error(errMsg);
  }
}
