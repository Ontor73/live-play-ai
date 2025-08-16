import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Pause, Volume2, Maximize, SkipBack, AlertCircle, RefreshCw, ExternalLink, Info, Settings } from 'lucide-react';


interface NSPlayerProps {
  src: string;
  title: string;
  onTimeUpdate?: (currentTime: number) => void;
  seekTo?: number;
}

export const NSPlayer = ({ src, title, onTimeUpdate, seekTo }: NSPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionMethod, setConnectionMethod] = useState('direct');
  

  // NS Player inspired connection methods
  const connectionMethods = [
    {
      id: 'direct',
      name: 'Direct Connection',
      headers: {
        'User-Agent': 'NSPlayer/1.0',
        'Accept': '*/*',
        'Connection': 'keep-alive',
      }
    },
    {
      id: 'android',
      name: 'Android Player',
      headers: {
        'User-Agent': 'ExoPlayerLib/2.18.1',
        'Accept': 'application/vnd.apple.mpegurl',
        'Accept-Encoding': 'gzip, deflate',
      }
    },
    {
      id: 'vlc',
      name: 'VLC Method',
      headers: {
        'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16',
        'Accept': '*/*',
        'Range': 'bytes=0-',
      }
    },
    {
      id: 'hls',
      name: 'HLS.js Enhanced',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36',
        'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, application/octet-stream',
        'Origin': 'https://www.sonyliv.com',
        'Referer': 'https://www.sonyliv.com/',
      }
    }
  ];

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);

    console.log(`NS Player: Loading stream with ${connectionMethod} method:`, src);

    const loadWithMethod = async () => {
      try {
        const method = connectionMethods.find(m => m.id === connectionMethod);
        
        // Create a new blob URL with custom headers simulation
        const proxyUrl = createProxyUrl(src, method?.headers || {});
        
        // Always try HLS first for m3u8 streams
        if (src.includes('.m3u8')) {
          await loadWithHLS(src);
        } else {
          await loadWithNative(src);
        }
        
      } catch (error) {
        console.error('NS Player: Error loading stream:', error);
        setHasError(true);
        setErrorMessage(`Failed to load with ${connectionMethod} method`);
        setIsLoading(false);
      }
    };

    const createProxyUrl = (url: string, headers: Record<string, string>) => {
      // Try direct connection first for HLS streams
      return url;
    };

    const loadWithHLS = async (url: string) => {
      try {
        // Import HLS.js dynamically
        const Hls = (await import('hls.js')).default;
        
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: 60,
            liveSyncDurationCount: 3,
            xhrSetup: (xhr, requestUrl) => {
              const method = connectionMethods.find(m => m.id === connectionMethod);
              if (method?.headers) {
                Object.entries(method.headers).forEach(([key, value]) => {
                  xhr.setRequestHeader(key, value);
                });
              }
              xhr.timeout = 15000;
            }
          });

          hls.loadSource(url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('NS Player: HLS stream loaded successfully');
            setIsLoading(false);
            setHasError(false);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error('NS Player: Fatal HLS error:', data);
              tryNextMethod();
            }
          });
        } else {
          throw new Error('HLS not supported');
        }
      } catch (error) {
        throw error;
      }
    };

    const loadWithNative = async (url: string) => {
      video.src = url;
      video.load();
      
      video.addEventListener('canplay', () => {
        console.log('NS Player: Native playback ready');
        setIsLoading(false);
        setHasError(false);
      }, { once: true });

      video.addEventListener('error', () => {
        throw new Error('Native playback failed');
      }, { once: true });
    };

    const tryNextMethod = () => {
      const currentIndex = connectionMethods.findIndex(m => m.id === connectionMethod);
      const nextIndex = (currentIndex + 1) % connectionMethods.length;
      
      if (nextIndex !== currentIndex) {
        setConnectionMethod(connectionMethods[nextIndex].id);
      } else {
        setHasError(true);
        setErrorMessage('All connection methods failed');
        setIsLoading(false);
      }
    };

    loadWithMethod();

    return () => {
      if (videoRef.current) {
        videoRef.current.src = '';
      }
    };
  }, [src, connectionMethod]);

  useEffect(() => {
    if (seekTo !== undefined && videoRef.current) {
      videoRef.current.currentTime = seekTo;
    }
  }, [seekTo]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error('Play failed:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    setCurrentTime(current);
    onTimeUpdate?.(current);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openInNewWindow = () => {
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; background: #000; }
            video { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <video controls autoplay>
            <source src="${src}" type="application/vnd.apple.mpegurl">
            Your browser does not support the video tag.
          </video>
        </body>
        </html>
      `);
    }
  };

  return (
    <Card className="overflow-hidden bg-card/90 backdrop-blur">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {connectionMethods.find(m => m.id === connectionMethod)?.name}
              </Badge>
              <Badge variant={isLoading ? "secondary" : hasError ? "destructive" : "default"} className="text-xs">
                {isLoading ? "Loading" : hasError ? "Error" : "Connected"}
              </Badge>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connection Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Connection Method:</label>
                    <div className="mt-2 space-y-2">
                      {connectionMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setConnectionMethod(method.id)}
                          className={`w-full text-left p-2 rounded border ${
                            connectionMethod === method.id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <div className="font-medium text-sm">{method.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {method.headers['User-Agent']}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" onClick={openInNewWindow}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div 
        className="relative bg-black group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          crossOrigin="anonymous"
          playsInline
          controls={false}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Connecting with {connectionMethods.find(m => m.id === connectionMethod)?.name}...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <div className="text-center space-y-4 text-white">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Connection Failed</h3>
                <p className="text-red-400 mb-4">{errorMessage}</p>
                <div className="space-x-2">
                  <Button
                    onClick={() => {
                      setHasError(false);
                      setIsLoading(true);
                    }}
                    variant="secondary"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button
                    onClick={() => {
                      const nextIndex = (connectionMethods.findIndex(m => m.id === connectionMethod) + 1) % connectionMethods.length;
                      setConnectionMethod(connectionMethods[nextIndex].id);
                    }}
                    variant="outline"
                  >
                    Try Next Method
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Video Controls */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlay}
              className="bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-sm"
            >
              {isPlaying ? (
                <Pause className="h-12 w-12" />
              ) : (
                <Play className="h-12 w-12 ml-1" />
              )}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = parseFloat(e.target.value);
                  }
                }}
                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:text-primary"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = Math.max(0, currentTime - 10);
                    }
                  }}
                  className="text-white hover:text-primary"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <div className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5 text-white" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setVolume(newVolume);
                      if (videoRef.current) {
                        videoRef.current.volume = newVolume;
                      }
                    }}
                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:text-primary"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};