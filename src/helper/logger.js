const { format, createLogger, transports } = require('winston');
const { combine, timestamp, printf } = format;
const myFormat = printf(({ level, message, timestamp }) => `${timestamp}-${level}-${message}`);
module.exports = createLogger({
  level: 'debug',
  transports: [new transports.Console(), new transports.File({ filename: 'logs/logFile.log' })],
  format: combine(timestamp(), myFormat),
});
