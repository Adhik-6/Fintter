/**
 * Date Formatting Utilities
 */
import { format, isToday, isYesterday, parseISO } from 'date-fns';

export function formatTransactionDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEE, dd MMM yyyy');
  } catch (e) {
    return dateStr;
  }
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'hh:mm a');
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM');
}

export function formatMonthYear(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM yyyy');
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getTodayISO(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
}

export function getTodayDateOnly(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
