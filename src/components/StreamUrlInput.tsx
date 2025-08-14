import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Loader2, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamData {
  id: string;
  title: string;
  url: string;
  category: string;
}

interface StreamUrlInputProps {
  onStreamLoad: (url: string) => void;
  isLoading: boolean;
}

export const StreamUrlInput = ({ onStreamLoad, isLoading }: StreamUrlInputProps) => {
  const [customUrl, setCustomUrl] = useState('');
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [loadingStreams, setLoadingStreams] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/abid58b/SonyLivPlayList/refs/heads/main/sonyliv.json');
      const data = await response.json();
      
      // Transform the data structure based on what we expect from the JSON
      const streamList: StreamData[] = [];
      
      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([category, channels]: [string, any]) => {
          if (Array.isArray(channels)) {
            channels.forEach((channel: any, index: number) => {
              if (channel.url) {
                streamList.push({
                  id: `${category}-${index}`,
                  title: channel.name || channel.title || `Channel ${index + 1}`,
                  url: channel.url,
                  category: category
                });
              }
            });
          }
        });
      }
      
      setStreams(streamList);
      toast({
        title: "Streams loaded",
        description: `Found ${streamList.length} available streams`,
      });
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      toast({
        title: "Warning",
        description: "Could not load stream list. You can still enter a custom M3U8 URL.",
        variant: "destructive"
      });
    } finally {
      setLoadingStreams(false);
    }
  };

  const handleLoadStream = () => {
    const url = selectedStream || customUrl;
    
    if (!url) {
      toast({
        title: "No stream selected",
        description: "Please select a stream or enter a custom M3U8 URL",
        variant: "destructive"
      });
      return;
    }

    if (!url.includes('.m3u8') && !url.includes('m3u8')) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid M3U8 stream URL",
        variant: "destructive"
      });
      return;
    }

    onStreamLoad(url);
  };

  const handleQuickLoad = (url: string) => {
    setSelectedStream(url);
    onStreamLoad(url);
  };

  return (
    <Card className="p-6 bg-card/50 border-border/50">
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Radio className="h-6 w-6 text-sports-primary" />
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Sports Streamer
            </h2>
          </div>
          <p className="text-muted-foreground">
            Experience live sports with AI-powered commentary and highlights
          </p>
        </div>

        {/* Predefined Streams */}
        {!loadingStreams && streams.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Available Sports Streams</h3>
            <Select value={selectedStream} onValueChange={setSelectedStream}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a live sports stream" />
              </SelectTrigger>
              <SelectContent>
                {streams.slice(0, 20).map((stream) => (
                  <SelectItem key={stream.id} value={stream.url}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 bg-sports-primary/20 text-sports-primary rounded">
                        {stream.category}
                      </span>
                      <span>{stream.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Quick Load Buttons */}
        {!loadingStreams && streams.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Quick Load:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {streams.slice(0, 6).map((stream) => (
                <Button
                  key={stream.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLoad(stream.url)}
                  className="justify-start text-left h-auto p-3 hover:border-sports-primary/50"
                  disabled={isLoading}
                >
                  <div className="truncate">
                    <div className="font-medium text-xs">{stream.title}</div>
                    <div className="text-xs text-muted-foreground">{stream.category}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Custom URL Input */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Or Enter Custom M3U8 URL</h3>
          <div className="flex space-x-2">
            <Input
              type="url"
              placeholder="https://example.com/stream.m3u8"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleLoadStream}
              disabled={isLoading || (!selectedStream && !customUrl)}
              className="bg-gradient-primary hover:opacity-90 text-white border-none"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Load Stream
            </Button>
          </div>
        </div>

        {loadingStreams && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading available streams...</span>
          </div>
        )}
      </div>
    </Card>
  );
};