import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  toDateString,
  addDays,
  computeInterval,
  scheduleReview,
  isDue,
  formatInterval,
  startingEase,
  isLeech,
} from './srs'
import { buildForecast, describeLoad } from './forecast'
import type { Flashcard } from '@/types'

/**
 * Tests for the review scheduler.
 *
 * This module decides when every card comes back, which is the product's core promise, and it
 * is pure and date-injectable — so there is no excuse for it to be untested. Two defects were
 * found by running it rather than reading it; both are pinned below so they cannot return.
 *
 * Run: npm test
 */

function card(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: 'card-1',
    userId: 'user-1',
    subjectId: 'biology',
    front: 'front',
    back: 'back',
    difficulty: 'medium',
    timesReviewed: 0,
    repetitions: 0,
    lapses: 0,
    ...overrides,
  } as Flashcard
}

describe('toDateString — local calendar day, never UTC', () => {
  test('returns the local day, not the UTC day', () => {
    // 2026-08-11 01:00 in a UTC+8 zone is still 2026-08-10 in UTC. A student reviewing at 1am
    // must see the 11th, or their due cards read as tomorrow's and the queue looks empty.
    const localOneAM = new Date(2026, 7, 11, 1, 0, 0)
    assert.equal(toDateString(localOneAM), '2026-08-11')
  })

  test('returns the local day late at night', () => {
    // The mirror case: 23:00 local west of UTC is already tomorrow in UTC.
    const localLateNight = new Date(2026, 7, 11, 23, 30, 0)
    assert.equal(toDateString(localLateNight), '2026-08-11')
  })

  test('pads single-digit months and days', () => {
    assert.equal(toDateString(new Date(2026, 0, 5, 12, 0, 0)), '2026-01-05')
  })

  test('agrees with itself across a whole day', () => {
    for (let hour = 0; hour < 24; hour++) {
      assert.equal(
        toDateString(new Date(2026, 7, 11, hour, 30, 0)),
        '2026-08-11',
        `hour ${hour} produced the wrong calendar day`,
      )
    }
  })
})

describe('addDays', () => {
  test('advances across a month boundary', () => {
    assert.equal(toDateString(addDays(new Date(2026, 7, 30, 9, 0, 0), 3)), '2026-09-02')
  })

  test('does not mutate its argument', () => {
    const original = new Date(2026, 7, 11, 9, 0, 0)
    addDays(original, 5)
    assert.equal(toDateString(original), '2026-08-11')
  })
})

describe('computeInterval', () => {
  test('first success comes back tomorrow', () => {
    assert.equal(computeInterval(1, 'medium'), 1)
  })

  test('second success comes back in three days', () => {
    assert.equal(computeInterval(2, 'medium'), 3)
  })

  test('grows geometrically with the ease of the tier', () => {
    assert.equal(computeInterval(3, 'medium'), 6)
    assert.equal(computeInterval(4, 'medium'), 12)
    assert.ok(computeInterval(3, 'easy') > computeInterval(3, 'medium'))
    assert.ok(computeInterval(3, 'hard') < computeInterval(3, 'medium'))
  })

  test('is capped at one year', () => {
    assert.equal(computeInterval(40, 'easy'), 365)
  })
})

describe('scheduleReview — a failure must not advance the schedule', () => {
  test('a failed review resets to one day and records a lapse', () => {
    const out = scheduleReview(card({ timesReviewed: 5, repetitions: 5, lapses: 0 }), false)
    assert.equal(out.intervalDays, 1)
    assert.equal(out.repetitions, 0, 'a failure must reset the consecutive-pass streak')
    assert.equal(out.lapses, 1)
    assert.equal(out.difficulty, 'hard', 'a failure steps the card one tier harder')
  })

  /**
   * THE REGRESSION THIS FILE EXISTS FOR.
   *
   * `repetitions` used to be read from `timesReviewed`, which counts failures too. A card the
   * student had failed four times and passed once was scheduled 10 days out — the cards they
   * knew least were pushed furthest away.
   */
  test('four failures then one pass schedules the card within two days, not ten', () => {
    let c = card()
    for (let i = 0; i < 4; i++) {
      const failed = scheduleReview(c, false)
      c = { ...c, ...failed }
    }

    assert.equal(c.repetitions, 0, 'four failures leave no successful repetitions')
    assert.equal(c.lapses, 4)

    const passed = scheduleReview(c, true)
    assert.equal(passed.repetitions, 1, 'one success means one repetition, not five')
    assert.ok(
      passed.intervalDays <= 2,
      `a card failed four times must come back within 2 days, got ${passed.intervalDays}`,
    )
  })

  test('consecutive passes grow the interval', () => {
    let c = card()
    const intervals: number[] = []
    for (let i = 0; i < 4; i++) {
      const out = scheduleReview(c, true)
      intervals.push(out.intervalDays)
      c = { ...c, ...out }
    }
    for (let i = 1; i < intervals.length; i++) {
      assert.ok(
        intervals[i] >= intervals[i - 1],
        `interval shrank between review ${i} and ${i + 1}: ${intervals.join(', ')}`,
      )
    }
  })

  test('promotion counts successes only, so failing never makes a card easier', () => {
    // Two failures then a pass previously hit `repetitions % 3 === 0` and promoted the card.
    let c = card({ difficulty: 'medium' })
    c = { ...c, ...scheduleReview(c, false) }
    c = { ...c, ...scheduleReview(c, false) }
    const out = scheduleReview(c, true)
    assert.notEqual(out.difficulty, 'easy', 'failures must never promote a card to an easier tier')
  })

  test('timesReviewed still counts every review, pass or fail', () => {
    const out = scheduleReview(card({ timesReviewed: 7 }), false)
    assert.equal(out.timesReviewed, 8)
  })

  test('nextReview is a local calendar day', () => {
    const at1am = new Date(2026, 7, 11, 1, 0, 0)
    const out = scheduleReview(card(), false, at1am)
    assert.equal(out.nextReview, '2026-08-12')
    assert.equal(out.lastReviewed, '2026-08-11')
  })
})

