import { Injectable } from '@nestjs/common';
import {
  CommandBusPort,
  ICommandHandler,
} from '../application/ports/command-bus.port';

@Injectable()
export class CommandBusAdapter implements CommandBusPort {
  private readonly handlers = new Map<string, ICommandHandler<any, any>>();

  register<TCommand extends object, TResult = void>(
    commandClass: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>,
  ): void {
    const key = commandClass.name;
    if (this.handlers.has(key)) {
      throw new Error(`CommandBus: Handler already registered for "${key}"`);
    }
    this.handlers.set(key, handler);
  }

  async execute<TResult = void>(command: object): Promise<TResult> {
    const key = command.constructor.name;
    const handler = this.handlers.get(key);

    if (!handler) {
      throw new Error(
        `CommandBus: No handler registered for command "${key}". ` +
          `Did you forget to call register() in RagCommandBusModule?`,
      );
    }

    return handler.execute(command) as Promise<TResult>;
  }
}
