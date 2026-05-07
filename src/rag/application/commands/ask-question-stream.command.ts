import { AskQuestionOptions } from '../../domain/interfaces/ask-question.interface';

export class AskQuestionStreamCommand {
  constructor(
    public readonly question: string,
    public readonly options?: AskQuestionOptions,
  ) {}
}
