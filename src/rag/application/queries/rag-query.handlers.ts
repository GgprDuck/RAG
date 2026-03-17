import { Injectable, Inject } from "@nestjs/common";
import { LoggerPort } from "src/rag/shared/application/ports/logger.port";
import { IImageWithoutScore, IImageWithScore } from "../common/interfaces/image.interfaces";
import { IDocumentWithoutEmbedding, IDocumentWithEmbedding } from "../common/interfaces/rag-documents.interfaces";
import { GetAllDocumentsQuery, GetAllImagesQuery, GetImagesByKeywordQuery, RetrieveDocumentsQuery } from "./rag.queries";
import { ImageRagPort } from "src/rag/domain/ports/image-rag.port";
import { TextRagPort } from "src/rag/domain/ports/textRagPort";

@Injectable()
export class GetAllDocumentsHandler {
  constructor(
    @Inject('TextRagPort') private readonly textRag: TextRagPort,
  ) {}

  async execute(_query: GetAllDocumentsQuery): Promise<IDocumentWithoutEmbedding[]> {
    return this.textRag.getAllDocuments();
  }
}

@Injectable()
export class GetAllImagesHandler {
  constructor(
    @Inject('ImageRagPort') private readonly imageRag: ImageRagPort,
  ) {}

  async execute(query: GetAllImagesQuery): Promise<IImageWithoutScore[]> {
    return this.imageRag.getAllImages(query.limit);
  }
}

@Injectable()
export class GetImagesByKeywordHandler {
  constructor(
    @Inject('ImageRagPort') private readonly imageRag: ImageRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(query: GetImagesByKeywordQuery): Promise<IImageWithScore[]> {
    this.logger.log('GetImagesByKeyword', { query: query.query, limit: query.limit });
    return this.imageRag.getImagesByKeyword(query.query, query.limit);
  }
}

@Injectable()
export class RetrieveDocumentsHandler {
  constructor(
    @Inject('TextRagPort') private readonly textRag: TextRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(query: RetrieveDocumentsQuery): Promise<IDocumentWithEmbedding[] | string> {
    this.logger.log('RetrieveDocuments', { query: query.query, limit: query.limit });
    return this.textRag.retrieve(query.query, query.limit, query.options);
  }
}
