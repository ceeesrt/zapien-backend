import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../logs');

// Crear directorio de logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL] : LOG_LEVELS.INFO;

class Logger {
  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Formatea log con timestamp y contexto
   */
  formatLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const uptime = ((Date.now() - this.startTime) / 1000).toFixed(1);

    return {
      timestamp,
      level,
      uptime: `${uptime}s`,
      message,
      data,
      env: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Escribe log en archivo y consola
   */
  write(level, message, data = {}) {
    const levelValue = LOG_LEVELS[level];

    // Verificar si el nivel debe ser logueado
    if (levelValue < CURRENT_LOG_LEVEL) {
      return;
    }

    const logObject = this.formatLog(level, message, data);
    const logString = JSON.stringify(logObject);

    // Escribe en consola (solo en desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      const colors = {
        DEBUG: '\x1b[36m', // cyan
        INFO: '\x1b[32m',  // green
        WARN: '\x1b[33m',  // yellow
        ERROR: '\x1b[31m'  // red
      };
      const reset = '\x1b[0m';

      const timestamp = new Date().toISOString();
      console.log(
        `${colors[level]}[${level}]${reset} ${timestamp} | ${message}`,
        Object.keys(data).length > 0 ? data : ''
      );
    }

    // Escribe en archivo
    const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    fs.appendFileSync(logFile, logString + '\n', 'utf8');

    // Escribe también en archivo general
    const generalLog = path.join(logsDir, 'all.log');
    fs.appendFileSync(generalLog, logString + '\n', 'utf8');
  }

  debug(message, data) {
    this.write('DEBUG', message, data);
  }

  info(message, data) {
    this.write('INFO', message, data);
  }

  warn(message, data) {
    this.write('WARN', message, data);
  }

  error(message, data) {
    this.write('ERROR', message, data);
  }

  /**
   * Log de performance
   */
  performance(operation, duration, metadata = {}) {
    const level = duration > 1000 ? 'WARN' : 'INFO';
    this.write(level, `Performance: ${operation}`, {
      durationMs: duration,
      ...metadata
    });
  }

  /**
   * Log de rate limit
   */
  rateLimit(userId, endpoint, requestCount, limit) {
    this.warn(`Rate limit warning`, {
      userId,
      endpoint,
      requests: `${requestCount}/${limit}`
    });
  }

  /**
   * Log de error crítico
   */
  critical(message, error, context = {}) {
    this.error(message, {
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
      ...context
    });

    // Enviar alerta (integración futura con Sentry, DataDog, etc.)
    // this.sendAlert(message, error, context);
  }
}

export default new Logger();
