import { format, toZonedTime } from 'date-fns-tz';

const TIME_ZONE = 'America/Santiago';

/**
 * Formats a given date to either `dd-MM-yyyy` or `dd-MM-yyyy HH:mm`.
 *
 * @param dateInput - The input date, either a string or a Date object.
 * @param withTime - Whether to include the time in the formatted string (optional).
 * @param applyTimeZone - Whether to apply the specified time zone (optional).
 * @returns The formatted date string.
 */
export const formatDate = (
  dateInput?: string | Date,
  withTime = false,
  applyTimeZone = true
): string => {

  if (!dateInput) {
    return 'N/A';
  }

  if (!applyTimeZone && typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-');
    return `${day}-${month}-${year}`; // dd-MM-yyyy
  }

  let date: Date;

  if (typeof dateInput === 'string') {
    if (dateInput.endsWith('Z') && !applyTimeZone) {
      const localDateString = dateInput.slice(0, -1);
      date = new Date(localDateString.replace('T', ' ')); 
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  if (applyTimeZone) {
    date = toZonedTime(date, TIME_ZONE);
  }
  
  return format(date, withTime ? 'dd-MM-yyyy HH:mm' : 'dd-MM-yyyy');
};


/**
 * Returns the ISO week number of a given date.
 *
 * @param date - The input date.
 * @returns The ISO week number.
 */
export function getISOWeekNumber(date: Date): number {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};
