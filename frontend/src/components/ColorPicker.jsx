/**
 * Custom Color Picker Component
 * Features:
 * - Full color picker with hex/RGB input
 * - Save custom palettes
 * - Extract brand colors from images
 */
import React, { useState, useRef, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import {
  Palette,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Save,
  Check,
  Copy,
  Pipette,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import { toast } from 'sonner';

// Predefined color schemes
const PRESET_SCHEMES = {
  purple: {
    name: 'Purple Violet',
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'],
  },
  blue: {
    name: 'Ocean Blue',
    colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'],
  },
  emerald: {
    name: 'Emerald Green',
    colors: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'],
  },
  orange: {
    name: 'Sunset Orange',
    colors: ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#c2410c'],
  },
  pink: {
    name: 'Rose Pink',
    colors: ['#ec4899', '#f472b6', '#f9a8d4', '#db2777', '#be185d'],
  },
  cyan: {
    name: 'Cyan Teal',
    colors: ['#06b6d4', '#22d3ee', '#67e8f9', '#0891b2', '#0e7490'],
  },
  rainbow: {
    name: 'Rainbow Mix',
    colors: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
  },
  monochrome: {
    name: 'Monochrome',
    colors: ['#6b7280', '#9ca3af', '#d1d5db', '#4b5563', '#374151'],
  }
};

// Color utility functions
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const getContrastColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Single color picker component
const SingleColorPicker = ({ color, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-10 h-10 rounded-lg border-2 border-border hover:border-primary transition-colors shadow-sm"
          style={{ backgroundColor: color }}
          title={label || color}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <HexColorPicker color={color} onChange={onChange} />
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">HEX</Label>
            <div className="flex gap-2">
              <span className="text-muted-foreground">#</span>
              <HexColorInput
                color={color}
                onChange={onChange}
                className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm font-mono uppercase"
                prefixed={false}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">R</Label>
              <Input
                type="number"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => onChange(rgbToHex(parseInt(e.target.value) || 0, rgb.g, rgb.b))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">G</Label>
              <Input
                type="number"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => onChange(rgbToHex(rgb.r, parseInt(e.target.value) || 0, rgb.b))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">B</Label>
              <Input
                type="number"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => onChange(rgbToHex(rgb.r, rgb.g, parseInt(e.target.value) || 0))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => {
              navigator.clipboard.writeText(color);
              toast.success('Color copied!');
            }}
          >
            <Copy className="w-3 h-3 mr-2" />
            Copy {color}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Brand color extractor from image
const BrandColorExtractor = ({ onExtract }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [extractedColors, setExtractedColors] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const extractColorsFromImage = useCallback((imageSrc) => {
    setIsExtracting(true);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Resize for performance
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Color quantization using simple bucketing
      const colorMap = {};
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i] / 32) * 32;
        const g = Math.round(pixels[i + 1] / 32) * 32;
        const b = Math.round(pixels[i + 2] / 32) * 32;
        const a = pixels[i + 3];
        
        if (a < 128) continue; // Skip transparent
        
        const key = `${r},${g},${b}`;
        colorMap[key] = (colorMap[key] || 0) + 1;
      }
      
      // Sort by frequency and get top colors
      const sortedColors = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([key]) => {
          const [r, g, b] = key.split(',').map(Number);
          return rgbToHex(r, g, b);
        });
      
      // Filter out very similar colors
      const uniqueColors = sortedColors.reduce((acc, color) => {
        const isDuplicate = acc.some(existing => {
          const c1 = hexToRgb(color);
          const c2 = hexToRgb(existing);
          const diff = Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b);
          return diff < 60;
        });
        if (!isDuplicate) acc.push(color);
        return acc;
      }, []);
      
      setExtractedColors(uniqueColors.slice(0, 6));
      setIsExtracting(false);
      toast.success(`Extracted ${uniqueColors.length} colors`);
    };
    
    img.onerror = () => {
      setIsExtracting(false);
      toast.error('Failed to load image');
    };
    
    img.src = imageSrc;
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setImageUrl(dataUrl);
        extractColorsFromImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlExtract = () => {
    if (imageUrl) {
      extractColorsFromImage(imageUrl);
    }
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="space-y-2">
        <Label>Upload Image</Label>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Logo/Image
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Or paste image URL</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/logo.png"
            value={imageUrl.startsWith('data:') ? '' : imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={handleUrlExtract}
            disabled={!imageUrl || isExtracting}
          >
            {isExtracting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Pipette className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      
      {extractedColors.length > 0 && (
        <div className="space-y-2">
          <Label>Extracted Colors</Label>
          <div className="flex flex-wrap gap-2">
            {extractedColors.map((color, i) => (
              <button
                key={i}
                className="w-10 h-10 rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-110"
                style={{ backgroundColor: color }}
                onClick={() => {
                  navigator.clipboard.writeText(color);
                  toast.success(`Copied ${color}`);
                }}
                title={color}
              />
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => onExtract(extractedColors)}
            className="w-full mt-2"
          >
            <Check className="w-4 h-4 mr-2" />
            Use These Colors
          </Button>
        </div>
      )}
    </div>
  );
};

// Main Color Picker Dialog Component
export function ColorPickerDialog({ 
  currentScheme, 
  customPalettes = [], 
  onSelectScheme, 
  onSaveCustomPalette,
  onDeleteCustomPalette,
  trigger 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('presets');
  const [customColors, setCustomColors] = useState(['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ec4899']);
  const [paletteName, setPaletteName] = useState('');

  const handleColorChange = (index, color) => {
    const newColors = [...customColors];
    newColors[index] = color;
    setCustomColors(newColors);
  };

  const addColor = () => {
    if (customColors.length < 8) {
      setCustomColors([...customColors, '#6b7280']);
    }
  };

  const removeColor = (index) => {
    if (customColors.length > 2) {
      setCustomColors(customColors.filter((_, i) => i !== index));
    }
  };

  const handleSaveCustomPalette = () => {
    if (!paletteName.trim()) {
      toast.error('Please enter a palette name');
      return;
    }
    
    const palette = {
      id: `custom_${Date.now()}`,
      name: paletteName,
      colors: customColors,
      gradient: [customColors[0], customColors[customColors.length - 1]],
      accent: customColors[0],
      isCustom: true
    };
    
    onSaveCustomPalette?.(palette);
    setPaletteName('');
    toast.success('Palette saved!');
  };

  const handleExtractedColors = (colors) => {
    setCustomColors(colors.slice(0, 8));
    setActiveTab('custom');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Palette className="w-4 h-4 mr-2" />
            Color Scheme
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Scheme
          </DialogTitle>
          <DialogDescription>
            Choose a preset scheme, create custom palettes, or extract colors from your brand
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="extract">From Image</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PRESET_SCHEMES).map(([key, scheme]) => (
                <button
                  key={key}
                  onClick={() => {
                    onSelectScheme?.(key);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all hover:border-primary text-left ${
                    currentScheme === key ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{scheme.name}</span>
                    {currentScheme === key && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex gap-1">
                    {scheme.colors.slice(0, 5).map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-md first:rounded-l-lg last:rounded-r-lg"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {customPalettes.length > 0 && (
              <>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Your Custom Palettes</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {customPalettes.map((palette) => (
                      <div
                        key={palette.id}
                        className={`p-3 rounded-lg border-2 transition-all hover:border-primary ${
                          currentScheme === palette.id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => {
                              onSelectScheme?.(palette.id);
                              setIsOpen(false);
                            }}
                            className="font-medium text-sm hover:text-primary"
                          >
                            {palette.name}
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => onDeleteCustomPalette?.(palette.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          {palette.colors.slice(0, 5).map((color, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-md first:rounded-l-lg last:rounded-r-lg"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Palette Colors ({customColors.length}/8)</Label>
              <div className="flex flex-wrap gap-2 items-center">
                {customColors.map((color, index) => (
                  <div key={index} className="relative group">
                    <SingleColorPicker
                      color={color}
                      onChange={(c) => handleColorChange(index, c)}
                      label={`Color ${index + 1}`}
                    />
                    {customColors.length > 2 && (
                      <button
                        onClick={() => removeColor(index)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {customColors.length < 8 && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10"
                    onClick={addColor}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
              <div className="h-8 rounded-lg flex overflow-hidden">
                {customColors.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1 transition-all"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Palette name (e.g., Brand Colors)"
                value={paletteName}
                onChange={(e) => setPaletteName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSaveCustomPalette}>
                <Save className="w-4 h-4 mr-2" />
                Save Palette
              </Button>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                const customScheme = {
                  name: 'Custom',
                  colors: customColors,
                  gradient: [customColors[0], customColors[customColors.length - 1]],
                  accent: customColors[0]
                };
                onSelectScheme?.('custom', customScheme);
                setIsOpen(false);
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Without Saving
            </Button>
          </TabsContent>

          <TabsContent value="extract" className="mt-4">
            <BrandColorExtractor onExtract={handleExtractedColors} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Simple inline color scheme selector for quick access
export function ColorSchemeSelector({ value, onChange, schemes = PRESET_SCHEMES }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(schemes).map(([key, scheme]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`p-2 rounded-lg border-2 transition-all ${
            value === key ? 'border-primary' : 'border-transparent hover:border-border'
          }`}
          title={scheme.name}
        >
          <div className="flex gap-0.5">
            {scheme.colors.slice(0, 4).map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

export default ColorPickerDialog;
