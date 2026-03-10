export class CliError extends Error {
  readonly exitCode: number;
  readonly quiet: boolean;

  constructor(message: string, exitCode = 1, options?: ErrorOptions & { quiet?: boolean }) {
    super(message, options);
    this.name = new.target.name;
    this.exitCode = exitCode;
    this.quiet = options?.quiet ?? false;
  }
}

export class UsageError extends CliError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 2, options);
  }
}

export class OperationError extends CliError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 1, options);
  }
}

export class SilentCliError extends CliError {
  constructor(exitCode: number) {
    super('', exitCode, { quiet: true });
  }
}
