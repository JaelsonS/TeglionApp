const test = require('node:test');
const assert = require('node:assert/strict');

const accountingServicesService = require('./accounting-services.service');

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

test('resolveRequiredDocuments: sem intake_form, devolve só a base do serviço', () => {
  const service = { documentRequirements: [{ tag: 'cc', title: 'Cartão de Cidadão' }] };
  const result = accountingServicesService.resolveRequiredDocuments(service, {});
  assert.deepEqual(result, [{ tag: 'cc', title: 'Cartão de Cidadão', instructions: null }]);
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
