export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

type FormatCurrencyOptions = {
  currency?: CurrencyCode;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

export function formatCurrency(
  amount: string | number | null | undefined,
  options: FormatCurrencyOptions = {},
) {
  const currency = options.currency ?? DEFAULT_CURRENCY;
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat(options.locale ?? CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  }).format(Number.isFinite(value) ? value : 0);
}
