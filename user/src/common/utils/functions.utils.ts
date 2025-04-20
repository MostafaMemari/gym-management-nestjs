type SortedObject<T = object> = (object: T) => T;

export const sortObject: SortedObject = (object) => {
  return Object.keys(object)
    .sort()
    .reduce((obj, key) => ({ ...obj, [key]: object[key] }), {});
};
