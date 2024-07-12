import { SupportedLanguage } from '@elek-io/core';
import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow, fromUnixTime } from 'date-fns';
import {
  bg,
  cs,
  da,
  de,
  el,
  enUS,
  es,
  et,
  fi,
  fr,
  hu,
  it,
  ja,
  lt,
  lv,
  nl,
  pl,
  pt,
  ro,
  ru,
  sk,
  sl,
  sv,
  zhCN,
} from 'date-fns/locale';
import type {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  SVGProps,
} from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Icon = ForwardRefExoticComponent<
  PropsWithoutRef<SVGProps<SVGSVGElement>> & {
    title?: string;
    titleId?: string;
  } & RefAttributes<SVGSVGElement>
>;

/**
 * Map between the imported locales and our supported locales
 *
 * We use english (US) and Chinese (Simplified)
 */
const importedLocales = {
  bg,
  cs,
  da,
  de,
  el,
  en: enUS,
  es,
  et,
  fi,
  fr,
  hu,
  it,
  ja,
  lt,
  lv,
  nl,
  pl,
  pt,
  ro,
  ru,
  sk,
  sl,
  sv,
  zh: zhCN,
};

/**
 * Formats given Unix timestamp to be human readable
 * and be in the user selected locale
 *
 * @param timestamp Unix timestamp to format
 * @param language The language to format into - uses the users language if empty
 */
export function formatTimestamp(
  timestamp: number | undefined,
  language: SupportedLanguage
) {
  if (!timestamp) {
    // e.g. in case of a file not being updated yet, show a dash
    return {
      relative: '-',
      absolute: '-',
    };
  }
  return {
    relative: formatDistanceToNow(fromUnixTime(timestamp), {
      addSuffix: true,
      locale: importedLocales[language],
    }),
    absolute: format(fromUnixTime(timestamp), 'Pp', {
      locale: importedLocales[language],
    }),
  };
}

/**
 * Formats given number of bytes into a human readable format
 *
 * @param bytes Number of bytes
 */
export function formatBytes(bytes: number) {
  if (bytes == 0) return '0 Bytes';
  const k = 1024,
    decimals = 2,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
  );
}

/**
 * Often used by tailwind components to join multiple strings of classes
 *
 * @param classes Array of classes to join
 * @returns Joined class string
 */
export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Dynamic class names for field widths
 * @see https://tailwindcss.com/docs/content-configuration#dynamic-class-names
 */
export function fieldWidth(width: string) {
  switch (width) {
    case '3':
      return 'sm:col-span-3';
    case '4':
      return 'sm:col-span-4';
    case '6':
      return 'sm:col-span-6';
    case '12':
      return 'sm:col-span-12';
    default:
      break;
  }
}
