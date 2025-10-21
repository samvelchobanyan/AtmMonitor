const monthsHy = [
  'Հունվար',
  'Փետրվար',
  'Մարտ',
  'Ապրիլ',
  'Մայիս',
  'Հունիս',
  'Հուլիս',
  'Օգոստոս',
  'Սեպտեմբեր',
  'Հոկտեմբեր',
  'Նոյեմբեր',
  'Դեկտեմբեր',
];

export function formatDateOnly(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const monthName = monthsHy[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${monthName} ${year}`;
}

export function formatTimeOnly(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function formatDate(dateString) {
  const date = new Date(dateString); // parse ISO
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const monthName = monthsHy[date.getMonth()];
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${monthName} ${year} ${hours}:${minutes}`;
}

// for grids
export function formatCompactDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} / ${hours}:${minutes}`;
}
