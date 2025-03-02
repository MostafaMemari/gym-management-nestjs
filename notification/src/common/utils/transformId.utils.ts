export const transformId = (data: object, _id: any) => {
  return {
    ...data,
    _id: undefined,
    id: _id,
  };
};


export const transformArrayIds = (data: object[], _id: any[]) => {
  return data.map(item => ({ ...item, _id: undefined, id: _id }))
}