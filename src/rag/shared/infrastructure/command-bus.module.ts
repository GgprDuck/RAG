import { Module } from '@nestjs/common';
import { CommandBusAdapter } from './command-bus.adapter';

@Module({
  providers: [
    {
      provide: 'CommandBus',
      useClass: CommandBusAdapter,
    },
  ],
  exports: ['CommandBus'],
})
export class RagCommandBusModule {}