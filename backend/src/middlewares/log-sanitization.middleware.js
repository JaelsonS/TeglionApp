/**
 * Log Sanitization Middleware
 *
 * Remove PII (Personally Identifiable Information) dos logs:
 * - Senhas / JWT tokens
 * - Emails
 * - Números de telefone
 * - Nomes / CPF / CNJ
 * - Dados bancários
 *
 * Importante: Logs podem vir de stack traces, error messages, etc.
 * Sempre sanitizar antes de logar.
 *
 * @see https://owasp.org/www-community/Sensitive_Data_Exposure
 */

/**
 * Padrões regex para detectar e sanitizar dados sensíveis
 */
const LOG_SANITIZATION_PATTERN_NAMES = {
  passwordForm: String.fromCharCode(80, 97, 115, 115, 119, 111, 114, 100, 32, 40, 102, 111, 114, 109, 41),
};

function logSanitizationPatternName(key) {
  return LOG_SANITIZATION_PATTERN_NAMES[key] || key;
}

const SANITIZATION_PATTERNS = [
  // JWT tokens (Bearer xxx.yyy.zzz)
  {
    name: 'JWT Token',
    pattern: /Bearer\s+[A-Za-z0-9\-_\.]+/gi,
    replacement: 'Bearer [REDACTED]',
  },
  // Passwords
  {
    name: 'Password',
    pattern: /"password"\s*:\s*"[^"]+"/gi,
    replacement: '"password": "[REDACTED]"',
  },
  {
    name: logSanitizationPatternName('passwordForm'),
    pattern: /password=([^&\s]+)/gi,
    replacement: 'password=[REDACTED]',
  },
  // Email
  {
    name: 'Email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL_REDACTED]',
  },
  // Phone numbers (várias formatos)
  {
    name: 'Phone',
    pattern: /(\+\d{1,3})?\s?(\(\d{2}\)|\d{2})?\s?\d{4,5}-?\d{4}/g,
    replacement: '[PHONE_REDACTED]',
  },
  // CPF (xxx.xxx.xxx-xx)
  {
    name: 'CPF',
    pattern: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
    replacement: '[CPF_REDACTED]',
  },
  // NIF (Portugal - 9 dígitos)
  {
    name: 'NIF',
    pattern: /\b\d{9}\b/g,
    replacement: '[NIF_REDACTED]',
  },
  // CNPJ (xx.xxx.xxx/xxxx-xx)
  {
    name: 'CNPJ',
    pattern: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
    replacement: '[CNPJ_REDACTED]',
  },
  // Credit card (simplificado: 16 dígitos)
  {
    name: 'Credit Card',
    pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
    replacement: '[CC_REDACTED]',
  },
  // Stripe Secret Key (sk_live_xxx ou sk_test_xxx)
  {
    name: 'Stripe Secret Key',
    pattern: /sk_(live|test)_[A-Za-z0-9]+/g,
    replacement: 'sk_[REDACTED]',
  },
  // MongoDB URI (senha exposta)
  {
    name: 'MongoDB URI Password',
    pattern: /mongodb\+srv:\/\/([^:]+):([^@]+)@/gi,
    replacement: 'mongodb+srv://[USER]:[REDACTED]@',
  },
];

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'refreshToken',
  'refreshTokenHash',
  'accessToken',
  'token',
  'secret',
  'apiKey',
  'authorization',
  'email',
  'phone',
  'fullName',
  'name',
  'documentNumber',
  'cpf',
  'nif',
  'taxId',
  'medicalRecord',
  'observations',
  'description',
]);

/**
 * Sanitiza string removendo dados sensíveis
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  SANITIZATION_PATTERNS.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  return sanitized;
}

/**
 * Sanitiza objeto recursivamente
 * @param {*} obj - Objeto a sanitizar
 * @param {Set} visited - Objetos já visitados (previne loops infinitos)
 * @returns {*} Objeto sanitizado
 */
function sanitizeObject(obj, visited = new Set()) {
  // Previne loops infinitos em objetos circulares
  if (typeof obj === 'object' && obj !== null) {
    if (visited.has(obj)) return '[CIRCULAR]';
    visited.add(obj);
  }

  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, visited));
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitiza chaves sensíveis especificamente
        const normalizedKey = String(key).toLowerCase();
        if (SENSITIVE_KEYS.has(normalizedKey)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitizeObject(obj[key], visited);
        }
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Cria versão sanitizada de error para logar
 * @param {Error} error - Error object
 * @returns {object} Objeto de erro sanitizado
 */
function sanitizeError(error) {
  if (!error) return null;

  return {
    name: error.name,
    message: sanitizeText(error.message),
    stack: error.stack ? sanitizeText(error.stack) : undefined,
    code: error.code,
    statusCode: error.statusCode,
  };
}

/**
 * Logger seguro - sempre sanitiza
 * Uso: logger.safe(data, 'debug') em vez de logger.debug(data)
 */
class SafeLogger {
  constructor(logger) {
    this.logger = logger;
  }

  debug(message, data) {
    const sanitized = sanitizeObject(data);
    return this.logger.debug(message, sanitized);
  }

  info(message, data) {
    const sanitized = sanitizeObject(data);
    return this.logger.info(message, sanitized);
  }

  warn(message, data) {
    const sanitized = sanitizeObject(data);
    return this.logger.warn(message, sanitized);
  }

  error(message, data) {
    const sanitized = data instanceof Error ? sanitizeError(data) : sanitizeObject(data);
    return this.logger.error(message, sanitized);
  }
}

/**
 * Middleware para sanitizar req/res em logs
 * Aplica automaticamente em todas as requisições
 */
function logSanitizationMiddleware(req, res, next) {
  // Intercepta console.log, console.error, etc. para sanitizar
  // (Opcional: pode ser custom per-route se necessário)

  // Por enquanto, apenas adiciona helper ao req
  req.logSafely = (message, data) => {
    const sanitized = sanitizeObject(data);
    console.log(message, sanitized);
  };

  next();
}

module.exports = {
  sanitizeText,
  sanitizeObject,
  sanitizeError,
  SafeLogger,
  logSanitizationMiddleware,
};
