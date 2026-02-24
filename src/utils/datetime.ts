export function dateOnlyKey(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const hh = String(value.getHours()).padStart(2, '0');
  const mm = String(value.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function combineDateAndTime(dateKey: string, time: string): string {
  return new Date(`${dateKey}T${time}:00`).toISOString();
}
