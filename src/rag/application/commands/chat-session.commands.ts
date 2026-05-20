export class ListChatsQuery {
  constructor(public readonly limit?: number) {}
}

export class GetChatQuery {
  constructor(
    public readonly sessionId: string,
    public readonly limit?: number,
  ) {}
}

export class DeleteChatCommand {
  constructor(public readonly sessionId: string) {}
}

export class ClearAllChatsCommand {}
