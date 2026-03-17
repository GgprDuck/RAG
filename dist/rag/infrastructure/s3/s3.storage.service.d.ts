import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
export declare class S3StorageService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly s3Client;
    private readonly bucketName;
    private readonly publicUrl?;
    constructor(configService: ConfigService, logger: LoggerPort);
    onModuleInit(): Promise<void>;
    private ensureBucketExists;
    uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>;
    deleteFile(key: string): Promise<void>;
}
