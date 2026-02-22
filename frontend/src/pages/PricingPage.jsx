/**
 * DataViz Studio - Dedicated Pricing Page
 * Full pricing comparison with feature matrix and FAQ
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  X,
  ArrowRight,
  Users,
  Database,
  Mail,
  HardDrive,
  Shield,
  Lock,
  Globe,
  Star,
  Zap,
  Clock,
  Headphones,
  BarChart3,
  FileText,
  Brain,
  Palette,
  ChevronDown,
  ChevronUp,
  Building2,
  CreditCard
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

// Custom DataViz Logo
const DataVizLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      fill="none"
      strokeDasharray="47 16"
      strokeDashoffset="12"
    />
    <path 
      d="M12 2v10l7 7" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * PRICING MODEL - 80% Profit Margin
 * 
 * Cost Breakdown per tier:
 * - Free: ~$2/mo (acquisition cost, absorbed)
 * - Starter: ~$5.80/mo → Price $29 → Margin 80%
 * - Pro: ~$15.80/mo → Price $79 → Margin 80%
 * - Enterprise: ~$49.80/mo → Price $249 → Margin 80%
 */
const PRICING_TIERS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'For individuals exploring data visualization',
    monthlyPrice: 0,
    annualPrice: 0,
    users: 1,
    organizations: 1,
    storage: '100 MB',
    emailsPerMonth: 0,
    color: 'gray',
    gradient: 'from-gray-500 to-gray-600',
    popular: false,
    cta: 'Get Started Free',
    ctaVariant: 'outline'
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For small teams getting started',
    monthlyPrice: 29,
    annualPrice: 278,
    users: 3,
    organizations: 3,
    storage: '5 GB',
    emailsPerMonth: 500,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    popular: false,
    cta: 'Start Free Trial',
    ctaVariant: 'default'
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For teams needing advanced features',
    monthlyPrice: 79,
    annualPrice: 758,
    users: 10,
    organizations: 10,
    storage: '50 GB',
    emailsPerMonth: 5000,
    color: 'purple',
    gradient: 'from-purple-500 to-fuchsia-500',
    popular: true,
    cta: 'Start Free Trial',
    ctaVariant: 'default'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For organizations at scale',
    monthlyPrice: 249,
    annualPrice: 2388,
    users: 'Unlimited',
    organizations: 'Unlimited',
    storage: '500 GB',
    emailsPerMonth: 50000,
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    popular: false,
    cta: 'Contact Sales',
    ctaVariant: 'default'
  }
];

