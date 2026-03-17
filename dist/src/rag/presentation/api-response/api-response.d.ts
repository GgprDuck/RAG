import { Meta } from './meta';
export declare class ApiResponse<T> {
    success: boolean;
    data: T;
    meta: Meta;
    private constructor();
    static success<T>(data: T, meta?: Meta): ApiResponse<T>;
    static error<T>(message: string, data?: T): ApiResponse<T | undefined>;
}
