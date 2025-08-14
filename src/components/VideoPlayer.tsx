import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Maximize, SkipBack, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  seekTo?: number;
}

export const VideoPlayer = ({ src, onTimeUpdate, seekTo }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);

    console.log('Loading stream:', src);

    // Try multiple approaches for different stream types
    const loadStream = async () => {
      try {
        // Method 1: Try HLS.js first
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            xhrSetup: (xhr, url) => {
              xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
              xhr.setRequestHeader('Referer', 'https://www.sonyliv.com/');
              xhr.timeout = 10000;
            }
          });
          
          hlsRef.current = hls;
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS stream loaded successfully');
            setIsLoading(false);
            setHasError(false);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log('Fatal network error, trying to recover...');
                  setErrorMessage('Network error, attempting recovery...');
                  setTimeout(() => {
                    if (hlsRef.current) {
                      hlsRef.current.startLoad();
                    }
                  }, 1000);
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('Fatal media error, trying to recover...');
                  setErrorMessage('Media error, attempting recovery...');
                  hls.recoverMediaError();
                  break;
                default:
                  console.log('Fatal error, cannot recover:', data);
                  setHasError(true);
                  setErrorMessage(`Stream error: ${data.details}`);
                  setIsLoading(false);
                  
                  // Try fallback methods
                  tryFallbackMethods();
                  break;
              }
            }
          });

          hls.loadSource(src);
          hls.attachMedia(video);
          
        } else {
          // Method 2: Native browser support
          tryNativePlayback();
        }
      } catch (error) {
        console.error('Error loading stream:', error);
        tryFallbackMethods();
      }
    };

    const tryNativePlayback = () => {
      console.log('Trying native video playback...');
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.load();
        setIsLoading(false);
      } else {
        tryFallbackMethods();
      }
    };

    const tryFallbackMethods = () => {
      console.log('Trying fallback methods...');
      setErrorMessage('Trying alternative playback methods...');
      
      // Method 3: Try with different CORS settings
      const corsProxy = `https://cors-anywhere.herokuapp.com/${src}`;
      
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = corsProxy;
        video.load();
      } else {
        // Method 4: Direct URL without proxy
        video.src = src;
        video.load();
      }
      
      setIsLoading(false);
    };

    // Handle video events
    video.addEventListener('loadstart', () => {
      console.log('Video load started');
      setIsLoading(true);
    });

    video.addEventListener('canplay', () => {
      console.log('Video can play');
      setIsLoading(false);
      setHasError(false);
    });

    video.addEventListener('error', (e) => {
      console.error('Video error:', e);
      setHasError(true);
      setErrorMessage('Failed to load video stream');
      setIsLoading(false);
    });

    loadStream();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

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
      videoRef.current.play();
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
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

  const retryStream = () => {
    setHasError(false);
    setErrorMessage('');
    // Trigger a re-render to retry loading
    const currentSrc = src;
    if (videoRef.current) {
      videoRef.current.src = '';
      setTimeout(() => {
        // Re-trigger the useEffect
        window.location.reload();
      }, 100);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="relative bg-video-bg rounded-lg overflow-hidden group"
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
        <div className="absolute inset-0 bg-video-bg/90 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sports-primary mx-auto mb-4"></div>
            <p className="text-white">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-video-bg/90 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Stream Error</h3>
              <p className="text-red-400 mb-4">{errorMessage}</p>
              <Button
                onClick={retryStream}
                className="bg-sports-primary hover:bg-sports-primary-glow text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Stream
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Video Controls Overlay */}
      <div className={`absolute inset-0 bg-video-overlay transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlay}
            className="bg-video-controls/50 hover:bg-video-controls/70 text-white border-none backdrop-blur-sm"
          >
            {isPlaying ? (
              <Pause className="h-12 w-12" />
            ) : (
              <Play className="h-12 w-12 ml-1" />
            )}
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-video-bg/90 to-transparent p-4">
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
              className="w-full h-1 bg-sports-primary/30 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, hsl(var(--sports-primary)) 0%, hsl(var(--sports-primary)) ${(currentTime / duration) * 100}%, hsl(var(--sports-primary) / 0.3) ${(currentTime / duration) * 100}%, hsl(var(--sports-primary) / 0.3) 100%)`
              }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:text-sports-primary-glow"
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
                className="text-white hover:text-sports-primary-glow"
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
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-sports-primary/30 rounded-lg appearance-none cursor-pointer"
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
              className="text-white hover:text-sports-primary-glow"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};