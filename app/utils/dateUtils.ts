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
  dateInput: string | Date,
  withTime = false,
  applyTimeZone = true
): string => {
  let date: Date;

  // Convert to Date object if input is a string
  if (typeof dateInput === 'string') {
    date = new Date(dateInput.includes('T') ? dateInput : `${dateInput}Z`);
  } else {
    date = dateInput; // Already a Date object
  }

  // Apply time zone if needed
  if (applyTimeZone) {
    date = toZonedTime(date, TIME_ZONE);
  }

  // Format the date
  return format(date, withTime ? 'dd-MM-yyyy HH:mm' : 'dd-MM-yyyy');
};
