import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Maximize, SkipBack } from 'lucide-react';

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

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        xhrSetup: (xhr, url) => {
          // Add headers to help with CORS
          xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        }
      });
      
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS stream loaded successfully');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error encountered, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal media error encountered, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Fatal error, cannot recover');
              hls.destroy();
              // Try direct video src as fallback
              if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      console.error('HLS is not supported in this browser');
    }

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
      />
      
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