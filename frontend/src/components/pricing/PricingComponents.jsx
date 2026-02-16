/**
 * =============================================================================
 * REUSABLE PRICING COMPONENTS LIBRARY
 * =============================================================================
 * 
 * A complete, customizable pricing UI system with:
 * - PricingCard: Individual tier card
 * - PricingToggle: Monthly/Annual billing switch
 * - PricingGrid: Responsive grid layout
 * - PricingComparison: Feature comparison table
 * - PricingFAQ: Accordion FAQ section
 * 
 * Usage:
 *   import { PricingSection, PricingCard, PricingToggle } from './PricingComponents';
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  X,
  ArrowRight,
  Users,
  HardDrive,
  Mail,
  ChevronDown,
  ChevronUp,
  Shield,
  Lock,
  Globe,
  Star,
  Zap
} from 'lucide-react';

// =============================================================================
// THEME & CONFIGURATION
// =============================================================================

export const PRICING_THEMES = {
  dark: {
    background: 'bg-[#0a1628]',
    cardBg: 'bg-[#0f1d32]',
    cardBorder: 'border-white/10',
    cardBorderPopular: 'border-purple-500',
    text: 'text-white',
    textMuted: 'text-gray-400',
    textSubtle: 'text-gray-500',
    accent: 'purple',
    checkColor: 'text-green-400',
    crossColor: 'text-gray-600',
  },
  light: {
    background: 'bg-gray-50',
    cardBg: 'bg-white',
    cardBorder: 'border-gray-200',
    cardBorderPopular: 'border-purple-500',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    textSubtle: 'text-gray-400',
    accent: 'purple',
    checkColor: 'text-green-500',
    crossColor: 'text-gray-300',
  }
};

export const DEFAULT_PRICING_CONFIG = {
  currency: '$',
  annualDiscount: 20, // percentage
  trialDays: 14,
  showTrustBadges: true,
  animateCards: true,
};

// =============================================================================
// BILLING TOGGLE COMPONENT
// =============================================================================

export const PricingToggle = ({ 
  value = 'monthly', 
  onChange, 
  discount = 20,
  theme = 'dark',
  className = ''
}) => {
  const isAnnual = value === 'annual';
  const colors = PRICING_THEMES[theme];
  
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <span className={`text-sm font-medium transition-colors ${
        !isAnnual ? colors.text : colors.textSubtle
      }`}>
        Monthly
      </span>
      
      <button
        onClick={() => onChange(isAnnual ? 'monthly' : 'annual')}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          isAnnual ? 'bg-green-500' : 'bg-gray-600'
        }`}
        role="switch"
        aria-checked={isAnnual}
        aria-label="Toggle billing cycle"
        data-testid="pricing-billing-toggle"
      >
        <motion.span
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
          animate={{ x: isAnnual ? 32 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      
      <span className={`text-sm font-medium transition-colors ${
        isAnnual ? colors.text : colors.textSubtle
      }`}>
        Annual
      </span>
      
      <AnimatePresence>
        {isAnnual && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/30"
          >
            Save {discount}%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// PRICING CARD COMPONENT
// =============================================================================

export const PricingCard = ({
  tier,
  billingCycle = 'monthly',
  theme = 'dark',
  onSelect,
  currency = '$',
  className = '',
  animate = true,
  index = 0,
}) => {
  const colors = PRICING_THEMES[theme];
  const isPopular = tier.popular;
  
  // Calculate display price
  const monthlyPrice = tier.monthlyPrice || 0;
  const annualPrice = tier.annualPrice || 0;
  const displayPrice = billingCycle === 'monthly' 
    ? monthlyPrice 
    : Math.round(annualPrice / 12);
  
  const cardContent = (
    <div
      className={`
        relative ${colors.cardBg} rounded-2xl p-6 border flex flex-col h-full
        ${isPopular 
          ? `${colors.cardBorderPopular} ring-2 ring-purple-500/20` 
          : `${colors.cardBorder} hover:border-white/20`
        }
        transition-all duration-300
        ${className}
      `}
      data-testid={`pricing-card-${tier.id || tier.name.toLowerCase()}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className={`
            px-3 py-1 text-xs font-semibold text-white rounded-full
            bg-gradient-to-r ${tier.gradient || 'from-purple-500 to-fuchsia-500'}
            shadow-lg
          `}>
            {tier.badge || 'Most Popular'}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className={`text-xl font-bold ${colors.text}`}>{tier.name}</h3>
        {tier.description && (
          <p className={`text-sm mt-1 ${colors.textSubtle}`}>{tier.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${colors.text}`}>
            {displayPrice === 0 ? 'Free' : `${currency}${displayPrice}`}
          </span>
          {displayPrice > 0 && (
            <span className={colors.textSubtle}>/mo</span>
          )}
        </div>
        
        {billingCycle === 'annual' && annualPrice > 0 && (
          <p className="text-green-400 text-sm mt-1">
            {currency}{annualPrice}/year billed annually
          </p>
        )}
        
        {displayPrice === 0 && (
          <p className={`text-sm mt-1 ${colors.textSubtle}`}>Forever free</p>
        )}
      </div>

      {/* Key Metrics */}
      {(tier.users || tier.storage || tier.emails) && (
        <div className={`
          grid grid-cols-3 gap-2 mb-6 p-3 rounded-xl
          ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}
        `}>
          {tier.users && (
            <div className="text-center">
              <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className={`text-xs font-medium ${colors.text}`}>{tier.users}</p>
            </div>
          )}
          {tier.storage && (
            <div className={`text-center ${tier.users ? 'border-x border-white/10' : ''}`}>
              <HardDrive className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <p className={`text-xs font-medium ${colors.text}`}>{tier.storage}</p>
            </div>
          )}
          {tier.emails && (
            <div className="text-center">
              <Mail className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <p className={`text-xs font-medium ${colors.text}`}>
                {typeof tier.emails === 'number' ? tier.emails.toLocaleString() : tier.emails}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Features List */}
      <ul className="space-y-2.5 mb-6 flex-grow">
        {tier.features?.map((feature, idx) => (
          <li key={idx} className={`flex items-start gap-2 ${colors.textMuted}`}>
            <CheckCircle className={`w-4 h-4 ${colors.checkColor} flex-shrink-0 mt-0.5`} />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
        {tier.limitations?.map((limitation, idx) => (
          <li key={`lim-${idx}`} className={`flex items-start gap-2 ${colors.textSubtle}`}>
            <X className={`w-4 h-4 ${colors.crossColor} flex-shrink-0 mt-0.5`} />
            <span className="text-sm">{limitation}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={() => onSelect?.(tier)}
        className={`
          w-full py-3 px-4 rounded-lg font-medium text-sm
          flex items-center justify-center gap-2
          transition-all duration-200
          ${isPopular 
            ? `bg-gradient-to-r ${tier.gradient || 'from-purple-500 to-fuchsia-500'} text-white hover:opacity-90` 
            : tier.ctaStyle === 'outline'
              ? `border ${colors.cardBorder} ${colors.text} hover:bg-white/5`
              : `${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} ${colors.text}`
          }
        `}
        data-testid={`pricing-cta-${tier.id || tier.name.toLowerCase()}`}
      >
        {tier.cta || 'Get Started'}
        {!tier.cta?.includes('Contact') && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        className={isPopular ? 'scale-105 z-10' : ''}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

// =============================================================================
// PRICING GRID COMPONENT
// =============================================================================

export const PricingGrid = ({
  tiers,
  billingCycle = 'monthly',
  theme = 'dark',
  onSelectTier,
  columns = 4,
  className = '',
}) => {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-6 ${gridCols[columns] || gridCols[4]} ${className}`}>
      {tiers.map((tier, idx) => (
        <PricingCard
          key={tier.id || idx}
          tier={tier}
          billingCycle={billingCycle}
          theme={theme}
          onSelect={onSelectTier}
          index={idx}
        />
      ))}
    </div>
  );
};

// =============================================================================
// FEATURE COMPARISON TABLE
// =============================================================================

export const PricingComparison = ({
  tiers,
  categories,
  theme = 'dark',
  collapsible = true,
  initialExpanded = 3,
  className = '',
}) => {
  const [showAll, setShowAll] = useState(!collapsible);
  const colors = PRICING_THEMES[theme];
  
  const displayCategories = showAll ? categories : categories.slice(0, initialExpanded);

  const renderValue = (value) => {
    if (value === true) return <CheckCircle className={`w-5 h-5 ${colors.checkColor}`} />;
    if (value === false) return <X className={`w-5 h-5 ${colors.crossColor}`} />;
    return <span className={`text-sm ${colors.textMuted}`}>{value}</span>;
  };

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${colors.cardBorder}`}>
              <th className={`text-left py-4 px-4 ${colors.textMuted} font-medium`}>Feature</th>
              {tiers.map(tier => (
                <th key={tier.id || tier.name} className="text-center py-4 px-4">
                  <span className={`font-semibold ${
                    tier.popular ? 'text-purple-400' : colors.text
                  }`}>
                    {tier.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayCategories.map((category, catIdx) => (
              <React.Fragment key={catIdx}>
                <tr className={theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}>
                  <td 
                    colSpan={tiers.length + 1} 
                    className={`py-3 px-4 ${colors.text} font-semibold text-sm`}
                  >
                    {category.name}
                  </td>
                </tr>
                {category.features.map((feature, featIdx) => (
                  <tr 
                    key={featIdx} 
                    className={`border-b ${colors.cardBorder} hover:${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}
                  >
                    <td className={`py-3 px-4 ${colors.textMuted} text-sm`}>{feature.name}</td>
                    {tiers.map(tier => (
                      <td key={tier.id || tier.name} className="py-3 px-4 text-center">
                        {renderValue(feature[tier.id || tier.name.toLowerCase()])}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {collapsible && categories.length > initialExpanded && (
        <div className="text-center mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              border ${colors.cardBorder} ${colors.textMuted}
              hover:${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}
              transition-colors
            `}
          >
            {showAll ? (
              <>Show Less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Show All Features <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// FAQ ACCORDION
// =============================================================================

export const PricingFAQ = ({
  items,
  theme = 'dark',
  className = '',
}) => {
  const [expanded, setExpanded] = useState(null);
  const colors = PRICING_THEMES[theme];

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`${colors.cardBg} rounded-xl border ${colors.cardBorder} overflow-hidden`}
        >
          <button
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            className={`w-full px-6 py-4 flex items-center justify-between text-left ${colors.text}`}
            data-testid={`faq-${idx}`}
          >
            <span className="font-medium pr-4">{item.question}</span>
            {expanded === idx ? (
              <ChevronUp className={`w-5 h-5 ${colors.textMuted} flex-shrink-0`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${colors.textMuted} flex-shrink-0`} />
            )}
          </button>
          
          <AnimatePresence>
            {expanded === idx && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className={`px-6 pb-4 text-sm ${colors.textMuted}`}>
                  {item.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

// =============================================================================
// TRUST BADGES
// =============================================================================

export const TrustBadges = ({ theme = 'dark', className = '' }) => {
  const colors = PRICING_THEMES[theme];
  
  const badges = [
    { icon: Shield, label: 'SSL Secured', color: 'text-green-400' },
    { icon: Lock, label: 'SOC 2 Compliant', color: 'text-blue-400' },
    { icon: Globe, label: 'GDPR Ready', color: 'text-purple-400' },
    { icon: Star, label: '99.9% Uptime', color: 'text-yellow-400' },
  ];

  return (
    <div className={`flex flex-wrap items-center justify-center gap-6 ${colors.textSubtle} text-sm ${className}`}>
      {badges.map((badge, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <badge.icon className={`w-4 h-4 ${badge.color}`} />
          <span>{badge.label}</span>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// COMPLETE PRICING SECTION
// =============================================================================

export const PricingSection = ({
  tiers,
  categories = [],
  faqItems = [],
  theme = 'dark',
  onSelectTier,
  title = 'Choose Your Plan',
  subtitle = 'Start free, scale as you grow.',
  showComparison = true,
  showFAQ = true,
  showTrustBadges = true,
  className = '',
}) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const colors = PRICING_THEMES[theme];

  return (
    <section className={`py-20 px-4 sm:px-6 lg:px-8 ${colors.background} ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className={`text-3xl sm:text-4xl font-bold ${colors.text} mb-4`}>
            {title}
          </h2>
          <p className={`${colors.textMuted} max-w-2xl mx-auto mb-8`}>
            {subtitle}
          </p>
          
          <PricingToggle
            value={billingCycle}
            onChange={setBillingCycle}
            theme={theme}
          />
        </div>

        {/* Pricing Cards */}
        <PricingGrid
          tiers={tiers}
          billingCycle={billingCycle}
          theme={theme}
          onSelectTier={onSelectTier}
          className="mb-16"
        />

        {/* Trust Badges */}
        {showTrustBadges && (
          <TrustBadges theme={theme} className="mb-16" />
        )}

        {/* Feature Comparison */}
        {showComparison && categories.length > 0 && (
          <div className="mb-16">
            <h3 className={`text-2xl font-bold ${colors.text} text-center mb-8`}>
              Compare All Features
            </h3>
            <PricingComparison
              tiers={tiers}
              categories={categories}
              theme={theme}
            />
          </div>
        )}

        {/* FAQ */}
        {showFAQ && faqItems.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <h3 className={`text-2xl font-bold ${colors.text} text-center mb-8`}>
              Frequently Asked Questions
            </h3>
            <PricingFAQ items={faqItems} theme={theme} />
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingSection;
