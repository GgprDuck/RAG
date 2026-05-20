import { IUploadedFile } from "../../domain/interfaces/upload-folder.interface";
import { UploadFolderOptions } from "../../domain/interfaces/upload-folder-options.interface";
export type { UploadFolderOptions };
export declare class UploadFolderCommand {
    readonly files: IUploadedFile[];
    readonly options?: UploadFolderOptions | undefined;
    constructor(files: IUploadedFile[], options?: UploadFolderOptions | undefined);
}
