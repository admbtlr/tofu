import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  parseISO,
} from 'date-fns';

export const formatDate = (dateString: string): string => {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return 'Today';
  }

  if (isTomorrow(date)) {
    return 'Tomorrow';
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  return format(date, 'MMM d, yyyy');
};

export const formatTime = (dateString: string): string => {
  const date = parseISO(dateString);
  return format(date, 'H:mm');
};

export const formatDateTime = (dateString: string): string => {
  const date = parseISO(dateString);
  return format(date, 'MMM d, yyyy h:mm a');
};

export const isOverdue = (dateString: string): boolean => {
  const date = parseISO(dateString);
  const now = new Date();

  // Check if the date has a specific time set (not midnight)
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;

  if (hasTime) {
    // If time is set, check if the exact datetime has passed
    return date.getTime() < now.getTime();
  } else {
    // If no time is set, use the original logic (past day but not today)
    return isPast(date) && !isToday(date);
  }
};

export const createDateString = (date: Date): string => {
  return date.toISOString();
};
