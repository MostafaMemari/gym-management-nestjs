export interface ServiceResponse<DataType extends object = any> {
  message: string;
  status: number;
  error: boolean;
  data: DataType;
}
