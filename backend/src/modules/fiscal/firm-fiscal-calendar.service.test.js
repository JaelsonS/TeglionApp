/**
 * Unit tests — expansão de recorrência e datas civis (sem DB).
 */
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
  expandRecurrenceDates,
  expandEventsForRange,
  addDays,
  toYmd,
} = require('./firm-fiscal-calendar.service')

describe('firm-fiscal-calendar recurrence', () => {
  it('expands monthly day-20 within a year', () => {
    const dates = expandRecurrenceDates(
      '2026-01-20',
      { frequency: 'MONTHLY', intervalCount: 1, dayOfMonth: 20 },
      '2026-01-01',
      '2026-06-30',
    )
    assert.deepEqual(dates, [
      '2026-01-20',
      '2026-02-20',
      '2026-03-20',
      '2026-04-20',
      '2026-05-20',
      '2026-06-20',
    ])
  })

  it('expands quarterly', () => {
    const dates = expandRecurrenceDates(
      '2026-01-31',
      { frequency: 'QUARTERLY', intervalCount: 1, dayOfMonth: 31 },
      '2026-01-01',
      '2026-12-31',
    )
    assert.equal(dates.length, 4)
    assert.equal(dates[0], '2026-01-31')
    assert.equal(dates[1], '2026-04-30') // April has 30 days
  })

  it('respects untilDate', () => {
    const dates = expandRecurrenceDates(
      '2026-01-10',
      { frequency: 'MONTHLY', intervalCount: 1, dayOfMonth: 10, untilDate: '2026-03-01' },
      '2026-01-01',
      '2026-12-31',
    )
    assert.deepEqual(dates, ['2026-01-10', '2026-02-10'])
  })

  it('applies cancelled exception', () => {
    const events = [
      {
        id: 'e1',
        title: 'IVA',
        startDate: '2026-01-20',
        recurrence: { frequency: 'MONTHLY', intervalCount: 1, dayOfMonth: 20 },
        exceptions: [{ originalDate: '2026-03-20', isCancelled: true }],
      },
    ]
    const occ = expandEventsForRange(events, '2026-01-01', '2026-04-30')
    const dates = occ.map((o) => o.startDate)
    assert.ok(dates.includes('2026-01-20'))
    assert.ok(dates.includes('2026-02-20'))
    assert.ok(!dates.includes('2026-03-20'))
    assert.ok(dates.includes('2026-04-20'))
  })

  it('applies override date exception', () => {
    const events = [
      {
        id: 'e1',
        title: 'IVA',
        startDate: '2026-01-20',
        recurrence: { frequency: 'MONTHLY', intervalCount: 1, dayOfMonth: 20 },
        exceptions: [
          {
            originalDate: '2026-02-20',
            isCancelled: false,
            overrideDate: '2026-02-21',
            overrideTitle: 'IVA adiado',
          },
        ],
      },
    ]
    const occ = expandEventsForRange(events, '2026-02-01', '2026-02-28')
    assert.equal(occ.length, 1)
    assert.equal(occ[0].startDate, '2026-02-21')
    assert.equal(occ[0].title, 'IVA adiado')
    assert.equal(occ[0].isException, true)
  })

  it('addDays and toYmd stay civil', () => {
    assert.equal(addDays('2026-01-31', 1), '2026-02-01')
    assert.equal(toYmd(2026, 8, 12), '2026-08-12')
  })
})
