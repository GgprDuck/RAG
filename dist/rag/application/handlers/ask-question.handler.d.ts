import { TextRagPort } from "../../domain/ports/textRagPort";
import { LoggerPort } from "../../shared/application/ports/logger.port";
import { AskQuestionCommand } from "../commands/ask-question.command";
import { IGenerateAnswer } from "../common/interfaces/rag-documents.interfaces";
export declare class AskQuestionHandler {
    private readonly textRag;
    private readonly logger;
    constructor(textRag: TextRagPort, logger: LoggerPort);
    execute(cmd: AskQuestionCommand): Promise<IGenerateAnswer>;
}
