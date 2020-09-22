export const promisify = (fn: any) => (...args: Array<any>): Promise<any> =>
  new Promise((resolve, reject) => {
    fn(...args, resolve, reject);
  });
