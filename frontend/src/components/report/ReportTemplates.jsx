import React from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Users, DollarSign, Target, 
  Briefcase, Calendar, FileText, Award, ShoppingCart, Megaphone,
  Building, ClipboardList, Heart, Zap
} from 'lucide-react';

// ========================================
// INDUSTRY-STANDARD REPORT TEMPLATES
// ========================================

export const REPORT_TEMPLATES = [
  {
    id: 'quarterly_summary',
    name: 'Quarterly Business Summary',
    description: 'Financial metrics, quarterly comparisons, and key highlights',
    icon: Calendar,
    category: 'Finance',
    theme: 'blue_coral',
    coverPage: true,
    config: {
      title: 'Q4 2025 Business Summary',
      subtitle: 'Quarterly Performance Analysis',
      confidentialityLevel: 'Internal',
    },
    sections: [
      {
        id: 'qs_1',
        type: 'stat_cards',
        title: 'Key Performance Indicators',
        width: 100,
        stats: [
          { value: '$2.4M', label: 'Total Revenue', iconType: 'dollar' },
          { value: '+18%', label: 'YoY Growth', iconType: 'trending' },
          { value: '847', label: 'New Customers', iconType: 'users' },
          { value: '94%', label: 'Customer Retention', iconType: 'percent' },
        ]
      },
      { id: 'qs_2', type: 'bar_chart', title: 'Revenue by Quarter', width: 50 },
      { id: 'qs_3', type: 'pie_chart', title: 'Revenue by Segment', width: 50 },
      { id: 'qs_4', type: 'intro', title: 'Executive Summary', content: 'This quarter demonstrated strong performance across all business units. Key achievements include market expansion, improved operational efficiency, and successful product launches.', width: 100 },
      { id: 'qs_5', type: 'data_table', title: 'Regional Performance', width: 50, showSparklines: true },
      { id: 'qs_6', type: 'line_chart', title: 'Monthly Trend Analysis', width: 50 },
      { id: 'qs_7', type: 'conclusion', title: 'Outlook & Recommendations', content: 'Based on current trends, we project continued growth in Q1 2026. Key focus areas include digital transformation initiatives and customer experience improvements.', width: 100 },
    ]
  },
  {
    id: 'executive_report',
    name: 'Executive Report',
    description: 'High-level KPIs and strategic overview for leadership',
    icon: Briefcase,
    category: 'Executive',
    theme: 'purple_pink',
    coverPage: true,
    config: {
      title: 'Executive Performance Report',
      subtitle: 'Strategic Overview & Key Insights',
      confidentialityLevel: 'Confidential',
    },
    sections: [
      {
        id: 'er_1',
        type: 'stat_cards',
        title: 'Strategic Metrics',
        width: 100,
        stats: [
          { value: '$12.8M', label: 'Annual Revenue', iconType: 'dollar' },
          { value: '32%', label: 'Market Share', iconType: 'percent' },
          { value: '4.8/5', label: 'Customer Satisfaction', iconType: 'star' },
          { value: '156', label: 'Enterprise Clients', iconType: 'building' },
        ]
      },
      { id: 'er_2', type: 'intro', title: 'Strategic Overview', content: 'This report provides a comprehensive analysis of organizational performance, market positioning, and strategic initiatives. Our focus on innovation and customer-centricity continues to drive sustainable growth.', width: 100 },
      { id: 'er_3', type: 'pie_chart', title: 'Revenue Distribution', width: 50 },
      { id: 'er_4', type: 'bar_chart', title: 'Performance vs Targets', width: 50 },
      { id: 'er_5', type: 'data_table', title: 'Business Unit Performance', width: 100, showSparklines: true },
      { id: 'er_6', type: 'line_chart', title: 'Growth Trajectory', width: 100 },
      { id: 'er_7', type: 'conclusion', title: 'Strategic Recommendations', content: '1. Expand into emerging markets\n2. Accelerate digital transformation\n3. Invest in talent development\n4. Strengthen partner ecosystem', width: 100 },
    ]
  },
  {
    id: 'sales_dashboard',
    name: 'Sales Dashboard',
    description: 'Sales metrics, pipeline analysis, and team performance',
    icon: ShoppingCart,
    category: 'Sales',
    theme: 'green_teal',
    coverPage: false,
    config: {
      title: 'Sales Performance Dashboard',
      subtitle: 'Monthly Sales Analytics & Pipeline',
      confidentialityLevel: 'Internal',
    },
    sections: [
      {
        id: 'sd_1',
        type: 'stat_cards',
        title: 'Sales Overview',
        width: 100,
        stats: [
          { value: '$1.2M', label: 'Monthly Revenue', iconType: 'dollar' },
          { value: '287', label: 'Deals Closed', iconType: 'cart' },
          { value: '$4.2K', label: 'Average Deal Size', iconType: 'trending' },
          { value: '23 days', label: 'Avg Sales Cycle', iconType: 'clock' },
        ]
      },
      { id: 'sd_2', type: 'bar_chart', title: 'Sales by Region', width: 50 },
      { id: 'sd_3', type: 'pie_chart', title: 'Sales by Product', width: 50 },
      { id: 'sd_4', type: 'data_table', title: 'Top Performers', width: 50, showSparklines: true },
      { id: 'sd_5', type: 'line_chart', title: 'Monthly Sales Trend', width: 50 },
      { id: 'sd_6', type: 'bar_chart', title: 'Pipeline by Stage', width: 100 },
    ]
  },
  {
    id: 'marketing_analytics',
    name: 'Marketing Analytics',
    description: 'Campaign performance, conversion metrics, and ROI analysis',
    icon: Megaphone,
    category: 'Marketing',
    theme: 'orange_red',
    coverPage: true,
    config: {
      title: 'Marketing Performance Report',
      subtitle: 'Campaign Analytics & ROI Analysis',
      confidentialityLevel: 'Internal',
    },
    sections: [
      {
        id: 'ma_1',
        type: 'stat_cards',
        title: 'Marketing Metrics',
        width: 100,
        stats: [
          { value: '2.4M', label: 'Total Impressions', iconType: 'eye' },
          { value: '156K', label: 'Website Visitors', iconType: 'users' },
          { value: '3.2%', label: 'Conversion Rate', iconType: 'percent' },
          { value: '285%', label: 'Campaign ROI', iconType: 'trending' },
        ]
      },
      { id: 'ma_2', type: 'bar_chart', title: 'Channel Performance', width: 50 },
      { id: 'ma_3', type: 'pie_chart', title: 'Budget Allocation', width: 50 },
      { id: 'ma_4', type: 'line_chart', title: 'Lead Generation Trend', width: 100 },
      { id: 'ma_5', type: 'data_table', title: 'Campaign Breakdown', width: 100, showSparklines: true },
      { id: 'ma_6', type: 'conclusion', title: 'Optimization Recommendations', content: 'Focus on high-performing channels (Social, Email) while optimizing underperforming campaigns. A/B testing opportunities identified for landing pages.', width: 100 },
    ]
  },
  {
    id: 'hr_report',
    name: 'HR & People Analytics',
    description: 'Employee metrics, hiring stats, and engagement data',
    icon: Users,
    category: 'HR',
    theme: 'blue_purple',
    coverPage: true,
    config: {
      title: 'People Analytics Report',
      subtitle: 'Workforce Insights & HR Metrics',
      confidentialityLevel: 'Confidential',
    },
    sections: [
      {
        id: 'hr_1',
        type: 'stat_cards',
        title: 'Workforce Overview',
        width: 100,
        stats: [
          { value: '342', label: 'Total Employees', iconType: 'users' },
          { value: '24', label: 'New Hires (Month)', iconType: 'plus' },
          { value: '92%', label: 'Retention Rate', iconType: 'percent' },
          { value: '4.2/5', label: 'Employee Satisfaction', iconType: 'star' },
        ]
      },
      { id: 'hr_2', type: 'pie_chart', title: 'Headcount by Department', width: 50 },
      { id: 'hr_3', type: 'bar_chart', title: 'Hiring by Month', width: 50 },
      { id: 'hr_4', type: 'data_table', title: 'Department Metrics', width: 100, showSparklines: true },
      { id: 'hr_5', type: 'line_chart', title: 'Attrition Trend', width: 50 },
      { id: 'hr_6', type: 'pie_chart', title: 'Tenure Distribution', width: 50 },
      { id: 'hr_7', type: 'conclusion', title: 'HR Initiatives', content: 'Key focus areas: Employee development programs, diversity initiatives, and enhanced benefits package rollout in Q1.', width: 100 },
    ]
  },
  {
    id: 'project_status',
    name: 'Project Status Report',
    description: 'Milestones, progress tracking, and risk assessment',
    icon: ClipboardList,
    category: 'Project Management',
    theme: 'teal_cyan',
    coverPage: false,
    config: {
      title: 'Project Status Report',
      subtitle: 'Progress Update & Milestone Tracking',
      confidentialityLevel: 'Internal',
    },
    sections: [
      {
        id: 'ps_1',
        type: 'stat_cards',
        title: 'Project Health',
        width: 100,
        stats: [
          { value: '78%', label: 'Overall Completion', iconType: 'percent' },
          { value: '12/15', label: 'Milestones Complete', iconType: 'check' },
          { value: 'On Track', label: 'Schedule Status', iconType: 'clock' },
          { value: '$45K', label: 'Budget Remaining', iconType: 'dollar' },
        ]
      },
      { id: 'ps_2', type: 'intro', title: 'Project Summary', content: 'The project is progressing according to schedule with 78% completion. Key deliverables for this sprint have been met, and the team is on track for the Q1 release.', width: 100 },
      { id: 'ps_3', type: 'bar_chart', title: 'Phase Completion', width: 50 },
      { id: 'ps_4', type: 'pie_chart', title: 'Resource Allocation', width: 50 },
      { id: 'ps_5', type: 'data_table', title: 'Milestone Tracker', width: 100 },
      { id: 'ps_6', type: 'line_chart', title: 'Burndown Chart', width: 100 },
      { id: 'ps_7', type: 'conclusion', title: 'Risks & Mitigations', content: '1. Resource constraint - Mitigation: Cross-training team members\n2. Scope creep - Mitigation: Strict change control process\n3. Integration delays - Mitigation: Early testing cycles', width: 100 },
    ]
  },
  {
    id: 'financial_statement',
    name: 'Financial Statement',
    description: 'Revenue, expenses, profit margins, and financial health',
    icon: DollarSign,
    category: 'Finance',
    theme: 'green_emerald',
    coverPage: true,
    config: {
      title: 'Financial Statement',
      subtitle: 'Fiscal Year Financial Summary',
      confidentialityLevel: 'Strictly Confidential',
    },
    sections: [
      {
        id: 'fs_1',
        type: 'stat_cards',
        title: 'Financial Highlights',
        width: 100,
        stats: [
          { value: '$8.6M', label: 'Total Revenue', iconType: 'dollar' },
          { value: '$5.2M', label: 'Operating Expenses', iconType: 'expense' },
          { value: '$3.4M', label: 'Net Profit', iconType: 'trending' },
          { value: '39.5%', label: 'Profit Margin', iconType: 'percent' },
        ]
      },
      { id: 'fs_2', type: 'bar_chart', title: 'Revenue vs Expenses', width: 50 },
      { id: 'fs_3', type: 'pie_chart', title: 'Expense Breakdown', width: 50 },
      { id: 'fs_4', type: 'line_chart', title: 'Monthly Cash Flow', width: 100 },
      { id: 'fs_5', type: 'data_table', title: 'Income Statement', width: 100 },
      { id: 'fs_6', type: 'conclusion', title: 'Financial Outlook', content: 'Strong financial performance with healthy profit margins. Recommend reinvesting 20% of profits into R&D and maintaining current operational efficiency initiatives.', width: 100 },
    ]
  },
  {
    id: 'customer_insights',
    name: 'Customer Insights',
    description: 'NPS scores, satisfaction metrics, and feedback analysis',
    icon: Heart,
    category: 'Customer Success',
    theme: 'pink_rose',
    coverPage: true,
    config: {
      title: 'Customer Insights Report',
      subtitle: 'Voice of Customer & Satisfaction Analysis',
      confidentialityLevel: 'Internal',
    },
    sections: [
      {
        id: 'ci_1',
        type: 'stat_cards',
        title: 'Customer Metrics',
        width: 100,
        stats: [
          { value: '+72', label: 'Net Promoter Score', iconType: 'trending' },
          { value: '4.6/5', label: 'CSAT Score', iconType: 'star' },
          { value: '89%', label: 'First Contact Resolution', iconType: 'percent' },
          { value: '< 2hr', label: 'Avg Response Time', iconType: 'clock' },
        ]
      },
      { id: 'ci_2', type: 'pie_chart', title: 'Satisfaction Distribution', width: 50 },
      { id: 'ci_3', type: 'bar_chart', title: 'NPS by Segment', width: 50 },
      { id: 'ci_4', type: 'line_chart', title: 'CSAT Trend', width: 100 },
      { id: 'ci_5', type: 'data_table', title: 'Feedback Categories', width: 100, showSparklines: true },
      { id: 'ci_6', type: 'intro', title: 'Key Insights', content: 'Customers highly value our product quality and support responsiveness. Areas for improvement include onboarding experience and documentation clarity.', width: 100 },
    ]
  },
  {
    id: 'product_analytics',
    name: 'Product Analytics',
    description: 'Usage metrics, feature adoption, and user behavior',
    icon: Zap,
    category: 'Product',
    theme: 'indigo_violet',
    coverPage: false,
    config: {
      title: 'Product Analytics Dashboard',
      subtitle: 'User Engagement & Feature Metrics',
      confidentialityLevel: 'Internal',
    },
    sections: [
      {
        id: 'pa_1',
        type: 'stat_cards',
        title: 'Product Metrics',
        width: 100,
        stats: [
          { value: '45.2K', label: 'Monthly Active Users', iconType: 'users' },
          { value: '68%', label: 'Feature Adoption', iconType: 'percent' },
          { value: '12.4 min', label: 'Avg Session Duration', iconType: 'clock' },
          { value: '4.8/5', label: 'App Store Rating', iconType: 'star' },
        ]
      },
      { id: 'pa_2', type: 'line_chart', title: 'Daily Active Users', width: 50 },
      { id: 'pa_3', type: 'bar_chart', title: 'Feature Usage', width: 50 },
      { id: 'pa_4', type: 'pie_chart', title: 'User Segments', width: 50 },
      { id: 'pa_5', type: 'data_table', title: 'Feature Metrics', width: 50, showSparklines: true },
      { id: 'pa_6', type: 'line_chart', title: 'Retention Cohorts', width: 100 },
    ]
  },
  {
    id: 'operational_report',
    name: 'Operations Report',
    description: 'Efficiency metrics, SLAs, and operational performance',
    icon: Building,
    category: 'Operations',
    theme: 'slate_gray',
    coverPage: true,
    config: {
      title: 'Operations Performance Report',
      subtitle: 'Operational Efficiency & SLA Compliance',
      confidentialityLevel: 'Internal',
    },
    sections: [
      {
        id: 'or_1',
        type: 'stat_cards',
        title: 'Operational KPIs',
        width: 100,
        stats: [
          { value: '99.9%', label: 'System Uptime', iconType: 'percent' },
          { value: '98.5%', label: 'SLA Compliance', iconType: 'check' },
          { value: '< 50ms', label: 'Avg Response Time', iconType: 'clock' },
          { value: '3', label: 'Active Incidents', iconType: 'alert' },
        ]
      },
      { id: 'or_2', type: 'bar_chart', title: 'Tickets by Category', width: 50 },
      { id: 'or_3', type: 'pie_chart', title: 'Incident Priority', width: 50 },
      { id: 'or_4', type: 'line_chart', title: 'System Performance', width: 100 },
      { id: 'or_5', type: 'data_table', title: 'SLA Performance', width: 100, showSparklines: true },
      { id: 'or_6', type: 'conclusion', title: 'Improvement Areas', content: 'Focus on reducing incident response time and implementing predictive maintenance. Capacity planning review scheduled for next quarter.', width: 100 },
    ]
  },
];

// Template categories for filtering
export const TEMPLATE_CATEGORIES = [
  'All',
  'Finance',
  'Executive',
  'Sales',
  'Marketing',
  'HR',
  'Project Management',
  'Customer Success',
  'Product',
  'Operations',
];

// Get icon component for template
export const getTemplateIcon = (template) => {
  const IconComponent = template.icon;
  return IconComponent ? <IconComponent size={20} /> : <FileText size={20} />;
};

export default REPORT_TEMPLATES;
