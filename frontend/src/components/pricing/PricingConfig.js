/**
 * =============================================================================
 * PRICING CONFIGURATION
 * =============================================================================
 * 
 * Customize this file for your specific product pricing.
 * All pricing calculations use 80% profit margin formula:
 *   Selling Price = Cost / (1 - 0.80) = Cost / 0.20
 * 
 * Example:
 *   If your cost is $10/month, price should be $10 / 0.20 = $50/month
 */

// =============================================================================
// PRICING TIERS
// =============================================================================

export const PRICING_TIERS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for individuals getting started',
    monthlyPrice: 0,
    annualPrice: 0,
    
    // Key metrics (customize labels)
    users: '1 user',
    storage: '100 MB',
    emails: '0',
    
    // Feature list (checkmarks)
    features: [
      '3 dashboards',
      '5 datasets',
      'Basic charts',
      'CSV export',
      'Community support',
    ],
    
    // Limitations (crossed out)
    limitations: [
      'No team collaboration',
      'No email reports',
    ],
    
    // CTA button
    cta: 'Get Started Free',
    ctaStyle: 'outline', // 'outline' | 'solid' | 'gradient'
    
    // Visual
    popular: false,
    gradient: 'from-gray-500 to-gray-600',
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Great for small teams and growing businesses',
    monthlyPrice: 29,
    annualPrice: 278, // ~20% discount
    
    users: '3 users',
    storage: '5 GB',
    emails: '500',
    
    features: [
      '10 dashboards',
      '25 datasets',
      'All chart types',
      'PDF & PNG export',
      'Email scheduling',
      'Email support (48h)',
      '30-day data retention',
    ],
    
    limitations: [
      'Limited API access',
    ],
    
    cta: 'Start Free Trial',
    ctaStyle: 'solid',
    popular: false,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For teams needing advanced analytics',
    monthlyPrice: 79,
    annualPrice: 758,
    
    users: '10 users',
    storage: '50 GB',
    emails: '5,000',
    
    features: [
      'Unlimited dashboards',
      '100 datasets',
      'Database connections',
      'AI-powered insights',
      'Report Builder',
      'Scheduled reports',
      'Priority support (24h)',
      '1-year data retention',
      'Custom branding',
      'API access (10K/mo)',
    ],
    
    limitations: [],
    
    cta: 'Start Free Trial',
    ctaStyle: 'gradient',
    popular: true,
    badge: 'Most Popular',
    gradient: 'from-purple-500 to-fuchsia-500',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations at scale',
    monthlyPrice: 249,
    annualPrice: 2388,
    
    users: 'Unlimited',
    storage: '500 GB',
    emails: '50,000',
    
    features: [
      'Everything in Pro',
      'Unlimited datasets',
      'SSO (SAML, OAuth)',
      'Advanced security',
      'Audit logs',
      'Dedicated account manager',
      'SLA guarantee (99.9%)',
      'Custom integrations',
      'On-premise option',
      'Unlimited API access',
    ],
    
    limitations: [],
    
    cta: 'Contact Sales',
    ctaStyle: 'gradient',
    popular: false,
    gradient: 'from-emerald-500 to-emerald-600',
  },
];

// =============================================================================
// FEATURE COMPARISON CATEGORIES
// =============================================================================

