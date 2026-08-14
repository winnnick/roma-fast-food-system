export class RefreshSessionCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly userAgent: string | null,
    public readonly ipAddress: string | null,
  ) {}
}
