export function addMonthsToDateShamsi(date: string, duration: number): string {
  let [year, month, day] = date.split('/').map(Number);

  for (let i = 0; i < duration; i++) {
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
  }

  const newMonth = month.toString().padStart(2, '0');
  const newDay = day.toString().padStart(2, '0');

  return `${year}-${newMonth}-${newDay}`;
}
