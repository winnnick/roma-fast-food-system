export class ListClientsQuery {}

export class GetClientByIdQuery {
  constructor(public readonly id: number) {}
}
