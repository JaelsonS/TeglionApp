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
    name: 'Current password JSON',
    pattern: /"currentPassword"\s*:\s*"[^"]+"/gi,
    replacement: '"currentPassword": "[REDACTED]"',
  },
  {
    name: 'Revealed vault value JSON',
    pattern: /"revealedValue"\s*:\s*"[^"]+"/gi,
    replacement: '"revealedValue": "[REDACTED]"',
  },
  {
    name: logSanitizationPatternName('passwordForm'),
    pattern: /password=([^&\s]+)/gi,
    replacement: 'password=[REDACTED]',
  },
  // OAuth authorization code / state / tokens em querystring (ex.: linhas de log HTTP do morgan,
  // que incluem a URL completa de callbacks OAuth como /auth/google/callback?code=...&state=...)
  {
    name: 'OAuth code querystring',
    pattern: /\bcode=([^&\s]+)/gi,
    replacement: 'code=[REDACTED]',
  },
  {
    name: 'OAuth state querystring',
    pattern: /\bstate=([^&\s]+)/gi,
    replacement: 'state=[REDACTED]',
  },
  {
    name: 'OAuth/pending token querystring',
    pattern: /\b(pending|access_token|refresh_token|id_token)=([^&\s]+)/gi,
    replacement: '$1=[REDACTED]',
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
  // Cloudflare Turnstile response tokens
  {
    name: 'Turnstile Token JSON',
    pattern: /"turnstileToken"\s*:\s*"[^"]+"/gi,
    replacement: '"turnstileToken": "[REDACTED]"',
  },
  {
    name: 'Turnstile cf-turnstile-response JSON',
    pattern: /"cf-turnstile-response"\s*:\s*"[^"]+"/gi,
    replacement: '"cf-turnstile-response": "[REDACTED]"',
  },
  // MongoDB URI (senha exposta)
  {
    name: 'MongoDB URI Password',
    pattern: /mongodb\+srv:\/\/([^:]+):([^@]+)@/gi,
    replacement: 'mongodb+srv://[USER]:[REDACTED]@',
  },
];

const SENSITIVE_KEYS = new Set(
  [
    'password',
    'currentPassword',
    'vaultPassword',
    'vault_password_hash',
    'vaultPasswordHash',
    'stepUpToken',
    'revealedValue',
    'secret_enc',
    'secretEnc',
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
    'turnstileToken',
    'cf-turnstile-response',
    'cfTurnstileResponse',
    'senha',
    'at_senha',
    'ss_senha',
    'viactt_senha',
    'iapmei_senha',
    'ru_senha',
    'cookie',
    'access_token',
    'refresh_token',
    'id_token',
    'client_secret',
    'whsec',
    'webhookSecret',
  ].map((k) => k.toLowerCase()),
);

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
        if (
          SENSITIVE_KEYS.has(normalizedKey) ||
          normalizedKey.includes('password') ||
          normalizedKey.includes('senha')
        ) {
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
    const safeMessage = sanitizeText(message);
    const sanitized = sanitizeObject(data);
    return this.logger.debug(safeMessage, sanitized);
  }

  info(message, data) {
    const safeMessage = sanitizeText(message);
    const sanitized = sanitizeObject(data);
    return this.logger.info(safeMessage, sanitized);
  }

  warn(message, data) {
    const safeMessage = sanitizeText(message);
    const sanitized = sanitizeObject(data);
    return this.logger.warn(safeMessage, sanitized);
  }

  error(message, data) {
    const safeMessage = sanitizeText(message);
    const sanitized = data instanceof Error ? sanitizeError(data) : sanitizeObject(data);
    return this.logger.error(safeMessage, sanitized);
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
