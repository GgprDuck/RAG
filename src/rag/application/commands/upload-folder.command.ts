import { IUploadedFile } from 'src/rag/domain/interfaces/upload-folder.interface';
import { UploadFolderOptions } from 'src/rag/domain/interfaces/upload-folder-options.interface';

export type { UploadFolderOptions };

export class UploadFolderCommand {
  constructor(
    public readonly files: IUploadedFile[],
    public readonly options?: UploadFolderOptions,
  ) {}
}