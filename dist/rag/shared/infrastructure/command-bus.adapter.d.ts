import { CommandBusPort, ICommandHandler } from '../application/ports/command-bus.port';
export declare class CommandBusAdapter implements CommandBusPort {
    private readonly handlers;
    register<TCommand extends object, TResult = void>(commandClass: new (...args: any[]) => TCommand, handler: ICommandHandler<TCommand, TResult>): void;
    execute<TResult = void>(command: object): Promise<TResult>;
}
