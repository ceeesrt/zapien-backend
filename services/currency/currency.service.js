import axios from 'axios';

class CurrencyService {
  constructor() {
    this.cache = new Map();
    this.baseCurrency = 'CLP';
  }

  async normalizePrice(price, sourceCurrency) {
    if (sourceCurrency === this.baseCurrency) {
      return price;
    }

    const rate = await this.getExchangeRate(sourceCurrency, this.baseCurrency);
    return Math.round(price * rate * 100) / 100;
  }

  async getExchangeRate(from, to) {
    const cacheKey = `${from}_${to}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const rates = {
        'USD_CLP': 950,
        'EUR_CLP': 1050,
        'UYU_CLP': 25,
        'ARS_CLP': 10
      };

      const rate = rates[`${from}_${to}`] || 1;
      this.cache.set(cacheKey, rate);

      // Auto-clear cache after 1 hour
      setTimeout(() => this.cache.delete(cacheKey), 3600000);

      return rate;
    } catch (error) {
      console.error(`Error fetching exchange rate ${from} -> ${to}:`, error);
      return 1;
    }
  }
}

export default new CurrencyService();
