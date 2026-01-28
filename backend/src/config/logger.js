/**
 * SpendAI Production Logger
 * 
 * Standardized logging levels for info, warn, and error.
 * Includes timestamps and context for production debugging.
 */

const isDev = process.env.NODE_ENV === 'development';

const log = (level, message, context = '') => {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    const logMessage = `[${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}`;

    switch (level.toLowerCase()) {
        case 'info':
            console.log(`\x1b[32m${logMessage}\x1b[0m`); // Green
            break;
        case 'warn':
            console.warn(`\x1b[33m${logMessage}\x1b[0m`); // Yellow
            break;
        case 'error':
            console.error(`\x1b[31m${logMessage}\x1b[0m`); // Red
            break;
        default:
            console.log(logMessage);
    }
};

module.exports = {
    info: (msg, ctx) => log('info', msg, ctx),
    warn: (msg, ctx) => log('warn', msg, ctx),
    error: (msg, ctx) => log('error', msg, ctx)
};
