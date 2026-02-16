/**
 * DataViz Studio Landing Page
 * A beautiful, modern landing page for the data visualization platform
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle,
  PieChart,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Play,
  Star,
  Globe,
  ChevronDown,
  LineChart,
  Database,
  Palette,
  Download,
  Sparkles,
  MousePointerClick,
  Building2,
  GraduationCap,
  Heart,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  Calendar,
  FileText,
  Lock,
  Layers,
  Upload,
  Table,
  LayoutDashboard,
  GitBranch,
  Brain,
  Share2,
  Wand2,
  Menu,
  X,
  CircleDot
} from 'lucide-react';

// Custom DataViz Studio Logo Component - Pie chart with segment
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
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const FEATURES = [
  { icon: LayoutDashboard, title: 'Dashboard Builder', description: '12+ widget types. Build stunning dashboards in minutes.', color: '#14b8a6' },
  { icon: BarChart3, title: '9 Chart Types', description: 'Bar, line, pie, scatter, radar, funnel and more.', color: '#3b82f6' },
  { icon: Upload, title: 'Easy Data Import', description: 'Upload CSV, Excel, JSON files up to 50MB.', color: '#8b5cf6' },
  { icon: Database, title: 'Database Connect', description: 'Connect to MongoDB, PostgreSQL, MySQL directly.', color: '#f59e0b' },
  { icon: Wand2, title: 'Data Transform', description: 'Clean, filter, and transform your data with ease.', color: '#ec4899' },
  { icon: FileText, title: 'Report Builder', description: 'Create infographic-style reports with PDF export.', color: '#06b6d4' },
  { icon: Brain, title: 'AI Insights', description: 'Get AI-powered analysis and recommendations.', color: '#10b981' },
  { icon: GitBranch, title: 'Chart Annotations', description: 'Add labels, reference lines, and highlights.', color: '#6366f1' }
];

const USE_CASES = [
  {
    title: 'Business Intelligence',
    icon: TrendingUp,
    description: 'Transform raw data into actionable insights with interactive dashboards and real-time analytics.',
    examples: ['Sales tracking', 'Revenue analysis', 'KPI monitoring']
  },
  {
    title: 'Marketing Analytics',
    icon: BarChart3,
    description: 'Measure campaign performance, track conversions, and optimize your marketing spend.',
    examples: ['Campaign ROI', 'Traffic analysis', 'Conversion funnels']
  },
  {
    title: 'Financial Reporting',
    icon: PieChart,
    description: 'Create professional financial reports with charts, tables, and executive summaries.',
    examples: ['P&L dashboards', 'Budget tracking', 'Expense analysis']
  },
  {
    title: 'Operations Management',
    icon: Layers,
    description: 'Monitor inventory, track logistics, and optimize your supply chain with real-time data.',
    examples: ['Inventory levels', 'Order tracking', 'Supply chain']
  },
  {
    title: 'Research & Academia',
    icon: GraduationCap,
    description: 'Visualize research data, create publication-ready charts, and share findings easily.',
    examples: ['Data analysis', 'Research papers', 'Thesis charts']
  },
  {
    title: 'Healthcare Analytics',
    icon: Heart,
    description: 'Track patient outcomes, monitor health metrics, and improve care delivery.',
    examples: ['Patient metrics', 'Treatment outcomes', 'Resource allocation']
  }
];

const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    features: ['3 dashboards', '5 datasets', 'Basic charts', 'CSV export', 'Community support'],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    features: ['Unlimited dashboards', '50 datasets', 'All chart types', 'PDF reports', 'Priority support', 'Custom branding'],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    features: ['Everything in Pro', 'Unlimited datasets', 'Database connections', 'AI Insights', 'API access', 'SSO & dedicated support'],
    cta: 'Contact Sales',
    popular: false
  }
];

const TESTIMONIALS = [
  {
    quote: "DataViz Studio transformed how we present data to stakeholders. The dashboards are beautiful and intuitive.",
    author: "Sarah Chen",
    role: "Head of Analytics, TechCorp",
    avatar: "SC"
  },
  {
    quote: "The report builder alone saved us 20+ hours per month. PDF exports look professional and polished.",
    author: "Michael Rodriguez",
    role: "CFO, StartupXYZ",
    avatar: "MR"
  },
  {
    quote: "Finally, a data viz tool that doesn't require a PhD to use. Our entire team adopted it within days.",
    author: "Emily Thompson",
    role: "Marketing Director, GrowthCo",
    avatar: "ET"
  }
];

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1628]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-400 via-fuchsia-500 to-purple-600 flex items-center justify-center">
                <DataVizLogo className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DataViz Studio</span>
            </Link>
            
            <div className="hidden md:flex items-center">
              <div className="flex items-center bg-white/5 rounded-full p-1">
                <a href="#features" className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-full">Features</a>
                <a href="#how-it-works" className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-full">How It Works</a>
                <a href="#use-cases" className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-full">Use Cases</a>
                <a href="#pricing" className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-full">Pricing</a>
                <button 
                  onClick={() => navigate('/help')}
                  className="px-4 py-1.5 text-sm text-violet-400 bg-violet-500/10 rounded-full flex items-center gap-1.5 hover:bg-violet-500/20 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Help Center
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white hover:bg-white/5"
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
              <Button 
                className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white border-0"
                onClick={() => navigate('/register')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free
              </Button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0f1d32] border-t border-white/5 px-4 py-4 space-y-3">
            <a href="#features" className="block px-4 py-2 text-gray-300 hover:text-white">Features</a>
            <a href="#how-it-works" className="block px-4 py-2 text-gray-300 hover:text-white">How It Works</a>
            <a href="#use-cases" className="block px-4 py-2 text-gray-300 hover:text-white">Use Cases</a>
            <a href="#pricing" className="block px-4 py-2 text-gray-300 hover:text-white">Pricing</a>
            <div className="pt-3 border-t border-white/10 space-y-2">
              <Button variant="ghost" className="w-full text-gray-300" onClick={() => navigate('/login')}>Log in</Button>
              <Button className="w-full bg-violet-500" onClick={() => navigate('/register')}>Start Free</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Floating decorative icons */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-[10%] w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center hidden lg:flex"
        >
          <BarChart3 className="w-6 h-6 text-violet-400" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-48 right-[10%] w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center hidden lg:flex"
        >
          <PieChart className="w-6 h-6 text-blue-400" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 left-[8%] w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center hidden lg:flex"
        >
          <LineChart className="w-5 h-5 text-teal-400" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-60 right-[12%] w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hidden lg:flex"
        >
          <Database className="w-5 h-5 text-amber-400" />
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo and badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mb-8"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 via-fuchsia-500 to-purple-600 flex items-center justify-center mb-4 shadow-xl shadow-purple-500/30">
                <DataVizLogo className="w-10 h-10 text-white" />
              </div>
              <span className="text-2xl font-bold text-white mb-2">DataViz Studio</span>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                Your Complete Data Visualization Platform
              </Badge>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            >
              Turn Data Into
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                Beautiful Insights
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
            >
              Create stunning dashboards, interactive charts, and professional reports. 
              Upload data, visualize instantly, share anywhere.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white border-0 px-8 py-6 text-lg shadow-xl shadow-violet-500/30"
                onClick={() => navigate('/register')}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-white/5 px-8 py-6 text-lg"
                onClick={() => navigate('/login')}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-8 sm:gap-16 flex-wrap"
            >
              {[
                { value: '12+', label: 'Widget types' },
                { value: '9', label: 'Chart types' },
                { value: '10', label: 'Templates' },
                { value: '50MB', label: 'File upload' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex justify-center mt-16"
        >
          <ChevronDown className="w-6 h-6 text-gray-600" />
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0f1d32]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              From Data to Dashboard in Minutes
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Three simple steps to transform your raw data into beautiful visualizations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Upload, title: 'Upload Your Data', description: 'Drop CSV, Excel, or JSON files. Or connect directly to your database.' },
              { step: '02', icon: LayoutDashboard, title: 'Build Dashboards', description: 'Drag widgets, configure charts, and arrange your perfect layout.' },
              { step: '03', icon: Share2, title: 'Share & Export', description: 'Generate PDF reports, share dashboards, or embed anywhere.' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                <div className="bg-[#0a1628] rounded-2xl p-8 border border-white/10 hover:border-violet-500/30 transition-colors h-full">
                  <div className="text-6xl font-bold text-violet-500/20 absolute top-4 right-6">{item.step}</div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-6">
                    <item.icon className="w-7 h-7 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-violet-500/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Visualize Data
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Powerful features wrapped in an intuitive interface
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0f1d32] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0f1d32]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 mb-4">Use Cases</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Every Industry
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From startups to enterprises, DataViz Studio adapts to your needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map((useCase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0a1628] rounded-xl p-6 border border-white/5 hover:border-violet-500/20 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
                  <useCase.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{useCase.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{useCase.description}</p>
                <div className="flex flex-wrap gap-2">
                  {useCase.examples.map((example, exIdx) => (
                    <span key={exIdx} className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">
                      {example}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Loved by Data Teams
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#0f1d32] rounded-xl p-6 border border-white/5"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{testimonial.author}</p>
                    <p className="text-gray-500 text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0f1d32]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Start free, upgrade when you need more power
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`relative bg-[#0a1628] rounded-2xl p-8 border ${plan.popular ? 'border-violet-500' : 'border-white/10'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-500 text-white border-0">Most Popular</Badge>
                  </div>
                )}
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500' : 'bg-white/10 hover:bg-white/20'} text-white border-0`}
                  onClick={() => navigate('/register')}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-3xl p-12 text-center border border-violet-500/20"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Visualize Your Data?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of teams creating beautiful dashboards and reports with DataViz Studio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white border-0 px-8"
                onClick={() => navigate('/register')}
              >
                Start Free Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-white/5"
                onClick={() => navigate('/help')}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Explore Help Center
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">DataViz Studio</span>
              </div>
              <p className="text-gray-500 text-sm">
                Your complete data visualization and analytics platform.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</a></li>
                <li><a href="#use-cases" className="text-gray-400 hover:text-white text-sm transition-colors">Use Cases</a></li>
                <li><Link to="/help" className="text-gray-400 hover:text-white text-sm transition-colors">Help Center</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} DataViz Studio. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
