export class ProcessImagesCommand {
  constructor(public readonly files: Express.Multer.File[]) {}
}