describe('isDue', () => {
  test('a never-reviewed card is always due', () => {
    assert.equal(isDue(card({ nextReview: undefined })), true)
  })

  test('a card scheduled for today is due, including early in the morning', () => {
    const at1am = new Date(2026, 7, 11, 1, 0, 0)
    assert.equal(isDue(card({ nextReview: '2026-08-11' }), at1am), true)
  })

  test('a card scheduled for tomorrow is not due', () => {
    const at11pm = new Date(2026, 7, 11, 23, 0, 0)
    assert.equal(isDue(card({ nextReview: '2026-08-12' }), at11pm), false)
  })

  test('an overdue card is due', () => {
    assert.equal(isDue(card({ nextReview: '2026-08-01' }), new Date(2026, 7, 11)), true)
  })
})

describe('formatInterval', () => {
  test('reads naturally across ranges', () => {
    assert.equal(formatInterval(1), 'tomorrow')
    assert.equal(formatInterval(3), 'in 3 days')
    assert.equal(formatInterval(14), 'in 2 weeks')
    assert.equal(formatInterval(7), 'in 1 week')
    assert.equal(formatInterval(60), 'in 2 months')
  })
})

describe('ease — the student\'s experience of a card, not the generator\'s guess', () => {
  test('a new card seeds its ease from the authored difficulty tier', () => {
    assert.equal(startingEase('easy'), 2.5)
    assert.equal(startingEase('medium'), 2.0)
    assert.equal(startingEase('hard'), 1.5)
  })

  test('failing lowers ease, passing raises it', () => {
    const base = card({ ease: 2.0 })
    assert.ok(scheduleReview(base, false).ease < 2.0)
    assert.ok(scheduleReview(base, true).ease > 2.0)
  })

  test('ease stays inside the SM-2 bounds however often a card is failed', () => {
    let c = card({ ease: 1.4 })
    for (let i = 0; i < 20; i++) c = { ...c, ...scheduleReview(c, false) }
    assert.ok((c.ease ?? 0) >= 1.3, `ease fell below the floor: ${c.ease}`)

    let easy = card({ ease: 2.7 })
    for (let i = 0; i < 20; i++) easy = { ...easy, ...scheduleReview(easy, true) }
    assert.ok((easy.ease ?? 0) <= 2.8, `ease rose above the ceiling: ${easy.ease}`)
  })

  test('two students diverge on the same authored card', () => {
    // The whole reason ease is separate from difficulty: identical cards, different people.
    let strong = card({ difficulty: 'medium' })
    let weak = card({ difficulty: 'medium' })
    for (let i = 0; i < 3; i++) {
      strong = { ...strong, ...scheduleReview(strong, true) }
      weak = { ...weak, ...scheduleReview(weak, false) }
    }
    assert.ok((strong.ease ?? 0) > (weak.ease ?? 0))
    assert.equal(strong.difficulty === 'medium' || strong.difficulty === 'easy', true)
  })

  test('a card failed five times is a leech', () => {
    assert.equal(isLeech({ lapses: 4 }), false)
    assert.equal(isLeech({ lapses: 5 }), true)
    assert.equal(isLeech({ lapses: undefined }), false)
  })
})

describe('buildForecast', () => {
  const at = new Date(2026, 7, 11, 9, 0, 0)

  test('overdue and never-reviewed cards collapse into today', () => {
    const cards = [
      card({ id: 'a', nextReview: '2026-08-01' }),
      card({ id: 'b', nextReview: undefined }),
      card({ id: 'c', nextReview: '2026-08-11' }),
    ]
    const f = buildForecast(cards, 14, at)
    assert.equal(f.dueToday, 3)
    assert.equal(f.days[0].isToday, true)
  })

  test('cards land on their own day', () => {
    const f = buildForecast([card({ nextReview: '2026-08-14' })], 14, at)
    assert.equal(f.days[3].date, '2026-08-14')
    assert.equal(f.days[3].count, 1)
    assert.equal(f.dueToday, 0)
  })

  test('cards beyond the window are not counted', () => {
    const f = buildForecast([card({ nextReview: '2027-01-01' })], 14, at)
    assert.equal(f.upcoming, 0)
  })

  test('describes an empty day without pretending there is work', () => {
    const f = buildForecast([card({ nextReview: '2026-08-13' })], 14, at)
    assert.match(describeLoad(f), /Nothing due today/)
  })
})
