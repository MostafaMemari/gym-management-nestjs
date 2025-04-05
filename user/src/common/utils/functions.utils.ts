export const sortObject = (object: object) => {
  return Object.keys(object)
    .sort()
    .reduce((obj, key) => ({ ...obj, [key]: object[key] }), {});
};
