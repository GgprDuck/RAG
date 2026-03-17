export class GetImagesByKeywordCommand {
  constructor(
    public readonly keyword: string,
    public readonly limit = 10,
  ) {}
}