// Feature comparison matrix
const FEATURE_CATEGORIES = [
  {
    name: 'Core Features',
    features: [
      { name: 'Dashboards', free: '3', starter: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Datasets', free: '5', starter: '25', pro: '100', enterprise: 'Unlimited' },
      { name: 'Max rows per dataset', free: '1,000', starter: '50,000', pro: '500,000', enterprise: 'Unlimited' },
      { name: 'Chart types', free: '3 basic', starter: 'All 9', pro: 'All 9 + custom', enterprise: 'All + custom' },
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
    name: 'Collaboration & Sharing',
    features: [
      { name: 'Organizations', free: '1', starter: '3', pro: '10', enterprise: 'Unlimited' },
      { name: 'Team members', free: '1', starter: '3', pro: '10', enterprise: 'Unlimited' },
      { name: 'Public dashboard links', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Password-protected sharing', free: false, starter: false, pro: true, enterprise: true },
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
      { name: 'AI Executive Summary', free: false, starter: false, pro: '50/mo', enterprise: 'Unlimited' },
      { name: 'AI Insights Assistant', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Smart fallback (template engine)', free: true, starter: true, pro: true, enterprise: true },
      { name: 'Anomaly detection', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Predictive analytics', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Natural language queries', free: false, starter: false, pro: false, enterprise: true },
    ]
  },
  {
    name: 'Branding & Export',
    features: [
      { name: 'Export formats', free: 'CSV', starter: 'CSV, PDF, PNG', pro: 'All formats', enterprise: 'All + custom' },
      { name: 'Remove DataViz branding', free: false, starter: true, pro: true, enterprise: true },
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

// FAQ items
const FAQ_ITEMS = [
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
  }
];

export function PricingPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const getPrice = (tier) => {
    if (tier.monthlyPrice === 0) return 'Free';
    return billingCycle === 'monthly' 
      ? `$${tier.monthlyPrice}` 
      : `$${Math.round(tier.annualPrice / 12)}`;
  };

  const renderFeatureValue = (value) => {
    if (value === true) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (value === false) return <X className="w-5 h-5 text-gray-600" />;
    return <span className="text-gray-300 text-sm">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1628]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 via-fuchsia-500 to-purple-600 flex items-center justify-center">
                <DataVizLogo className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-white">DataViz Studio</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-400 hover:text-white text-sm">Home</Link>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0"
              >
                Start Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4">
            Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Start free, scale as you grow. All plans include a 14-day trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>
              Monthly billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-green-500' : 'bg-gray-600'
              }`}
              data-testid="billing-toggle"
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                  billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${billingCycle === 'annual' ? 'text-white' : 'text-gray-500'}`}>
              Annual billing
            </span>
            {billingCycle === 'annual' && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Save 20%
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_TIERS.map((tier, idx) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative bg-[#0f1d32] rounded-2xl p-6 border flex flex-col ${
                  tier.popular 
                    ? 'border-purple-500 ring-2 ring-purple-500/20 scale-105 z-10' 
                    : 'border-white/10'
                }`}
                data-testid={`pricing-card-${tier.id}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={`bg-gradient-to-r ${tier.gradient} text-white border-0 shadow-lg`}>
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{tier.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{getPrice(tier)}</span>
                    {tier.monthlyPrice > 0 && <span className="text-gray-500">/mo</span>}
                  </div>
                  {billingCycle === 'annual' && tier.annualPrice > 0 && (
                    <p className="text-green-400 text-sm mt-1">
                      ${tier.annualPrice}/year billed annually
                    </p>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="space-y-3 mb-6 p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span className="text-gray-300 text-sm">
                      {typeof tier.organizations === 'number' ? `${tier.organizations} organizations` : tier.organizations}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300 text-sm">
                      {typeof tier.users === 'number' ? `${tier.users} users` : tier.users}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300 text-sm">{tier.storage} storage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">
                      {tier.emailsPerMonth === 0 ? 'No emails' : `${tier.emailsPerMonth.toLocaleString()} emails/mo`}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  <Button
                    className={`w-full ${
                      tier.popular 
                        ? `bg-gradient-to-r ${tier.gradient} hover:opacity-90` 
                        : tier.id === 'enterprise'
                        ? `bg-gradient-to-r ${tier.gradient} hover:opacity-90`
                        : tier.ctaVariant === 'outline'
                        ? 'bg-transparent border border-gray-600 hover:bg-white/5'
                        : 'bg-white/10 hover:bg-white/20'
                    } text-white`}
                    onClick={() => {
                      if (tier.id === 'enterprise') {
                        window.location.href = 'mailto:sales@dataviz.studio?subject=Enterprise Inquiry';
                      } else {
                        navigate('/register');
                      }
                    }}
                    data-testid={`pricing-cta-${tier.id}`}
                  >
                    {tier.cta}
                    {tier.id !== 'enterprise' && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Highlight */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">
              <Brain className="w-3 h-3 mr-1 inline" />
              AI-Powered Features
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              Intelligent Analytics at Your Fingertips
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Leverage the power of AI to generate executive summaries, uncover insights, 
              and make data-driven decisions faster.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* AI Executive Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-emerald-500/20"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Executive Summary</h3>
              <p className="text-gray-400 text-sm mb-4">
                Generate professional executive summaries from your reports with one click. 
                Includes key insights and actionable recommendations.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Pro & Enterprise</span>
              </div>
            </motion.div>
            
            {/* AI Insights Assistant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 rounded-2xl p-6 border border-purple-500/20"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Insights Assistant</h3>
              <p className="text-gray-400 text-sm mb-4">
                Ask questions about your data in plain English. Get intelligent answers, 
                chart suggestions, and trend analysis.
              </p>
              <div className="flex items-center gap-2 text-purple-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Pro & Enterprise</span>
              </div>
            </motion.div>
            
            {/* Smart Fallback */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Fallback System</h3>
              <p className="text-gray-400 text-sm mb-4">
                Never lose functionality. If AI services are temporarily unavailable, 
                our template engine ensures you always get quality results.
              </p>
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>All Plans</span>
              </div>
            </motion.div>
          </div>
          
          {/* AI Availability Note */}
          <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-gray-300 font-medium">Future-Proof AI Infrastructure</p>
              <p className="text-gray-500">
                Our AI features are built with provider redundancy. If one AI service changes or becomes unavailable, 
                your workflows continue seamlessly with automatic fallback to alternative providers or our template engine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0f1d32]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Compare All Features</h2>
            <p className="text-gray-400">See exactly what's included in each plan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
                  {PRICING_TIERS.map(tier => (
                    <th key={tier.id} className="text-center py-4 px-4">
                      <span className={`text-${tier.color}-400 font-semibold`}>{tier.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_CATEGORIES.slice(0, showAllFeatures ? undefined : 3).map((category, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-white/5">
                      <td colSpan={5} className="py-3 px-4 text-white font-semibold text-sm">
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feature, featIdx) => (
                      <tr key={featIdx} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-gray-400 text-sm">{feature.name}</td>
                        <td className="py-3 px-4 text-center">{renderFeatureValue(feature.free)}</td>
                        <td className="py-3 px-4 text-center">{renderFeatureValue(feature.starter)}</td>
                        <td className="py-3 px-4 text-center">{renderFeatureValue(feature.pro)}</td>
                        <td className="py-3 px-4 text-center">{renderFeatureValue(feature.enterprise)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-white/5"
              onClick={() => setShowAllFeatures(!showAllFeatures)}
            >
              {showAllFeatures ? (
                <>Show Less <ChevronUp className="w-4 h-4 ml-2" /></>
              ) : (
                <>Show All Features <ChevronDown className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400">Everything you need to know about our pricing</p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0f1d32] rounded-xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  data-testid={`faq-${idx}`}
                >
                  <span className="text-white font-medium">{item.question}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-400 text-sm">{item.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0f1d32]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of teams creating beautiful dashboards with DataViz Studio
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"
              onClick={() => navigate('/register')}
            >
              Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-white/5"
              onClick={() => window.location.href = 'mailto:sales@dataviz.studio'}
            >
              <Building2 className="w-5 h-5 mr-2" />
              Contact Sales
            </Button>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-yellow-400" />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2026 DataViz Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default PricingPage;
