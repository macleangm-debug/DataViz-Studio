/**
 * =============================================================================
 * PRICING COMPONENTS - USAGE EXAMPLES
 * =============================================================================
 * 
 * Copy these examples to quickly implement pricing in your app.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import components
import {
  PricingSection,
  PricingCard,
  PricingToggle,
  PricingGrid,
  PricingComparison,
  PricingFAQ,
  TrustBadges,
} from './PricingComponents';

// Import configuration
import {
  PRICING_TIERS,
  FEATURE_CATEGORIES,
  FAQ_ITEMS,
} from './PricingConfig';

// =============================================================================
// EXAMPLE 1: Full Pricing Page (Quickest Setup)
// =============================================================================

export const FullPricingPage = () => {
  const navigate = useNavigate();

  const handleSelectTier = (tier) => {
    if (tier.id === 'enterprise') {
      window.location.href = 'mailto:sales@yourcompany.com';
    } else {
      navigate('/register');
    }
  };

  return (
    <PricingSection
      tiers={PRICING_TIERS}
      categories={FEATURE_CATEGORIES}
      faqItems={FAQ_ITEMS}
      theme="dark"
      onSelectTier={handleSelectTier}
      title="Simple, Transparent Pricing"
      subtitle="Start free, scale as you grow. All plans include a 14-day trial."
      showComparison={true}
      showFAQ={true}
      showTrustBadges={true}
    />
  );
};

// =============================================================================
// EXAMPLE 2: Landing Page Pricing Section (Embedded)
// =============================================================================

export const LandingPagePricing = () => {
  const [billingCycle, setBillingCycle] = React.useState('monthly');
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 px-4 bg-[#0a1628]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded-full">
            Pricing
          </span>
          <h2 className="text-4xl font-bold text-white mt-4 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-gray-400 mb-8">
            Start free, upgrade when you need more
          </p>
          
          <PricingToggle
            value={billingCycle}
            onChange={setBillingCycle}
            theme="dark"
          />
        </div>

        {/* Cards */}
        <PricingGrid
          tiers={PRICING_TIERS}
          billingCycle={billingCycle}
          theme="dark"
          onSelectTier={(tier) => navigate('/register')}
        />

        {/* Trust badges */}
        <TrustBadges theme="dark" className="mt-12" />
      </div>
    </section>
  );
};

// =============================================================================
// EXAMPLE 3: Light Theme Pricing
// =============================================================================

export const LightThemePricing = () => {
  return (
    <PricingSection
      tiers={PRICING_TIERS}
      categories={FEATURE_CATEGORIES}
      faqItems={FAQ_ITEMS}
      theme="light"
      title="Pricing Plans"
      subtitle="Choose the plan that works for you"
    />
  );
};

// =============================================================================
// EXAMPLE 4: Minimal 3-Tier Pricing
// =============================================================================

export const MinimalPricing = () => {
  const simpleTiers = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'For individuals',
      monthlyPrice: 9,
      annualPrice: 86,
      features: ['5 projects', 'Basic support', '1GB storage'],
      cta: 'Get Started',
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For professionals',
      monthlyPrice: 29,
      annualPrice: 278,
      features: ['Unlimited projects', 'Priority support', '10GB storage', 'API access'],
      cta: 'Start Trial',
      popular: true,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      id: 'team',
      name: 'Team',
      description: 'For teams',
      monthlyPrice: 79,
      annualPrice: 758,
      features: ['Everything in Pro', '5 team members', 'Advanced analytics', 'Custom branding'],
      cta: 'Start Trial',
    },
  ];

  return (
    <PricingSection
      tiers={simpleTiers}
      theme="dark"
      showComparison={false}
      showFAQ={false}
      showTrustBadges={false}
    />
  );
};

// =============================================================================
// EXAMPLE 5: Individual Components
// =============================================================================

export const IndividualComponents = () => {
  const [billing, setBilling] = React.useState('monthly');

  const singleTier = {
    id: 'premium',
    name: 'Premium',
    description: 'Best for growing teams',
    monthlyPrice: 49,
    annualPrice: 470,
    users: '10 users',
    storage: '100 GB',
    emails: '10,000',
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
    ],
    popular: true,
    cta: 'Upgrade Now',
    gradient: 'from-purple-500 to-pink-500',
  };

  return (
    <div className="p-8 bg-gray-900 space-y-8">
      {/* Just the toggle */}
      <div>
        <h3 className="text-white mb-4">Billing Toggle:</h3>
        <PricingToggle value={billing} onChange={setBilling} />
      </div>

      {/* Single card */}
      <div>
        <h3 className="text-white mb-4">Single Card:</h3>
        <div className="max-w-sm">
          <PricingCard
            tier={singleTier}
            billingCycle={billing}
            theme="dark"
            onSelect={(tier) => console.log('Selected:', tier)}
          />
        </div>
      </div>

      {/* Just FAQ */}
      <div>
        <h3 className="text-white mb-4">FAQ Section:</h3>
        <div className="max-w-2xl">
          <PricingFAQ items={FAQ_ITEMS.slice(0, 3)} theme="dark" />
        </div>
      </div>

      {/* Trust badges */}
      <div>
        <h3 className="text-white mb-4">Trust Badges:</h3>
        <TrustBadges theme="dark" />
      </div>
    </div>
  );
};

// =============================================================================
// EXAMPLE 6: Custom Styled Pricing
// =============================================================================

export const CustomStyledPricing = () => {
  const [billing, setBilling] = React.useState('monthly');
  
  // Custom tier with different styling
  const customTiers = PRICING_TIERS.map((tier, idx) => ({
    ...tier,
    // Override gradients with custom colors
    gradient: [
      'from-gray-600 to-gray-700',
      'from-cyan-500 to-cyan-600',
      'from-orange-500 to-red-500',
      'from-violet-500 to-violet-600',
    ][idx],
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Pricing that scales with you
          </h1>
          <PricingToggle value={billing} onChange={setBilling} />
        </div>

        <PricingGrid
          tiers={customTiers}
          billingCycle={billing}
          theme="dark"
        />
      </div>
    </div>
  );
};

// =============================================================================
// EXPORT ALL EXAMPLES
// =============================================================================

export default {
  FullPricingPage,
  LandingPagePricing,
  LightThemePricing,
  MinimalPricing,
  IndividualComponents,
  CustomStyledPricing,
};
