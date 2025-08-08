/**
 * ProteusJS Logger
 * Centralized logging system with configurable levels and production-safe output
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggerConfig {
  level: LogLevel;
  prefix: string;
  enableInProduction: boolean;
  enableTimestamps: boolean;
  enableStackTrace: boolean;
}

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4
  };

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'warn',
      prefix: 'ProteusJS',
      enableInProduction: false,
      enableTimestamps: false,
      enableStackTrace: false,
      ...config
    };
  }

  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  public static configure(config: Partial<LoggerConfig>): void {
    if (Logger.instance) {
      Logger.instance.config = { ...Logger.instance.config, ...config };
    } else {
      Logger.instance = new Logger(config);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    // Don't log in production unless explicitly enabled
    if (process.env['NODE_ENV'] === 'production' && !this.config.enableInProduction) {
      return level === 'error'; // Only errors in production
    }

    return this.levels[level] >= this.levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): [string, ...unknown[]] {
    let formattedMessage = message;

    // Add prefix
    if (this.config.prefix) {
      formattedMessage = `${this.config.prefix}: ${formattedMessage}`;
    }

    // Add timestamp
    if (this.config.enableTimestamps) {
      const timestamp = new Date().toISOString();
      formattedMessage = `[${timestamp}] ${formattedMessage}`;
    }

    // Add log level
    const levelPrefix = level.toUpperCase().padEnd(5);
    formattedMessage = `[${levelPrefix}] ${formattedMessage}`;

    return [formattedMessage, ...args];
  }

  public debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;

    const [formattedMessage, ...formattedArgs] = this.formatMessage('debug', message, ...args);
    console.debug(formattedMessage, ...formattedArgs);

    if (this.config.enableStackTrace) {
      console.trace();
    }
  }

  public info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;

    const [formattedMessage, ...formattedArgs] = this.formatMessage('info', message, ...args);
    console.info(formattedMessage, ...formattedArgs);
  }

  public warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;

    const [formattedMessage, ...formattedArgs] = this.formatMessage('warn', message, ...args);
    console.warn(formattedMessage, ...formattedArgs);
  }

  public error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return;

    const [formattedMessage, ...formattedArgs] = this.formatMessage('error', message, ...args);
    
    if (error instanceof Error) {
      console.error(formattedMessage, error, ...formattedArgs);
      if (this.config.enableStackTrace && error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else if (error) {
      console.error(formattedMessage, error, ...formattedArgs);
    } else {
      console.error(formattedMessage, ...formattedArgs);
    }
  }

  public group(label: string): void {
    if (!this.shouldLog('info')) return;
    console.group(`${this.config.prefix}: ${label}`);
  }

  public groupEnd(): void {
    if (!this.shouldLog('info')) return;
    console.groupEnd();
  }

  public time(label: string): void {
    if (!this.shouldLog('debug')) return;
    console.time(`${this.config.prefix}: ${label}`);
  }

  public timeEnd(label: string): void {
    if (!this.shouldLog('debug')) return;
    console.timeEnd(`${this.config.prefix}: ${label}`);
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  public getLevel(): LogLevel {
    return this.config.level;
  }

  public isEnabled(level: LogLevel): boolean {
    return this.shouldLog(level);
  }
}

// Create default logger instance
export const logger = Logger.getInstance({
  level: process.env['NODE_ENV'] === 'development' ? 'debug' : 'warn',
  prefix: 'ProteusJS',
  enableInProduction: false,
  enableTimestamps: process.env['NODE_ENV'] === 'development',
  enableStackTrace: false
});

// Convenience functions
export const debug = (message: string, ...args: unknown[]): void => logger.debug(message, ...args);
export const info = (message: string, ...args: unknown[]): void => logger.info(message, ...args);
export const warn = (message: string, ...args: unknown[]): void => logger.warn(message, ...args);
export const error = (message: string, error?: Error | unknown, ...args: unknown[]): void => logger.error(message, error, ...args);

export default logger;
