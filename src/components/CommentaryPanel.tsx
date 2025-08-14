import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Zap } from 'lucide-react';

interface CommentaryItem {
  id: string;
  text: string;
  timestamp: string;
  type: 'commentary' | 'highlight' | 'alert';
}

const SAMPLE_COMMENTARY = [
  { text: "What a fantastic start to the match!", type: 'commentary' },
  { text: "Incredible pace from both teams", type: 'commentary' },
  { text: "GOAL! Absolutely spectacular finish!", type: 'highlight' },
  { text: "The crowd is going wild!", type: 'commentary' },
  { text: "Beautiful passing sequence", type: 'commentary' },
  { text: "Yellow card! That's a booking", type: 'alert' },
  { text: "Corner kick incoming", type: 'commentary' },
  { text: "What a save by the goalkeeper!", type: 'highlight' },
  { text: "Substitution being made", type: 'alert' },
  { text: "The tension is building", type: 'commentary' },
  { text: "Free kick in a dangerous position", type: 'commentary' },
  { text: "PENALTY! The referee points to the spot!", type: 'highlight' },
  { text: "Tactical adjustment from the coach", type: 'commentary' },
  { text: "Great defensive work", type: 'commentary' },
  { text: "The atmosphere is electric", type: 'commentary' }
];

export const CommentaryPanel = () => {
  const [commentary, setCommentary] = useState<CommentaryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const addCommentary = () => {
      const randomComment = SAMPLE_COMMENTARY[Math.floor(Math.random() * SAMPLE_COMMENTARY.length)];
      const newItem: CommentaryItem = {
        id: Date.now().toString(),
        text: randomComment.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: randomComment.type as 'commentary' | 'highlight' | 'alert'
      };

      setCommentary(prev => [newItem, ...prev].slice(0, 50)); // Keep only latest 50 items
    };

    // Add initial commentary
    addCommentary();

    // Add new commentary every 8-15 seconds
    const interval = setInterval(() => {
      addCommentary();
    }, Math.random() * 7000 + 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to top when new commentary is added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [commentary]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'highlight':
        return <Zap className="h-4 w-4 text-sports-highlight" />;
      case 'alert':
        return <MessageCircle className="h-4 w-4 text-sports-accent" />;
      default:
        return <MessageCircle className="h-4 w-4 text-sports-secondary" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'highlight':
        return (
          <Badge variant="secondary" className="bg-sports-highlight/20 text-sports-highlight border-sports-highlight/30">
            Highlight
          </Badge>
        );
      case 'alert':
        return (
          <Badge variant="secondary" className="bg-sports-accent/20 text-sports-accent border-sports-accent/30">
            Alert
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="h-full bg-commentary-bg border-commentary-border">
      <div className="p-4 border-b border-commentary-border">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-sports-primary rounded-full animate-pulse-glow"></div>
          <h3 className="font-semibold text-foreground">Live AI Commentary</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time AI analysis and insights
        </p>
      </div>
      
      <div 
        ref={scrollRef}
        className="h-96 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-commentary-border scrollbar-track-transparent"
      >
        {commentary.map((item) => (
          <div
            key={item.id}
            className="flex items-start space-x-3 p-3 rounded-lg bg-card/50 border border-border/50 animate-slide-up"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getTypeIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {item.timestamp}
                </span>
                {getTypeBadge(item.type)}
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {item.text}
              </p>
            </div>
          </div>
        ))}
        
        {commentary.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                AI commentary will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};