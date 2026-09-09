export interface Client {
  readonly name: string;
}

export interface Site {
  readonly client: Client;
  readonly name: string;
  readonly city: string;
  readonly country: string;
}