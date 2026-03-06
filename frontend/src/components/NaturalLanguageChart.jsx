import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  X, 
  Loader2,
  BarChart3,
  PieChart,
  LineChart,
  Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EXAMPLE_QUERIES = [
  "Show revenue by region",
  "Compare sales across quarters",
  "Top 5 products by sales",
  "Monthly trend of orders"
];

export function NaturalLanguageChart({ datasets, token, onChartGenerated, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedChart, setSuggestedChart] = useState(null);
  const [error, setError] = useState(null);

  const generateChart = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestedChart(null);

    try {
      const response = await axios.post(`${API_URL}/api/ai/generate-chart`, {
        query: query.trim(),
        available_datasets: datasets.map(d => ({
          id: d.id,
          name: d.name,
          columns: d.columns?.map(c => ({ name: c.name, type: c.type })) || []
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuggestedChart(response.data);
      toast.success('Chart configuration generated!');
    } catch (err) {
      console.error('Error generating chart:', err);
      setError(err.response?.data?.detail || 'Failed to generate chart');
      toast.error('Failed to generate chart configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      generateChart();
    }
  };

  const applyChart = () => {
    if (suggestedChart && onChartGenerated) {
      onChartGenerated(suggestedChart);
      toast.success('Chart added to dashboard!');
      onClose?.();
    }
  };

  const getChartIcon = (type) => {
    switch (type) {
      case 'bar': return BarChart3;
      case 'pie': return PieChart;
      case 'line': return LineChart;
      default: return BarChart3;
    }
  };

  return (
    <Card className="bg-slate-900/95 backdrop-blur-sm border-violet-500/40 shadow-xl">
      <CardHeader className="py-3 px-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <CardTitle className="text-sm font-medium">Natural Language to Chart</CardTitle>
            <Badge variant="outline" className="text-[9px] h-4 bg-violet-500/10 border-violet-500/30 text-violet-400">
              AI
            </Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Query Input */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Describe the chart you want to create in plain English
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Show sales by region as a bar chart"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-slate-800/50 border-slate-700"
              disabled={loading}
            />
            <Button 
              onClick={generateChart} 
              disabled={loading || !query.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Example Queries */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Try:</p>
          <div className="flex flex-wrap gap-1">
            {EXAMPLE_QUERIES.map((example, i) => (
              <button
                key={i}
                onClick={() => setQuery(example)}
                className="text-[10px] px-2 py-1 rounded bg-slate-800/50 text-muted-foreground hover:bg-violet-500/20 hover:text-violet-300 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Generated Chart Preview */}
        <AnimatePresence>
          {suggestedChart && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="p-3 rounded-lg bg-slate-800/50 border border-violet-500/30">
                <div className="flex items-center gap-2 mb-2">
                  {React.createElement(getChartIcon(suggestedChart.chart_type), { className: "w-4 h-4 text-violet-400" })}
                  <span className="text-sm font-medium">{suggestedChart.title}</span>
                  <Badge variant="secondary" className="text-[9px] capitalize">
                    {suggestedChart.chart_type}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Dataset:</span>
                    <span className="ml-1 text-foreground">{suggestedChart.dataset_name || 'Auto-selected'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">X-Axis:</span>
                    <span className="ml-1 text-foreground">{suggestedChart.x_field}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Y-Axis:</span>
                    <span className="ml-1 text-foreground">{suggestedChart.y_field || 'Count'}</span>
                  </div>
                  {suggestedChart.aggregation && (
                    <div>
                      <span className="text-muted-foreground">Aggregation:</span>
                      <span className="ml-1 text-foreground capitalize">{suggestedChart.aggregation}</span>
                    </div>
                  )}
                </div>
                
                {suggestedChart.explanation && (
                  <p className="mt-2 text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                    <Sparkles className="w-3 h-3 inline mr-1 text-violet-400" />
                    {suggestedChart.explanation}
                  </p>
                )}
              </div>
              
              <Button onClick={applyChart} className="w-full bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Add to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default NaturalLanguageChart;
