// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Système de logging professionnel pour IBEX SDK
 * Style Microsoft avec couleurs et formatage avancé
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamps: boolean;
  enableStackTraces: boolean;
  maxMessageLength: number;
}

class IbexLogger {
  private config: LogConfig = {
    level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.ERROR,
    enableColors: true,
    enableTimestamps: true,
    enableStackTraces: process.env.NODE_ENV === 'development',
    maxMessageLength: 1000,
  };

  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
  };

  private icons = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅',
    auth: '🔐',
    api: '🌐',
    wallet: '💼',
    transaction: '💸',
    kyc: '📋',
    loading: '⏳',
  };

  /**
   * Configure le logger
   */
  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Formate un message avec timestamp et couleurs
   */
  private formatMessage(
    level: LogLevel,
    category: string,
    message: string,
    data?: unknown
  ): string {
    const timestamp = this.config.enableTimestamps
      ? `${this.colors.dim}[${new Date().toISOString()}]${this.colors.reset} `
      : '';

    const levelInfo = this.getLevelInfo(level);
    const categoryInfo = this.formatCategory(category);
    const messageInfo = this.formatMessageText(message);

    let formatted = `${timestamp}${levelInfo} ${categoryInfo} ${messageInfo}`;

    if (data && this.config.level <= LogLevel.DEBUG) {
      formatted += `\n${this.formatData(data)}`;
    }

    return formatted;
  }

  /**
   * Obtient les informations de niveau avec icône et couleur
   */
  private getLevelInfo(level: LogLevel): string {
    const levelConfig = {
      [LogLevel.DEBUG]: { icon: this.icons.debug, color: this.colors.cyan, name: 'DEBUG' },
      [LogLevel.INFO]: { icon: this.icons.info, color: this.colors.blue, name: 'INFO' },
      [LogLevel.WARN]: { icon: this.icons.warn, color: this.colors.yellow, name: 'WARN' },
      [LogLevel.ERROR]: { icon: this.icons.error, color: this.colors.red, name: 'ERROR' },
    };

    const config = levelConfig[level as keyof typeof levelConfig];
    if (!config) return '';

    const color = this.config.enableColors ? config.color : '';
    const reset = this.config.enableColors ? this.colors.reset : '';

    return `${color}${config.icon} ${config.name}${reset}`;
  }

  /**
   * Formate la catégorie avec style
   */
  private formatCategory(category: string): string {
    const color = this.config.enableColors ? this.colors.bright + this.colors.blue : '';
    const reset = this.config.enableColors ? this.colors.reset : '';
    return `${color}[${category}]${reset}`;
  }

  /**
   * Formate le texte du message
   */
  private formatMessageText(message: string): string {
    if (message.length > this.config.maxMessageLength) {
      message = `${message.substring(0, this.config.maxMessageLength)}...`;
    }
    return message;
  }

  /**
   * Formate les données supplémentaires
   */
  private formatData(data: unknown): string {
    try {
      const formatted = JSON.stringify(data, null, 2);
      const color = this.config.enableColors ? this.colors.dim : '';
      const reset = this.config.enableColors ? this.colors.reset : '';
      return `${color}${formatted}${reset}`;
    } catch {
      return String(data);
    }
  }

  /**
   * Log un message de debug
   */
  debug(category: string, message: string, data?: unknown): void {
    if (this.config.level <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage(LogLevel.DEBUG, category, message, data));
    }
  }

  /**
   * Log un message d'information
   */
  info(category: string, message: string, data?: unknown): void {
    if (this.config.level <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage(LogLevel.INFO, category, message, data));
    }
  }

  /**
   * Log un avertissement
   */
  warn(category: string, message: string, data?: unknown): void {
    if (this.config.level <= LogLevel.WARN) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage(LogLevel.WARN, category, message, data));
    }
  }

  /**
   * Log une erreur
   */
  error(category: string, message: string, error?: unknown): void {
    if (this.config.level <= LogLevel.ERROR) {
      // eslint-disable-next-line no-console
      console.error(this.formatMessage(LogLevel.ERROR, category, message, error));

      if (this.config.enableStackTraces && error instanceof Error && error.stack) {
        const stackColor = this.config.enableColors ? this.colors.dim : '';
        const reset = this.config.enableColors ? this.colors.reset : '';
        // eslint-disable-next-line no-console
        console.error(`${stackColor}${error.stack}${reset}`);
      }
    }
  }

  /**
   * Log de succès (alias pour info avec icône de succès)
   */
  success(category: string, message: string, data?: unknown): void {
    const color = this.config.enableColors ? this.colors.green : '';
    const reset = this.config.enableColors ? this.colors.reset : '';
    const icon = this.icons.success;
    const formatted = `${color}${icon} ${message}${reset}`;
    this.info(category, formatted, data);
  }

  /**
   * Log d'authentification
   */
  auth(message: string, data?: unknown): void {
    const color = this.config.enableColors ? this.colors.magenta : '';
    const reset = this.config.enableColors ? this.colors.reset : '';
    const icon = this.icons.auth;
    const formatted = `${color}${icon} ${message}${reset}`;
    this.info('AUTH', formatted, data);
  }

  /**
   * Log d'API
   */
  api(message: string, data?: unknown): void {
    const color = this.config.enableColors ? this.colors.cyan : '';
    const reset = this.config.enableColors ? this.colors.reset : '';
    const icon = this.icons.api;
    const formatted = `${color}${icon} ${message}${reset}`;
    this.info('API', formatted, data);
  }

  /**
   * Log de portefeuille
   */
  wallet(message: string, data?: unknown): void {
    const color = this.config.enableColors ? this.colors.yellow : '';
    const reset = this.config.enableColors ? this.colors.reset : '';
    const icon = this.icons.wallet;
    const formatted = `${color}${icon} ${message}${reset}`;
    this.info('WALLET', formatted, data);
  }

  /**
   * Log de transaction
   */
  transaction(message: string, data?: unknown): void {
    const color = this.config.enableColors ? this.colors.green : '';
    const reset = this.config.enableColors ? this.colors.reset : '';
    const icon = this.icons.transaction;
    const formatted = `${color}${icon} ${message}${reset}`;
    this.info('TX', formatted, data);
  }

  /**
   * Log de KYC
   */
  kyc(message: string, data?: unknown): void {
    const color = this.config.enableColors ? this.colors.blue : '';
    const reset = this.config.enableColors ? this.colors.reset : '';
    const icon = this.icons.kyc;
    const formatted = `${color}${icon} ${message}${reset}`;
    this.info('KYC', formatted, data);
  }

  /**
   * Log de chargement
   */
  loading(message: string, data?: unknown): void {
    const color = this.config.enableColors ? this.colors.dim : '';
    const reset = this.config.enableColors ? this.colors.reset : '';
    const icon = this.icons.loading;
    const formatted = `${color}${icon} ${message}${reset}`;
    this.info('LOADING', formatted, data);
  }

  /**
   * Crée un groupe de logs
   */
  group(title: string): void {
    if (this.config.level <= LogLevel.DEBUG) {
      const color = this.config.enableColors ? this.colors.bright + this.colors.blue : '';
      const reset = this.config.enableColors ? this.colors.reset : '';
      // eslint-disable-next-line no-console
      console.group(`${color}${title}${reset}`);
    }
  }

  /**
   * Ferme un groupe de logs
   */
  groupEnd(): void {
    if (this.config.level <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }

  /**
   * Trace le début d'une opération
   */
  traceStart(operation: string, data?: unknown): void {
    this.loading(`Début: ${operation}`, data);
  }

  /**
   * Trace la fin d'une opération
   */
  traceEnd(operation: string, success: boolean = true, data?: unknown): void {
    if (success) {
      this.success(`Terminé: ${operation}`, data as string);
    } else {
      this.error('OPERATION', `Échec: ${operation}`, data);
    }
  }
}

// Instance singleton
export const logger = new IbexLogger();

// Export des types pour utilisation externe
export { IbexLogger };
