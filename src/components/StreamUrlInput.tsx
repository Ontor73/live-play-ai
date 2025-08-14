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
  image: string;
  isLive: boolean;
  channel: string;
  description: string;
}

interface StreamUrlInputProps {
  onStreamLoad: (url: string, title?: string) => void;
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
      
      const streamList: StreamData[] = [];
      
      if (data && data.matches && Array.isArray(data.matches)) {
        data.matches.forEach((match: any, index: number) => {
          // Try multiple URL fields in order of preference
          const streamUrl = match.video_url || match.dai_url || match.pub_url;
          
          if (streamUrl) {
            streamList.push({
              id: `match-${index}`,
              title: match.match_name || match.event_name || `${match.event_category} Match`,
              url: streamUrl,
              category: match.event_category || 'Sports',
              image: match.src || '',
              isLive: match.isLive || false,
              channel: match.broadcast_channel || 'Unknown',
              description: match.event_name || ''
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

    onStreamLoad(url, '');
  };

  const handleQuickLoad = (url: string, title: string = '') => {
    setSelectedStream(url);
    onStreamLoad(url, title);
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

        {/* Live Streams Grid */}
        {!loadingStreams && streams.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center space-x-2">
              <span>Available Sports Streams</span>
              <div className="h-2 w-2 bg-sports-primary rounded-full animate-pulse-glow"></div>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {streams.map((stream) => (
                <Card
                  key={stream.id}
                  className="cursor-pointer hover:border-sports-primary/50 transition-all duration-300 overflow-hidden group bg-card/50"
                  onClick={() => handleQuickLoad(stream.url, stream.title)}
                >
                  <div className="relative">
                    {stream.image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={stream.image}
                          alt={stream.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    {stream.isLive && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold animate-pulse">
                        LIVE
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-sports-primary/20 backdrop-blur-sm text-sports-primary px-2 py-1 rounded text-xs">
                      {stream.category}
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-sports-primary transition-colors">
                      {stream.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {stream.channel}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {stream.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full opacity-0 group-hover:opacity-100 transition-opacity text-sports-primary hover:text-sports-primary-glow"
                      disabled={isLoading}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Watch Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stream Selector Dropdown (as backup) */}
        {!loadingStreams && streams.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Or Select from Dropdown</h3>
            <Select value={selectedStream} onValueChange={setSelectedStream}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a live sports stream" />
              </SelectTrigger>
              <SelectContent>
                {streams.map((stream) => (
                  <SelectItem key={stream.id} value={stream.url}>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        stream.isLive 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-sports-primary/20 text-sports-primary'
                      }`}>
                        {stream.isLive ? 'LIVE' : stream.category}
                      </span>
                      <span className="truncate">{stream.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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