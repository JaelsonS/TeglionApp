const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const accountingServicesService = require('./accounting-services.service');

function resetMocks() {
  mock.restoreAll();
}

test('normalizeIntakeForm: undefined passa por undefined (não altera o patch)', () => {
  assert.equal(accountingServicesService.normalizeIntakeForm(undefined), undefined);
});

test('normalizeIntakeForm: null limpa o formulário', () => {
  assert.equal(accountingServicesService.normalizeIntakeForm(null), null);
});

test('normalizeIntakeForm: rejeita tipo de pergunta inválido', () => {
  assert.throws(
    () => accountingServicesService.normalizeIntakeForm({ questions: [{ label: 'X', type: 'nao_existe' }] }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('normalizeIntakeForm: id fornecido é preservado mesmo que o label mude entre chamadas', () => {
  const first = accountingServicesService.normalizeIntakeForm({
    questions: [{ id: 'q_estavel', label: 'Qual foi o seu rendimento anual?', type: 'text' }],
  });
  const second = accountingServicesService.normalizeIntakeForm({
    questions: [{ id: 'q_estavel', label: 'Qual foi o seu rendimento anual de 2026?', type: 'text' }],
  });
  assert.equal(first.questions[0].id, 'q_estavel');
  assert.equal(second.questions[0].id, 'q_estavel');
  assert.notEqual(first.questions[0].label, second.questions[0].label);
});

test('normalizeIntakeForm: sem id fornecido, gera um fallback não-vazio (rede de segurança)', () => {
  const form = accountingServicesService.normalizeIntakeForm({
    questions: [{ label: 'Tem rendimentos prediais?', type: 'yes_no' }],
  });
  assert.equal(form.questions.length, 1);
  assert.equal(typeof form.questions[0].id, 'string');
  assert.ok(form.questions[0].id.length > 0);
  assert.ok(form.questions[0].id.startsWith('q_'));
});

test('normalizeIntakeForm: fallback de id nunca é derivado do label (duas perguntas iguais recebem ids diferentes)', () => {
  const form = accountingServicesService.normalizeIntakeForm({
    questions: [
      { label: 'Tem dependentes?', type: 'yes_no' },
      { label: 'Tem dependentes?', type: 'yes_no' },
    ],
  });
  assert.notEqual(form.questions[0].id, form.questions[1].id);
});

test('normalizeIntakeForm: yes_no sem opções ganha Sim/Não por omissão', () => {
  const form = accountingServicesService.normalizeIntakeForm({
    questions: [{ id: 'q1', label: 'Tem imóveis?', type: 'yes_no' }],
  });
  assert.deepEqual(
    form.questions[0].options.map((o) => o.id),
    ['sim', 'nao'],
  );
});

test('normalizeIntakeForm: opção com documentTags é preservada', () => {
  const form = accountingServicesService.normalizeIntakeForm({
    questions: [
      {
        id: 'q1',
        label: 'Tem imóveis?',
        type: 'single_choice',
        options: [
          { id: 'sim', label: 'Sim', documentTags: ['caderneta_predial'] },
          { id: 'nao', label: 'Não' },
        ],
      },
    ],
  });
  assert.deepEqual(form.questions[0].options[0].documentTags, ['caderneta_predial']);
  assert.deepEqual(form.questions[0].options[1].documentTags, []);
});

test('normalizeBookingOverrides: undefined passa por undefined (não altera o patch)', () => {
  assert.equal(accountingServicesService.normalizeBookingOverrides(undefined), undefined);
});

test('normalizeBookingOverrides: null remove os overrides (volta a herdar do escritório)', () => {
  assert.equal(accountingServicesService.normalizeBookingOverrides(null), null);
});

test('normalizeBookingOverrides: objecto vazio normaliza para null (nada para sobrepor)', () => {
  assert.equal(accountingServicesService.normalizeBookingOverrides({}), null);
});

test('normalizeBookingOverrides: aceita apenas alguns campos, ignora os restantes (parcial por desenho)', () => {
  const out = accountingServicesService.normalizeBookingOverrides({ weekdays: [1, 2, 3] });
  assert.deepEqual(out, { weekdays: [1, 2, 3] });
});

test('normalizeBookingOverrides: rejeita weekdays vazio', () => {
  assert.throws(
    () => accountingServicesService.normalizeBookingOverrides({ weekdays: [] }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('normalizeBookingOverrides: rejeita slotMinutes fora do intervalo', () => {
  assert.throws(
    () => accountingServicesService.normalizeBookingOverrides({ slotMinutes: 5 }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('normalizeBookingOverrides: rejeita timezone fora da whitelist', () => {
  assert.throws(
    () => accountingServicesService.normalizeBookingOverrides({ timezone: 'America/New_York' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('normalizeBookingOverrides: dayStart/dayEnd válidos são preservados', () => {
  const out = accountingServicesService.normalizeBookingOverrides({ dayStart: '09:00', dayEnd: '13:00' });
  assert.deepEqual(out, { dayStart: '09:00', dayEnd: '13:00' });
});

test('normalizeBookingOverrides: schedule com múltiplos intervalos', () => {
  const out = accountingServicesService.normalizeBookingOverrides({
    schedule: {
      1: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ],
    },
  });
  assert.deepEqual(out.weekdays, [1]);
  assert.deepEqual(out.schedule[1], [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ]);
});

test('assertFormReadyForPublish: sem intake_form, não bloqueia (formulário mínimo é válido)', () => {
  accountingServicesService.assertFormReadyForPublish(null);
  accountingServicesService.assertFormReadyForPublish({ questions: [] });
});

test('assertFormReadyForPublish: yes_no nunca bloqueia (normalizeIntakeForm já garante Sim/Não)', () => {
  accountingServicesService.assertFormReadyForPublish({
    questions: [{ id: 'q1', label: 'Tem imóveis?', type: 'yes_no', options: [] }],
  });
});

test('assertFormReadyForPublish: rejeita single_choice sem nenhuma opção', () => {
  assert.throws(
    () =>
      accountingServicesService.assertFormReadyForPublish({
        questions: [{ id: 'q1', label: 'Estado civil', type: 'single_choice', options: [] }],
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Estado civil/);
      return true;
    },
  );
});

test('assertFormReadyForPublish: rejeita multiple_choice sem opções', () => {
  assert.throws(
    () =>
      accountingServicesService.assertFormReadyForPublish({
        questions: [{ id: 'q1', label: 'Rendimentos', type: 'multiple_choice', options: [] }],
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('assertFormReadyForPublish: single_choice com pelo menos 1 opção passa', () => {
  accountingServicesService.assertFormReadyForPublish({
    questions: [{ id: 'q1', label: 'Estado civil', type: 'single_choice', options: [{ id: 'a', label: 'Solteiro' }] }],
  });
});

test('create: publicar com pergunta de escolha sem opções é rejeitado antes de gravar', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'createRow', async () => {
    throw new Error('não devia chegar a gravar — validação de publicação devia ter bloqueado antes');
  });

  await assert.rejects(
    () =>
      accountingServicesService.create({
        firmId: 'firm-x',
        payload: {
          name: 'IRS 2027',
          durationMinutes: 60,
          slug: 'irs-2027',
          isPubliclyListed: true,
          intakeForm: { questions: [{ label: 'Estado civil', type: 'single_choice', options: [] }] },
        },
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('update: publicar um serviço já existente com intake_form inalterado, mas com pergunta sem opções, é rejeitado', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({
    id: 'service-1',
    slug: 'consultoria',
    intakeForm: { questions: [{ id: 'q1', label: 'Área', type: 'single_choice', options: [] }] },
  }));
  mock.method(accountingServicesRepository, 'updateRow', async () => {
    throw new Error('não devia chegar a gravar — validação de publicação devia ter bloqueado antes');
  });

  await assert.rejects(
    () =>
      accountingServicesService.update({
        firmId: 'firm-x',
        id: 'service-1',
        payload: { isPubliclyListed: true },
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Área/);
      return true;
    },
  );
});

test('resolveRequiredDocuments: sem intake_form, devolve só a base do serviço', () => {
  const service = { documentRequirements: [{ tag: 'cc', title: 'Cartão de Cidadão' }] };
  const result = accountingServicesService.resolveRequiredDocuments(service, {});
  assert.deepEqual(result, [{ tag: 'cc', title: 'Cartão de Cidadão', instructions: null, timing: 'immediate' }]);
});

test('resolveRequiredDocuments: opção escolhida activa tags condicionais', () => {
  const service = {
    documentRequirements: [{ tag: 'cc', title: 'Cartão de Cidadão' }],
    intakeForm: {
      questions: [
        {
          id: 'imoveis',
          type: 'yes_no',
          options: [
            { id: 'sim', documentTags: ['caderneta_predial'] },
            { id: 'nao', documentTags: [] },
          ],
        },
      ],
    },
  };
  const result = accountingServicesService.resolveRequiredDocuments(service, { imoveis: 'sim' });
  const tags = result.map((d) => d.tag).sort();
  assert.deepEqual(tags, ['caderneta_predial', 'cc']);
});

test('resolveRequiredDocuments: opção não escolhida não activa a sua tag', () => {
  const service = {
    documentRequirements: [],
    intakeForm: {
      questions: [
        {
          id: 'imoveis',
          type: 'yes_no',
          options: [
            { id: 'sim', documentTags: ['caderneta_predial'] },
            { id: 'nao', documentTags: [] },
          ],
        },
      ],
    },
  };
  const result = accountingServicesService.resolveRequiredDocuments(service, { imoveis: 'nao' });
  assert.deepEqual(result, []);
});

test('resolveRequiredDocuments: tag repetida entre base e condicional não duplica, base vence título', () => {
  const service = {
    documentRequirements: [{ tag: 'caderneta_predial', title: 'Caderneta predial (oficial)' }],
    intakeForm: {
      questions: [
        {
          id: 'imoveis',
          type: 'yes_no',
          options: [{ id: 'sim', documentTags: ['caderneta_predial'] }],
        },
      ],
    },
  };
  const result = accountingServicesService.resolveRequiredDocuments(service, { imoveis: 'sim' });
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Caderneta predial (oficial)');
});

test('resolveRequiredDocuments: multiple_choice com várias respostas activa várias tags', () => {
  const service = {
    documentRequirements: [],
    intakeForm: {
      questions: [
        {
          id: 'rendimentos',
          type: 'multiple_choice',
          options: [
            { id: 'predial', documentTags: ['caderneta_predial'] },
            { id: 'trabalho', documentTags: ['recibos_vencimento'] },
          ],
        },
      ],
    },
  };
  const result = accountingServicesService.resolveRequiredDocuments(service, { rendimentos: ['predial', 'trabalho'] });
  const tags = result.map((d) => d.tag).sort();
  assert.deepEqual(tags, ['caderneta_predial', 'recibos_vencimento']);
});

test('normalizeDocumentRequirements (via create): timing "manual" é preservado; omitido ou inválido cai para "immediate"', async () => {
  resetMocks();
  let created = null;
  mock.method(accountingServicesRepository, 'createRow', async (args) => {
    created = args;
    return { id: 'svc-1', ...args };
  });

  await accountingServicesService.create({
    firmId: 'firm-x',
    payload: {
      name: 'IRS',
      durationMinutes: 60,
      documentRequirements: [
        { tag: 'a', title: 'A', timing: 'manual' },
        { tag: 'b', title: 'B' },
        { tag: 'c', title: 'C', timing: 'algo-invalido' },
      ],
    },
  });

  assert.equal(created.documentRequirements.find((d) => d.tag === 'a').timing, 'manual');
  assert.equal(created.documentRequirements.find((d) => d.tag === 'b').timing, 'immediate');
  assert.equal(created.documentRequirements.find((d) => d.tag === 'c').timing, 'immediate');
});

test('resolveRequiredDocuments: propaga timing "manual" definido em documentRequirements', () => {
  const service = {
    documentRequirements: [{ tag: 'certidao_casamento', title: 'Certidão de casamento', timing: 'manual' }],
    intakeForm: {
      questions: [
        {
          id: 'casado',
          type: 'yes_no',
          options: [{ id: 'sim', documentTags: ['certidao_casamento'] }, { id: 'nao', documentTags: [] }],
        },
      ],
    },
  };
  const result = accountingServicesService.resolveRequiredDocuments(service, { casado: 'sim' });
  assert.equal(result.length, 1);
  assert.equal(result[0].timing, 'manual');
});

test('splitDocumentsByTiming: separa immediate de manual; documento sem timing definido conta como immediate', () => {
  const result = accountingServicesService.splitDocumentsByTiming([
    { tag: 'a', title: 'A', timing: 'immediate' },
    { tag: 'b', title: 'B', timing: 'manual' },
    { tag: 'c', title: 'C' },
  ]);
  assert.deepEqual(result.immediate.map((d) => d.tag), ['a', 'c']);
  assert.deepEqual(result.manual.map((d) => d.tag), ['b']);
});

test('seedCatalog: propaga documentRequirements/intakeForm do template quando presentes', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'listCatalogKeys', async () => new Set());
  const created = [];
  mock.method(accountingServicesRepository, 'createRow', async (args) => {
    created.push(args);
    return { id: `svc-${created.length}`, ...args };
  });
  mock.method(accountingServicesRepository, 'listByFirm', async () => created);

  await accountingServicesService.seedCatalog({ firmId: 'firm-x' });

  const withForm = created.find((c) => c.catalogKey === 'entrega-irs-orcamento');
  assert.ok(withForm, 'entrada entrega-irs-orcamento devia ter sido criada');
  assert.equal(withForm.slug, undefined);
  assert.deepEqual(
    withForm.documentRequirements.map((d) => d.tag),
    ['cartao_cidadao'],
  );
  assert.equal(withForm.intakeForm.questions.length, 2);
  assert.ok(withForm.intakeForm.questions[0].id, 'pergunta propagada deve ganhar um id estável ao ser semeada');

  const withoutForm = created.find((c) => c.catalogKey === 'iuc');
  assert.ok(withoutForm, 'entrada sem intakeForm/documentRequirements continua a ser criada normalmente');
  assert.deepEqual(withoutForm.documentRequirements, []);
  assert.equal(withoutForm.intakeForm, null);
});

test('seedCatalog: não recria entradas já activadas pelo escritório (catalogKey já existente)', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'listCatalogKeys', async () => new Set(['entrega-irs-orcamento']));
  const created = [];
  mock.method(accountingServicesRepository, 'createRow', async (args) => {
    created.push(args);
    return { id: `svc-${created.length}`, ...args };
  });
  mock.method(accountingServicesRepository, 'listByFirm', async () => created);

  await accountingServicesService.seedCatalog({ firmId: 'firm-x' });

  assert.ok(!created.some((c) => c.catalogKey === 'entrega-irs-orcamento'));
});

test('seedCatalog: regressão — reexecutar depois do escritório editar o serviço não altera nada já configurado', async () => {
  resetMocks();

  // 1) primeira execução: cria a partir do catálogo
  mock.method(accountingServicesRepository, 'listCatalogKeys', async () => new Set());
  const createCalls = [];
  mock.method(accountingServicesRepository, 'createRow', async (args) => {
    createCalls.push(args);
    return { id: 'svc-1', ...args };
  });
  mock.method(accountingServicesRepository, 'listByFirm', async () => []);
  await accountingServicesService.seedCatalog({ firmId: 'firm-x' });
  assert.equal(createCalls.filter((c) => c.catalogKey === 'entrega-irs-orcamento').length, 1);

  // 2) simula o escritório a editar tudo manualmente depois (fora do seedCatalog)
  const firmEditedRow = {
    id: 'svc-1',
    catalogKey: 'entrega-irs-orcamento',
    name: 'IRS Premium (nome alterado pela contabilista)',
    description: 'Descrição totalmente reescrita',
    priceCents: 999999,
    durationMinutes: 15,
    requiresBooking: false,
    slug: 'irs-premium-2026',
    isPubliclyListed: true,
    documentRequirements: [{ tag: 'outro_doc', title: 'Documento que a contabilista adicionou' }],
    intakeForm: { questions: [{ id: 'q_manual', label: 'Pergunta que a contabilista criou', type: 'text', required: true }] },
  };

  // 3) reexecuta seedCatalog — simula que o escritório já tem TODO o catálogo semeado
  //    (senão as outras 20 entradas, não relacionadas, tentariam ser criadas normalmente
  //    e mascarariam o que este teste quer provar). accountingServicesRepository.createRow
  //    fica mockado para rebentar se for chamado — prova mais forte do que só contar chamadas.
  const { CONSULTING_SERVICES_CATALOG } = require('../../data/consulting-services-catalog');
  mock.method(
    accountingServicesRepository,
    'listCatalogKeys',
    async () => new Set(CONSULTING_SERVICES_CATALOG.map((e) => e.catalogKey)),
  );
  mock.method(accountingServicesRepository, 'createRow', async () => {
    throw new Error('seedCatalog não devia tentar recriar uma entrada já existente');
  });
  mock.method(accountingServicesRepository, 'listByFirm', async () => [firmEditedRow]);

  await accountingServicesService.seedCatalog({ firmId: 'firm-x' });

  // 4) confirma que as alterações manuais permanecem exactamente como estavam
  assert.deepEqual(firmEditedRow, {
    id: 'svc-1',
    catalogKey: 'entrega-irs-orcamento',
    name: 'IRS Premium (nome alterado pela contabilista)',
    description: 'Descrição totalmente reescrita',
    priceCents: 999999,
    durationMinutes: 15,
    requiresBooking: false,
    slug: 'irs-premium-2026',
    isPubliclyListed: true,
    documentRequirements: [{ tag: 'outro_doc', title: 'Documento que a contabilista adicionou' }],
    intakeForm: { questions: [{ id: 'q_manual', label: 'Pergunta que a contabilista criou', type: 'text', required: true }] },
  });
});

test('remove: serviço inexistente devolve 404, nunca chega a chamar deleteRow', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => null);
  mock.method(accountingServicesRepository, 'deleteRow', async () => {
    throw new Error('não devia tentar apagar um serviço que não foi encontrado');
  });

  await assert.rejects(
    () => accountingServicesService.remove({ firmId: 'firm-x', id: 'service-1' }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('remove: caminho feliz — apaga e devolve ok', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({ id: 'service-1', name: 'IRS' }));
  let deletedArgs = null;
  mock.method(accountingServicesRepository, 'deleteRow', async (id, firmId) => {
    deletedArgs = { id, firmId };
  });

  const result = await accountingServicesService.remove({ firmId: 'firm-x', id: 'service-1' });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(deletedArgs, { id: 'service-1', firmId: 'firm-x' });
});

test('remove: serviço com solicitações associadas (FK RESTRICT) devolve erro claro em vez de propagar o erro do Postgres', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({ id: 'service-1', name: 'IRS' }));
  mock.method(accountingServicesRepository, 'deleteRow', async () => {
    const err = new Error('update or delete on table "accounting_services" violates foreign key constraint');
    err.code = '23503';
    throw err;
  });

  await assert.rejects(
    () => accountingServicesService.remove({ firmId: 'firm-x', id: 'service-1' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Desactive/);
      return true;
    },
  );
});

test('activateFromCatalog: cria só as chaves seleccionadas, activas — não recria as outras 20 entradas do catálogo', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'listCatalogKeys', async () => new Set());
  const created = [];
  mock.method(accountingServicesRepository, 'createRow', async (args) => {
    created.push(args);
    return { id: `svc-${created.length}`, ...args };
  });

  const { items, activated } = await accountingServicesService.activateFromCatalog({
    firmId: 'firm-x',
    catalogKeys: ['simulacao-irs'],
  });

  assert.equal(activated, 1);
  assert.equal(items.length, 1);
  assert.equal(created.length, 1, 'só devia criar a entrada seleccionada, nenhuma outra do catálogo');
  assert.equal(created[0].catalogKey, 'simulacao-irs');
  assert.equal(created[0].isActive, true);
});

test('activateFromCatalog: catalogKey já apagado deliberadamente pelo escritório é recriado ao ser escolhido de novo (não reaparece sozinho)', async () => {
  resetMocks();
  // O escritório apagou tudo — listCatalogKeys devolve vazio, tal como listByFirm devolveria [].
  mock.method(accountingServicesRepository, 'listCatalogKeys', async () => new Set());
  const created = [];
  mock.method(accountingServicesRepository, 'createRow', async (args) => {
    created.push(args);
    return { id: `svc-${created.length}`, ...args };
  });

  const { activated } = await accountingServicesService.activateFromCatalog({
    firmId: 'firm-x',
    catalogKeys: ['iuc'],
  });

  assert.equal(activated, 1);
  assert.equal(created.length, 1);
  assert.equal(created[0].catalogKey, 'iuc');
});

test('activateFromCatalog: catalogKey já existente (activo ou inactivo) não é duplicado', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'listCatalogKeys', async () => new Set(['simulacao-irs']));
  mock.method(accountingServicesRepository, 'createRow', async () => {
    throw new Error('não devia tentar criar uma entrada já existente');
  });

  const { items, activated } = await accountingServicesService.activateFromCatalog({
    firmId: 'firm-x',
    catalogKeys: ['simulacao-irs'],
  });

  assert.equal(activated, 0);
  assert.deepEqual(items, []);
});

test('activateFromCatalog: rejeita sem catalogKeys seleccionadas', async () => {
  resetMocks();
  await assert.rejects(
    () => accountingServicesService.activateFromCatalog({ firmId: 'firm-x', catalogKeys: [] }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('normalizePublicGroup: vazio vira null; texto é cortado', () => {
  assert.equal(accountingServicesService.normalizePublicGroup(undefined), undefined);
  assert.equal(accountingServicesService.normalizePublicGroup(null), null);
  assert.equal(accountingServicesService.normalizePublicGroup('  '), null);
  assert.equal(accountingServicesService.normalizePublicGroup(' Consultoria Fiscal '), 'Consultoria Fiscal');
  assert.equal(accountingServicesService.normalizePublicGroup('x'.repeat(90)).length, 80);
});

test('normalizeSortOrder: rejeita valores inválidos', () => {
  assert.equal(accountingServicesService.normalizeSortOrder(undefined), undefined);
  assert.equal(accountingServicesService.normalizeSortOrder(20), 20);
  assert.throws(
    () => accountingServicesService.normalizeSortOrder(-1),
    (err) => err.statusCode === 400,
  );
});

test('normalizeIntakeStartMode: default é formulário primeiro', () => {
  assert.equal(accountingServicesService.normalizeIntakeStartMode(undefined), undefined);
  assert.equal(accountingServicesService.normalizeIntakeStartMode('form'), 'form');
  assert.equal(accountingServicesService.normalizeIntakeStartMode('calendar'), 'calendar');
  assert.equal(accountingServicesService.normalizeIntakeStartMode('outro'), 'form');
});
