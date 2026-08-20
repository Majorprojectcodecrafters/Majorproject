const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logLevels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    const logString = JSON.stringify(logEntry);

    // Console output
    const colorMap = {
      ERROR: '\x1b[31m',    // Red
      WARN: '\x1b[33m',     // Yellow
      INFO: '\x1b[36m',     // Cyan
      DEBUG: '\x1b[35m'     // Magenta
    };

    console.log(`${colorMap[level]}[${level}]\x1b[0m ${timestamp} - ${message}`);

    // File output
    fs.appendFileSync(this.logFile, logString + '\n', { encoding: 'utf8' });
  }

  error(message, data) {
    this.log(logLevels.ERROR, message, data);
  }

  warn(message, data) {
    this.log(logLevels.WARN, message, data);
  }

  info(message, data) {
    this.log(logLevels.INFO, message, data);
  }

  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      this.log(logLevels.DEBUG, message, data);
    }
  }
}

module.exports = new Logger();
