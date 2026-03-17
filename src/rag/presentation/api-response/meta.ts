export class Meta {
  message?: string;
  count?: number;
  timestamp: string;

  constructor(partial: Partial<Meta>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }
}
