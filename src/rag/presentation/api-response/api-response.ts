import { Meta } from './meta';

export class ApiResponse<T> {
  success: boolean;
  data: T;
  meta: Meta;

  private constructor(success: boolean, data: T, meta: Meta) {
    this.success = success;
    this.data = data;
    this.meta = meta;
  }

  static success<T>(data: T, meta?: Meta): ApiResponse<T> {
    return new ApiResponse<T>(true, data, meta || new Meta({}));
  }

  static error<T>(message: string, data?: T): ApiResponse<T | undefined> {
    return new ApiResponse<T | undefined>(false, data, new Meta({ message }));
  }
}
