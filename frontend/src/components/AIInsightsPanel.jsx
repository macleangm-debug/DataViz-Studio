import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const INSIGHT_ICONS = {
  trend_up: TrendingUp,
  trend_down: TrendingDown,
  outlier: AlertTriangle,
  target: Target,
  insight: Lightbulb,
  default: Sparkles
};

const INSIGHT_COLORS = {
  trend_up: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  trend_down: 'text-red-400 bg-red-500/10 border-red-500/30',
  outlier: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  target: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  insight: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  default: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
};

export function AIInsightsPanel({ widgetId, widgetData, widgetConfig, token, onClose }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    if (!widgetData || !Array.isArray(widgetData) || widgetData.length === 0) {
      setInsights([{
        type: 'insight',
        title: 'No Data',
        description: 'Add data to this widget to generate AI insights.'
      }]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/ai/insights`, {
        widget_id: widgetId,
        data: widgetData,
        config: widgetConfig
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInsights(response.data.insights || []);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to generate insights');
      // Fallback to basic insights
      generateBasicInsights();
    } finally {
      setLoading(false);
    }
  };

  const generateBasicInsights = () => {
    if (!widgetData || !Array.isArray(widgetData) || widgetData.length === 0) return;
    
    const basicInsights = [];
    const values = widgetData.map(d => d.value);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxItem = widgetData.find(d => d.value === max);
    const minItem = widgetData.find(d => d.value === min);
    
    basicInsights.push({
      type: 'insight',
      title: 'Summary',
      description: `Total: ${total.toLocaleString()}, Average: ${avg.toLocaleString(undefined, {maximumFractionDigits: 0})}`
    });
    
    if (maxItem) {
      basicInsights.push({
        type: 'trend_up',
        title: 'Top Performer',
        description: `${maxItem.name} leads with ${maxItem.value.toLocaleString()} (${((maxItem.value / total) * 100).toFixed(1)}% of total)`
      });
    }
    
    if (minItem && minItem.name !== maxItem?.name) {
      basicInsights.push({
        type: 'trend_down',
        title: 'Lowest',
        description: `${minItem.name} has ${minItem.value.toLocaleString()} (${((minItem.value / total) * 100).toFixed(1)}% of total)`
      });
    }
    
    // Check for outliers (values > 2 std devs from mean)
    const stdDev = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length);
    const outliers = widgetData.filter(d => Math.abs(d.value - avg) > 2 * stdDev);
    
    if (outliers.length > 0) {
      basicInsights.push({
        type: 'outlier',
        title: 'Outlier Detected',
        description: `${outliers.map(o => o.name).join(', ')} ${outliers.length === 1 ? 'shows' : 'show'} unusual values`
      });
    }
    
    setInsights(basicInsights);
  };

  useEffect(() => {
    fetchInsights();
  }, [widgetId, widgetData]);

  return (
    <Card className="bg-slate-900/80 backdrop-blur-sm border-violet-500/30 overflow-hidden">
      <CardHeader className="py-2 px-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <CardTitle className="text-sm font-medium text-violet-300">AI Insights</CardTitle>
            <Badge variant="outline" className="text-[9px] h-4 bg-violet-500/10 border-violet-500/30 text-violet-400">
              Beta
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground hover:text-violet-400"
              onClick={(e) => { e.stopPropagation(); fetchInsights(); }}
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 pb-2 px-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-violet-400" />
                  <span className="ml-2 text-sm text-muted-foreground">Analyzing data...</span>
                </div>
              ) : error ? (
                <div className="text-center py-3">
                  <p className="text-xs text-red-400">{error}</p>
                  <Button variant="link" size="sm" onClick={fetchInsights} className="text-xs text-violet-400">
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {insights.map((insight, index) => {
                    const IconComponent = INSIGHT_ICONS[insight.type] || INSIGHT_ICONS.default;
                    const colorClass = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.default;
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-start gap-2 p-2 rounded-lg border ${colorClass}`}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{insight.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default AIInsightsPanel;
