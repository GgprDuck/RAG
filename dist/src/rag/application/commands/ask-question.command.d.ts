import { AskQuestionOptions } from "../../domain/interfaces/ask-question.interface";
export type { AskQuestionOptions };
export declare class AskQuestionCommand {
    readonly question: string;
    readonly options?: AskQuestionOptions | undefined;
    constructor(question: string, options?: AskQuestionOptions | undefined);
}
