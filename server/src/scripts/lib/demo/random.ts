/** Deterministic PRNG (mulberry32) so the same --seed always produces the same data. */
export class Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Float in [0, 1). */
  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max], inclusive. */
  int(min: number, max: number) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(probability: number) {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.next() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll < 0) return value;
    }
    return entries[entries.length - 1][0];
  }

  /** Random amount between min and max, rounded to `step`. */
  money(min: number, max: number, step = 1) {
    return Math.round((min + this.next() * (max - min)) / step) * step;
  }

  digits(count: number) {
    let out = '';
    for (let i = 0; i < count; i++) out += String(this.int(0, 9));
    return out;
  }

  uuid() {
    const hex = Array.from({ length: 32 }, () => this.int(0, 15).toString(16));
    hex[12] = '4';
    hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
    const s = hex.join('');
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
  }
}

// ---------------------------------------------------------------------------
// Dates. A "day" is a Manila calendar date string (YYYY-MM-DD). Manila is
// UTC+8 all year (no DST), so conversions are a fixed offset.
// ---------------------------------------------------------------------------

const MANILA_OFFSET_HOURS = 8;
const DAY_MS = 86_400_000;

export function addDays(day: string, days: number) {
  const d = new Date(`${day}T00:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string) {
  return Math.round(
    (new Date(`${a}T00:00:00Z`).getTime() -
      new Date(`${b}T00:00:00Z`).getTime()) /
      DAY_MS,
  );
}

export function weekday(day: string) {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

/** Manila wall-clock time on `day` → epoch ms. */
export function manilaTime(day: string, hour: number, minute = 0, second = 0) {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d, hour - MANILA_OFFSET_HOURS, minute, second);
}

/** Epoch ms → Manila calendar date. */
export function manilaDay(ms: number) {
  return new Date(ms + MANILA_OFFSET_HOURS * 3_600_000)
    .toISOString()
    .slice(0, 10);
}

export function todayInManila() {
  return manilaDay(Date.now());
}
