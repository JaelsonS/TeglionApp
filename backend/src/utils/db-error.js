const { AppError } = require('../middlewares/error.middleware');

/**
 * Converte erros Postgres/Supabase em AppError com status HTTP adequado.
 */
function mapDbError(err, fallbackMessage = 'Erro ao processar o pedido') {
  if (err instanceof AppError) return err;

  const code = String(err?.code || '');
  const message = String(err?.message || '');

  if (code === '23505') {
    if (/email/i.test(message) || /firm_users/i.test(message)) {
      return new AppError('E-mail já registado', 409, { code: 'EMAIL_ALREADY_EXISTS' });
    }
    if (/slug/i.test(message) || /firms/i.test(message)) {
      return new AppError('Nome do escritório já está em uso. Escolha outro nome.', 409, {
        code: 'FIRM_SLUG_EXISTS',
      });
    }
    return new AppError('Registo duplicado', 409, { code: 'DUPLICATE' });
  }

  if (code === '42P01') {
    return new AppError(
      'Base de dados desactualizada. Contacte o suporte Teglion.',
      503,
      { code: 'DB_SCHEMA_OUTDATED' },
    );
  }

  if (code === '23503') {
    return new AppError(fallbackMessage, 400, { code: 'INVALID_REFERENCE' });
  }

  if (code === 'PGRST116') {
    return new AppError('Registo não encontrado', 404, { code: 'NOT_FOUND' });
  }

  return err;
}

module.exports = { mapDbError };
