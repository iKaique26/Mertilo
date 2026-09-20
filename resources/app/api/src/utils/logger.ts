type LogLevel = 'info' | 'warn' | 'error';

function format(level: LogLevel, message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] ${level.toUpperCase()}`;
  if (args.length === 0) {
    console.log(prefix, message);
    return;
  }
  console.log(prefix, message, ...args);
}

export const logger = {
  info(message: string, ...args: unknown[]) {
    format('info', message, ...args);
  },
  warn(message: string, ...args: unknown[]) {
    format('warn', message, ...args);
  },
  error(message: string, ...args: unknown[]) {
    format('error', message, ...args);
  },
};
