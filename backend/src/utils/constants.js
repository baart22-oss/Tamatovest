const INVESTMENT_PACKAGES = [
  { name: 'Seedling', amount: 80 },
  { name: 'Sprout', amount: 150 },
  { name: 'Sapling', amount: 300 },
  { name: 'Budding', amount: 500 },
  { name: 'Blossoming', amount: 800 },
  { name: 'Growing', amount: 1200 },
  { name: 'Thriving', amount: 2000 },
  { name: 'Flourishing', amount: 3000 },
  { name: 'Abundant', amount: 4500 },
  { name: 'Prosperous', amount: 6000 },
  { name: 'Wealthy', amount: 8000 },
  { name: 'Elite', amount: 10000 },
  { name: 'Premium', amount: 12000 },
];

const DAILY_RATE = 0.05; // 5%
const DURATION_DAYS = 60;
const REFERRAL_RATES = { 1: 0.12, 2: 0.05, 3: 0.01 };
const MIN_WITHDRAWAL = 100;

const calculateInvestmentReturns = (amount) => {
  const dailyProfit = parseFloat((amount * DAILY_RATE).toFixed(2));
  const totalProfit = parseFloat((dailyProfit * DURATION_DAYS).toFixed(2));
  return { dailyProfit, totalProfit };
};

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TMV';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = {
  INVESTMENT_PACKAGES,
  DAILY_RATE,
  DURATION_DAYS,
  REFERRAL_RATES,
  MIN_WITHDRAWAL,
  calculateInvestmentReturns,
  generateReferralCode,
};
