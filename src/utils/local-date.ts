/**
 * Local calendar-date helpers.
 * Prefer these over toISOString().slice(0, 10), which uses UTC and can
 * return the wrong calendar day near midnight in many timezones.
 */

export function getTodayLocalDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentYearMonth(date = new Date()): string {
  return getTodayLocalDate(date).slice(0, 7);
}

export function isValidLocalDateString(value: string): boolean {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const [yearText, monthText, dayText] = trimmed.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const localDate = new Date(year, month - 1, day);

  return (
    localDate.getFullYear() === year &&
    localDate.getMonth() === month - 1 &&
    localDate.getDate() === day
  );
}

export function isExpenseInYearMonth(expenseDate: string, yearMonth: string): boolean {
  return expenseDate.startsWith(yearMonth);
}
