import { differenceInDays, format, formatDistance, getYear } from 'date-fns';

export function getDisplayDate(date) {
  const now = new Date();
  if (differenceInDays(now, date) <= 30) {
    return formatDistance(date, now, { addSuffix: true })
  } else if (getYear(now) == getYear(date)) {
    return format(date, 'd MMMM');
  } else {
    return format(date, 'd MMMM yyyy');
  }
}

export function getDisplayDateFromString(date) {
  if (date) {
    return getDisplayDate(new Date(date));
  }
  return undefined;
}
