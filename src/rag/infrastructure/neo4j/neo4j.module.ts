import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Neo4jKnowledgeGraphService } from './neo4j-knowledge-graph.service';
import { ConsoleLoggerAdapter } from 'src/rag/shared/application/ports/console.logger.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    Neo4jKnowledgeGraphService,
    {
      provide: 'IKnowledgeGraphService',
      useClass: Neo4jKnowledgeGraphService,
    },
    { 
      provide: 'LoggerPort',
      useClass: ConsoleLoggerAdapter 
    },
  ],
  exports: [
    'IKnowledgeGraphService',
    Neo4jKnowledgeGraphService,
  ],
})
export class Neo4jModule {}
