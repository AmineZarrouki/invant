export type CurrencyCode = 'MAD' | 'EUR' | 'USD' | 'TND';

export const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; label: string; position: 'after' | 'before' }> = {
  MAD: { symbol: 'DH', label: 'Dirham Marocain (MAD / DH)', position: 'after' },
  EUR: { symbol: '€', label: 'Euro (€)', position: 'after' },
  USD: { symbol: '$', label: 'Dollar US ($)', position: 'before' },
  TND: { symbol: 'DT', label: 'Dinar Tunisien (DT)', position: 'after' },
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'MAD'): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.MAD;
  const formatted = (amount || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (config.position === 'before') {
    return `${config.symbol}${formatted}`;
  }
  return `${formatted} ${config.symbol}`;
}
