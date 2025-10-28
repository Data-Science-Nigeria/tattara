export function hasProp<T extends object, K extends string>(
  obj: T,
  prop: K,
): prop is K & keyof T {
  return prop in obj;
}
