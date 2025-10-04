import type { SupportedLanguage } from '@elek-io/core';

/**
 * Generates a translatable default object with all supported languages set to null
 * e.g. { en: null, de: null, fr: null }
 *
 * @note This is used to initialize forms with the default value `null` for every supported language
 */
export function translatableDefaultNull(
  supportedLanguages: SupportedLanguage[]
): {
  [x: string]: null;
} {
  return supportedLanguages
    .map((language) => {
      return { [language]: null };
    })
    .reduce((prev, curr) => {
      return {
        ...prev,
        ...curr,
      };
    });
}

/**
 * Generates a translatable default object with all supported languages set to an empty array
 * e.g. { en: [], de: [], fr: [] }
 *
 * @note This is used to initialize forms with the default value `[]` for every supported language
 */
export function translatableDefaultEmptyArray(
  supportedLanguages: SupportedLanguage[]
): {
  [x: string]: unknown[];
} {
  return supportedLanguages
    .map((language) => {
      return { [language]: [] };
    })
    .reduce((prev, curr) => {
      return {
        ...prev,
        ...curr,
      };
    });
}