export const FEATURE_CATEGORIES = [
  {
    name: 'Core Features',
    features: [
      { name: 'Dashboards', free: '3', starter: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Datasets', free: '5', starter: '25', pro: '100', enterprise: 'Unlimited' },
      { name: 'Max rows per dataset', free: '1,000', starter: '50,000', pro: '500,000', enterprise: 'Unlimited' },
      { name: 'Chart types', free: '3 basic', starter: 'All 9', pro: 'All + custom', enterprise: 'All + custom' },
      { name: 'Report Builder', free: false, starter: 'Basic', pro: 'Full', enterprise: 'Full + templates' },
    ]
  },
  {
    name: 'Data & Storage',
    features: [
      { name: 'Storage', free: '100 MB', starter: '5 GB', pro: '50 GB', enterprise: '500 GB' },
      { name: 'File upload size', free: '5 MB', starter: '25 MB', pro: '100 MB', enterprise: '500 MB' },
      { name: 'Database connections', free: false, starter: false, pro: '5', enterprise: 'Unlimited' },
      { name: 'Data retention', free: '7 days', starter: '30 days', pro: '1 year', enterprise: 'Custom' },
      { name: 'Data refresh rate', free: 'Manual', starter: 'Daily', pro: 'Hourly', enterprise: 'Real-time' },
    ]
  },
  {
    name: 'Collaboration',
    features: [
      { name: 'Team members', free: '1', starter: '3', pro: '10', enterprise: 'Unlimited' },
      { name: 'Shared dashboards', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Role-based access', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Audit logs', free: false, starter: false, pro: false, enterprise: true },
      { name: 'SSO (SAML/OAuth)', free: false, starter: false, pro: false, enterprise: true },
    ]
  },
  {
    name: 'Email & Automation',
    features: [
      { name: 'Email reports/month', free: '0', starter: '500', pro: '5,000', enterprise: '50,000' },
      { name: 'Scheduled reports', free: false, starter: 'Weekly', pro: 'Daily', enterprise: 'Custom' },
      { name: 'Alert notifications', free: false, starter: false, pro: true, enterprise: true },
      { name: 'API access', free: false, starter: 'Limited', pro: '10K calls/mo', enterprise: 'Unlimited' },
      { name: 'Webhooks', free: false, starter: false, pro: true, enterprise: true },
    ]
  },
  {
    name: 'AI & Analytics',
    features: [
      { name: 'AI Insights', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Anomaly detection', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Predictive analytics', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Natural language queries', free: false, starter: false, pro: false, enterprise: true },
    ]
  },
  {
    name: 'Branding & Export',
    features: [
      { name: 'Export formats', free: 'CSV', starter: 'CSV, PDF, PNG', pro: 'All formats', enterprise: 'All + custom' },
      { name: 'Remove branding', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Custom branding', free: false, starter: false, pro: true, enterprise: true },
      { name: 'White-label option', free: false, starter: false, pro: false, enterprise: true },
    ]
  },
  {
    name: 'Support',
    features: [
      { name: 'Support channel', free: 'Community', starter: 'Email', pro: 'Priority email', enterprise: 'Phone + Dedicated' },
      { name: 'Response time', free: 'Best effort', starter: '48 hours', pro: '24 hours', enterprise: '4 hours' },
      { name: 'Onboarding', free: 'Self-serve', starter: 'Guides', pro: 'Webinar', enterprise: 'Personal' },
      { name: 'SLA guarantee', free: false, starter: false, pro: '99.5%', enterprise: '99.9%' },
    ]
  }
];

// =============================================================================
// FAQ ITEMS
// =============================================================================

export const FAQ_ITEMS = [
  {
    question: 'Can I try before I buy?',
    answer: 'Yes! All paid plans include a 14-day free trial with full access to all features. No credit card required to start.'
  },
  {
    question: 'What happens when I exceed my limits?',
    answer: 'We\'ll notify you when you\'re approaching limits. You can upgrade anytime, or we\'ll help you optimize your usage. We never delete your data without notice.'
  },
  {
    question: 'Can I change plans later?',
    answer: 'Absolutely. Upgrade or downgrade anytime. When upgrading, you\'ll get immediate access to new features. When downgrading, changes apply at the next billing cycle.'
  },
  {
    question: 'Do you offer discounts for nonprofits or education?',
    answer: 'Yes! We offer 50% off for verified nonprofits and educational institutions. Contact our sales team to apply.'
  },
  {
    question: 'How secure is my data?',
    answer: 'Very secure. We use 256-bit SSL encryption, SOC 2 Type II compliance, and GDPR-compliant data handling. Enterprise plans include additional security features like SSO and audit logs.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, Amex), PayPal, and wire transfers for Enterprise plans. All payments are processed securely through Stripe.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. Your account will remain active until the end of your current billing period.'
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate price with 80% profit margin
 * @param {number} cost - Your actual cost
 * @returns {number} - Recommended selling price
 */
export const calculatePrice = (cost) => {
  const profitMargin = 0.80;
  return Math.round(cost / (1 - profitMargin));
};

/**
 * Calculate annual price with discount
 * @param {number} monthlyPrice - Monthly price
 * @param {number} discountPercent - Annual discount (default 20%)
 * @returns {number} - Annual price
 */
export const calculateAnnualPrice = (monthlyPrice, discountPercent = 20) => {
  const yearlyFull = monthlyPrice * 12;
  const discount = yearlyFull * (discountPercent / 100);
  return Math.round(yearlyFull - discount);
};

/**
 * Get display price based on billing cycle
 * @param {object} tier - Pricing tier object
 * @param {string} cycle - 'monthly' or 'annual'
 * @returns {number} - Display price
 */
export const getDisplayPrice = (tier, cycle) => {
  if (cycle === 'annual' && tier.annualPrice > 0) {
    return Math.round(tier.annualPrice / 12);
  }
  return tier.monthlyPrice;
};

export default {
  PRICING_TIERS,
  FEATURE_CATEGORIES,
  FAQ_ITEMS,
  calculatePrice,
  calculateAnnualPrice,
  getDisplayPrice,
};
