export const transformId = (data: any) => {
  return {
    ...data,
    _id: undefined,
    id: data._id,
  };
};

export const transformArrayIds = (data: any[]) => {
  return data.map((item) => {
    return {
      ...item,
      _id: undefined,
      id: data.find((i) => i._id == item._id)._id,
    };
  });
};

export const sortObject = (object: object) => {
  return Object.keys(object)
    .sort()
    .reduce((obj, key) => ({ ...obj, [key]: object[key] }), {});
};
