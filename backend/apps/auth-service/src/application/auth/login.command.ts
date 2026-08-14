export class LoginCommand {
  constructor(
    public readonly username: string,
    public readonly password: string,
    public readonly userAgent: string | null,
    public readonly ipAddress: string | null,
  ) {}
}
