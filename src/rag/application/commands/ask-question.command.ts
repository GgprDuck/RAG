import { AskQuestionOptions } from "../../domain/interfaces/ask-question.interface";

export type { AskQuestionOptions };

export class AskQuestionCommand {
  constructor(
    public readonly question: string,
    public readonly options?: AskQuestionOptions,
  ) {}
}
