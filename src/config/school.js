export const currencyCode = "USD";
export const locale = "en-US";
export const currencySymbol = new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode })
  .formatToParts(0)
  .find((part) => part.type === "currency")?.value ?? "$";

export const classLabel = (year, section = "") => {
  if (typeof year === "string" && year.includes("–")) return `Years ${year}`;
  return `Year ${year}${section}`;
};
