const test = require('node:test');
const assert = require('node:assert/strict');

require('../../test/ensure-test-env');
const { todayInTimezone, addDaysToDateString } = require('../../utils/firm-timezone');

function stubModule(relativePath, exports) {
  const resolved = require.resolve(relativePath, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return resolved;
}

// Regressão do ROADMAP item 0.3: runAutomationsForFirm calculava "hoje" e o "daqui a N dias"
// (janela do gatilho OBLIGATION_DUE) sempre em UTC, ignorando o fuso do escritório. Este
// teste prova que, com uma única regra OBLIGATION_DUE/CREATE_TASK habilitada, a consulta de
// obrigações filtra por due_date = hoje-no-fuso-do-escritório + daysBefore, calculado a
// partir de Atlantic/Azores (UTC-1 fixo, sem DST) em vez de UTC.
test('runAutomationsForFirm calcula a janela de OBLIGATION_DUE a partir do fuso do escritório', async () => {
  const seenEq = [];

  function fakeFrom(table) {
    if (table === 'firms') {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return { data: { settings: { booking: { timezone: 'Atlantic/Azores' } } }, error: null };
        },
      };
    }
    if (table === 'task_automation_rules') {
      const builder = {
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        order() {
          return Promise.resolve({
            data: [
              {
                id: 'rule-1',
                firm_id: 'firm-azores',
                name: 'Preparar obrigações',
                trigger_type: 'OBLIGATION_DUE',
                action_type: 'CREATE_TASK',
                config: { daysBefore: 3 },
                enabled: true,
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          });
        },
      };
      return builder;
    }
    if (table === 'obligations') {
      const builder = {
        select() {
          return builder;
        },
        eq(field, value) {
          seenEq.push([field, value]);
          return builder;
        },
        in() {
          return Promise.resolve({ data: [], error: null });
        },
      };
      return builder;
    }
    throw new Error(`tabela inesperada no teste: ${table}`);
  }

  stubModule('../../db/supabase/client', {
    getSupabaseAdmin: () => ({ from: fakeFrom }),
    isSupabaseConfigured: () => true,
  });
  delete require.cache[require.resolve('./automation.repository')];
  delete require.cache[require.resolve('./automation.service')];
  const { runAutomationsForFirm } = require('./automation.service');

  const summary = await runAutomationsForFirm('firm-azores');

  assert.equal(summary.rulesRun, 1);
  const expectedToday = todayInTimezone('Atlantic/Azores');
  const expectedTarget = addDaysToDateString(expectedToday, 3);
  const dueDateFilter = seenEq.find(([field]) => field === 'due_date');
  assert.ok(dueDateFilter, 'deveria ter filtrado obligations por due_date');
  assert.equal(dueDateFilter[1], expectedTarget);
});
