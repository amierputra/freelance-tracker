// Calendar dates are Malaysian local dates; toISOString() would give the UTC date (a day behind before 8am)
const TZ = 'Asia/Kuala_Lumpur'

export function isoDate(d: Date = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: TZ })
}

export const todayISO = () => isoDate()
