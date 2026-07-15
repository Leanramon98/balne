/**
 * Locale-aware display-names factory.
 *
 * Creates an API object with getter functions that resolve display labels
 * from the i18n messages for the given locale.
 *
 * In future slices (Slice 5), this factory can accept merged messages
 * including admin overrides instead of importing static JSON directly.
 */

import esMessages from '@/messages/es.json';
import ptMessages from '@/messages/pt.json';

const allMessages: Record<string, Record<string, string>> = {
  es: esMessages as unknown as Record<string, string>,
  pt: ptMessages as unknown as Record<string, string>,
};

function keyPath(...parts: string[]): string {
  return parts.join('.');
}

function readMessage(locale: string, key: string): string | undefined {
  const path = keyPath('display-names', key);
  const localeMsgs = allMessages[locale];
  if (localeMsgs?.[path]) return localeMsgs[path];
  // Fallback to default locale if key missing in target locale
  return allMessages.es?.[path];
}

export interface DisplayNamesAPI {
  getAxisLabel: (code: string) => string;
  getActionStatusLabel: (status: string) => string;
  getRoleLabel: (roleId: string | null | undefined) => string;
  getEvidenceTypeLabel: (type: string) => string;
  getGradientLabel: (level: number | string) => string;
  getAxisOptions: () => { value: string; label: string }[];
}

export function createDisplayNames(locale: string = 'es'): DisplayNamesAPI {
  const t = (key: string): string | undefined => readMessage(locale, key);

  return {
    getAxisLabel: (code: string) =>
      t(`axis.${code}`) ?? code.toUpperCase(),

    getActionStatusLabel: (status: string) =>
      t(`action-status.${status}`) || status,

    getRoleLabel: (roleId: string | null | undefined) =>
      roleId ? t(`role.${roleId}`) || roleId : '-',

    getEvidenceTypeLabel: (type: string) =>
      t(`evidence-type.${type}`) || type,

    getGradientLabel: (level: number | string) =>
      t(`gradient.${level}`) || `${level}%`,

    getAxisOptions: () => {
      const codes = ['gob', 'inn', 'tec', 'sost', 'acc'];
      return codes.map((code) => ({
        value: code,
        label: t(`axis.${code}`) ?? code.toUpperCase(),
      }));
    },
  };
}
