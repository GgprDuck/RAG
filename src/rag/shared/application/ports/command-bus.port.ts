export interface ICommandHandler<TCommand, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}

export interface CommandBusPort {
  execute<TResult = void>(command: object): Promise<TResult>;
  register<TCommand extends object, TResult = void>(
    commandClass: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>,
  ): void;
}
