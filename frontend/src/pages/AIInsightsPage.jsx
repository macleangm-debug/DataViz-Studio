import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Send,
  Sparkles,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Database,
  MessageSquare,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useOrgStore, useAuthStore } from '../store';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SUGGESTED_QUERIES = [
  { text: "Summarize this dataset", icon: Database, category: "Overview" },
  { text: "What are the key trends?", icon: TrendingUp, category: "Analysis" },
  { text: "Suggest useful visualizations", icon: BarChart3, category: "Visualization" },
  { text: "Find any anomalies or outliers", icon: Lightbulb, category: "Insights" },
  { text: "Compare the top categories", icon: MessageSquare, category: "Comparison" },
];

export function AIInsightsPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrgStore();
  const { token } = useAuthStore();
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDatasets();
  }, [currentOrg]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDatasets = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const orgParam = currentOrg?.id ? `?org_id=${currentOrg.id}` : '';
      const response = await axios.get(`${API_URL}/api/datasets${orgParam}`, { headers });
      setDatasets(response.data.datasets || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    }
  };

  const handleSubmit = async (queryText = query) => {
    if (!queryText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: queryText,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API_URL}/api/ai/query`, {
        query: queryText,
        dataset_id: selectedDataset || null,
        context: {}
      }, { headers });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error querying AI:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: error.response?.data?.detail || 'Failed to get AI response. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleSuggestionClick = (suggestion) => {
    handleSubmit(suggestion.text);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col" data-testid="ai-insights-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Brain className="w-8 h-8 text-violet-600" />
              AI Insights
            </h1>
            <p className="text-muted-foreground mt-1">
              Ask questions about your data and get AI-powered insights
            </p>
          </div>
          
          {/* Dataset Selector */}
          <div className="w-full md:w-64">
            <Select 
              value={selectedDataset || '__all__'} 
              onValueChange={(v) => setSelectedDataset(v === '__all__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dataset (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All datasets</SelectItem>
                {datasets.map((dataset) => (
                  <SelectItem key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-violet-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Ask anything about your data
                </h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  Get AI-powered insights, discover trends, and find patterns in your datasets
                </p>
                
                {/* Suggested Queries */}
                <div className="grid gap-3 max-w-lg w-full">
                  <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
                  {SUGGESTED_QUERIES.map((suggestion, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-left"
                      data-testid={`suggestion-${idx}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <suggestion.icon className="w-4 h-4 text-violet-600" />
                      </div>
                      <span className="text-foreground">{suggestion.text}</span>
                      <Badge variant="secondary" className="ml-auto">{suggestion.category}</Badge>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${
                      message.type === 'user' 
                        ? 'bg-violet-600 text-white rounded-2xl rounded-br-md' 
                        : message.type === 'error'
                        ? 'bg-destructive/10 text-destructive rounded-2xl rounded-bl-md border border-destructive/20'
                        : 'bg-muted rounded-2xl rounded-bl-md'
                    } p-4`}>
                      {message.type === 'ai' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-violet-600" />
                          <span className="text-xs font-medium text-violet-600">AI Assistant</span>
                        </div>
                      )}
                      <div className={`whitespace-pre-wrap ${
                        message.type === 'user' ? 'text-white' : 'text-foreground'
                      }`}>
                        {message.content}
                      </div>
                      {message.type === 'ai' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 -ml-2"
                          onClick={() => handleCopy(message.content, message.id)}
                        >
                          {copied === message.id ? (
                            <Check className="w-4 h-4 mr-1" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          {copied === message.id ? 'Copied' : 'Copy'}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted rounded-2xl rounded-bl-md p-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                      <span className="text-muted-foreground">Thinking...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your data..."
                className="min-h-[50px] max-h-[150px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                data-testid="ai-query-input"
              />
              <Button
                onClick={() => handleSubmit()}
                disabled={loading || !query.trim()}
                className="bg-violet-600 hover:bg-violet-700 px-6"
                data-testid="send-query-btn"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default AIInsightsPage;
