export const transformId = (data: object, _id: any) => {
  return {
    ...data,
    _id: undefined,
    id: _id,
  };
};
