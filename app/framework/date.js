import { differenceInDays, formatDistance } from "date-fns";

const shortDateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const longDateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function getDisplayDate(date) {
  const now = new Date();
  if (differenceInDays(now, date) <= 30) {
    return formatDistance(date, now, { addSuffix: true });
  } else if (now.getFullYear() == date.getFullYear()) {
    return shortDateTimeFormat.format(date);
  } else {
    return longDateTimeFormat.format(date);
  }
}

export function getDisplayDateFromString(date) {
  if (date) {
    return getDisplayDate(new Date(date));
  }
  return undefined;
}

// The server renders this, as relative dates would be frozen at build time.
export function getAbsoluteDisplayDateFromString(date) {
  if (date) {
    return longDateTimeFormat.format(new Date(date));
  }
  return undefined;
}
