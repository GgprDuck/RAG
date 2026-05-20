export class GetAllDocumentsQuery {}

export class GetAllImagesQuery {
  constructor(public readonly limit?: number) {}
}

export class GetImagesByKeywordQuery {
  constructor(
    public readonly query: string,
    public readonly limit?: number,
  ) {}
}

import { AskQuestionOptions } from 'src/rag/domain/interfaces/ask-question.interface';

export class RetrieveDocumentsQuery {
  constructor(
    public readonly query: string,
    public readonly limit?: number,
    public readonly options?: Pick<
      AskQuestionOptions,
      | 'useHybridSearch'
      | 'useReranking'
      | 'rerankStrategy'
      | 'useQueryTransformation'
      | 'useContextualCompression'
      | 'scoreThreshold'
      | 'filters'
    >,
  ) {}
}
