import { currencyCode, locale } from "../../config/school";

export const money = (value) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
