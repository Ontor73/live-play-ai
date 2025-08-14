import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, ExternalLink, Info } from 'lucide-react';

interface IframePlayerProps {
  src: string;
  title: string;
}

export const IframePlayer = ({ src, title }: IframePlayerProps) => {
  const [showInfo, setShowInfo] = useState(false);

  // Try to extract iframe-friendly URLs or create embed versions
  const getEmbedUrl = (url: string) => {
    // For YouTube Live streams
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId[1]}?autoplay=1&controls=1`;
      }
    }
    
    // For other M3U8 streams, try Video.js CDN player
    const encodedUrl = encodeURIComponent(url);
    return `https://video-dev.github.io/hls.js/stable/demo/?src=${encodedUrl}`;
  };

  const embedUrl = getEmbedUrl(src);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Alternative Player</h3>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4 mr-2" />
                Stream Info
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stream Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Stream Title:</label>
                  <p className="text-sm text-muted-foreground">{title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Stream URL:</label>
                  <p className="text-xs text-muted-foreground break-all">{src}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Embed URL:</label>
                  <p className="text-xs text-muted-foreground break-all">{embedUrl}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(src, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Direct
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <iframe
          src={embedUrl}
          className="w-full aspect-video border-0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media"
          title={title}
          onError={(e) => {
            console.error('Iframe error:', e);
          }}
        />
      </Card>
      
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          If the stream doesn't load, try opening it directly or use a different browser.
        </p>
        <div className="flex justify-center space-x-2">
          <Badge variant="outline">HLS.js Player</Badge>
          <Badge variant="outline">Cross-Origin Enabled</Badge>
          <Badge variant="outline">Autoplay</Badge>
        </div>
      </div>
    </div>
  );
};