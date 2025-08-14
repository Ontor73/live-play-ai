import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Zap } from 'lucide-react';

interface Highlight {
  id: string;
  title: string;
  timestamp: number;
  timeDisplay: string;
  type: 'goal' | 'save' | 'foul' | 'corner' | 'substitution';
  description: string;
  detectedAt: string;
}

interface HighlightsSectionProps {
  onSeekTo: (timestamp: number) => void;
  currentTime: number;
}

const HIGHLIGHT_TYPES = {
  goal: { color: 'bg-sports-highlight', label: 'Goal', icon: '⚽' },
  save: { color: 'bg-sports-secondary', label: 'Great Save', icon: '🥅' },
  foul: { color: 'bg-sports-accent', label: 'Foul', icon: '⚠️' },
  corner: { color: 'bg-sports-primary', label: 'Corner', icon: '📐' },
  substitution: { color: 'bg-muted', label: 'Sub', icon: '🔄' }
};

const SAMPLE_HIGHLIGHTS = [
  { title: "Spectacular Goal", type: 'goal', description: "Amazing strike from 25 yards out!" },
  { title: "Incredible Save", type: 'save', description: "Goalkeeper denies a certain goal" },
  { title: "Yellow Card", type: 'foul', description: "Tactical foul stops the counter attack" },
  { title: "Corner Kick", type: 'corner', description: "Dangerous delivery into the box" },
  { title: "Key Substitution", type: 'substitution', description: "Fresh legs brought on" }
];

export const HighlightsSection = ({ onSeekTo, currentTime }: HighlightsSectionProps) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    const generateHighlight = () => {
      const randomHighlight = SAMPLE_HIGHLIGHTS[Math.floor(Math.random() * SAMPLE_HIGHLIGHTS.length)];
      const timestamp = currentTime;
      
      const newHighlight: Highlight = {
        id: Date.now().toString(),
        title: randomHighlight.title,
        timestamp,
        timeDisplay: formatTime(timestamp),
        type: randomHighlight.type as keyof typeof HIGHLIGHT_TYPES,
        description: randomHighlight.description,
        detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHighlights(prev => [newHighlight, ...prev]);
    };

    // Generate highlights every 30-60 seconds
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to generate a highlight
        generateHighlight();
      }
    }, Math.random() * 30000 + 30000);

    return () => clearInterval(interval);
  }, [currentTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Zap className="h-5 w-5 text-sports-highlight" />
        <h2 className="text-xl font-bold">AI Detected Highlights</h2>
        <Badge variant="secondary" className="bg-sports-primary/20 text-sports-primary">
          {highlights.length} detected
        </Badge>
      </div>
      
      {highlights.length === 0 ? (
        <Card className="p-8 text-center bg-card/50">
          <div className="space-y-3">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-foreground">No Highlights Yet</h3>
            <p className="text-sm text-muted-foreground">
              AI is analyzing the stream for key moments. Highlights will appear here automatically.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlights.map((highlight) => (
            <Card
              key={highlight.id}
              className="p-4 bg-card/50 border-border/50 hover:border-sports-primary/50 transition-all duration-300 cursor-pointer group animate-slide-up"
              onClick={() => onSeekTo(highlight.timestamp)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={`${HIGHLIGHT_TYPES[highlight.type].color}/20 text-${HIGHLIGHT_TYPES[highlight.type].color.replace('bg-', '')} border-${HIGHLIGHT_TYPES[highlight.type].color.replace('bg-', '')}/30`}
                  >
                    <span className="mr-1">{HIGHLIGHT_TYPES[highlight.type].icon}</span>
                    {HIGHLIGHT_TYPES[highlight.type].label}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {highlight.timeDisplay}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-sports-primary transition-colors">
                    {highlight.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {highlight.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Detected at {highlight.detectedAt}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-sports-primary hover:text-sports-primary-glow"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Watch
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};