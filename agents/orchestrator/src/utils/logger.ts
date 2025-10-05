import chalk from 'chalk';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = this.getTimestamp();
    const formattedArgs = args.length > 0 ? JSON.stringify(args, null, 2) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${formattedArgs}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(chalk.blue(this.formatMessage('info', message, ...args)));
  }

  warn(message: string, ...args: any[]): void {
    console.log(chalk.yellow(this.formatMessage('warn', message, ...args)));
  }

  error(message: string, ...args: any[]): void {
    console.error(chalk.red(this.formatMessage('error', message, ...args)));
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray(this.formatMessage('debug', message, ...args)));
    }
  }

  success(message: string, ...args: any[]): void {
    console.log(chalk.green(this.formatMessage('success', message, ...args)));
  }
}

export const logger = new Logger();
