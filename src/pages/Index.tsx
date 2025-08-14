import { useState } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CommentaryPanel } from '@/components/CommentaryPanel';
import { HighlightsSection } from '@/components/HighlightsSection';
import { StreamUrlInput } from '@/components/StreamUrlInput';

const Index = () => {
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const handleStreamLoad = (url: string) => {
    setIsLoading(true);
    setStreamUrl(url);
    // Simulate loading time
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleSeekTo = (timestamp: number) => {
    setSeekTo(timestamp);
    // Reset seekTo after a brief moment to allow for multiple seeks to the same timestamp
    setTimeout(() => setSeekTo(undefined), 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {!streamUrl ? (
          <div className="max-w-2xl mx-auto mt-20">
            <StreamUrlInput onStreamLoad={handleStreamLoad} isLoading={isLoading} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                AI Sports Streamer
              </h1>
              <p className="text-muted-foreground">
                Live sports streaming with AI-powered insights
              </p>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Video Player - Takes up 3/4 of the width on large screens */}
              <div className="lg:col-span-3 space-y-4">
                <VideoPlayer
                  src={streamUrl}
                  onTimeUpdate={setCurrentTime}
                  seekTo={seekTo}
                />
                
                {/* Stream Controls */}
                <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-sports-primary rounded-full animate-pulse-glow"></div>
                    <span className="font-medium text-foreground">Live Stream Active</span>
                  </div>
                  <button
                    onClick={() => {
                      setStreamUrl('');
                      setCurrentTime(0);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change Stream
                  </button>
                </div>
              </div>

              {/* Commentary Panel - Takes up 1/4 of the width on large screens */}
              <div className="lg:col-span-1">
                <CommentaryPanel />
              </div>
            </div>

            {/* Highlights Section */}
            <HighlightsSection onSeekTo={handleSeekTo} currentTime={currentTime} />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
