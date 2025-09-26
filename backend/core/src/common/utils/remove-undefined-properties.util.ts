export function removeUndefinedProperties<T extends object>(obj: T): T {
  (Object.keys(obj) as Array<keyof T>).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
}
