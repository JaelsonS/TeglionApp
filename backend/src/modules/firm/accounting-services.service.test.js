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

test('normalizeIntakeForm: gera id a partir do label quando não indicado', () => {
  const form = accountingServicesService.normalizeIntakeForm({
    questions: [{ label: 'Tem rendimentos prediais?', type: 'yes_no' }],
  });
  assert.equal(form.questions.length, 1);
  assert.equal(form.questions[0].id, 'tem_rendimentos_prediais');
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
