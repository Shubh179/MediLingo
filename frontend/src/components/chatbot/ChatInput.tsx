import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Trash2, Pause, Play, Send as SendIcon } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendVoiceBlob?: (blob: Blob) => void;
  isLoading?: boolean;
  autoStartVoice?: boolean;
}

const ChatInput = ({ onSendMessage, onSendVoiceBlob, isLoading, autoStartVoice }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const autoSendAfterStop = useRef<boolean>(false);

  const handleSend = () => {
    // If recording, stop and auto-send the voice
    if (isRecording) {
      autoSendAfterStop.current = true;
      stopRecording();
      return;
    }
    
    // If we have a recorded blob, send it
    if (recordedBlob) {
      onSendVoiceBlob?.(recordedBlob);
      setRecordedBlob(null);
      setElapsedMs(0);
      return;
    }
    
    // Otherwise send text
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      streamRef.current = stream;
      chunksRef.current = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        setRecordedBlob(blob);
        
        // Auto-send if send button was clicked during recording
        if (autoSendAfterStop.current) {
          autoSendAfterStop.current = false;
          setTimeout(() => {
            onSendVoiceBlob?.(blob);
            setRecordedBlob(null);
            setElapsedMs(0);
          }, 0);
        }
      };
      recorder.start();
      setIsRecording(true);
      setElapsedMs(0);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => setElapsedMs((t) => t + 200), 200);

      // Visualizer setup
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const draw = () => {
        if (!canvasRef.current || !analyserRef.current) {
          rafRef.current = requestAnimationFrame(draw);
          return;
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          rafRef.current = requestAnimationFrame(draw);
          return;
        }
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 0.9;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255;
          const barHeight = v * canvas.height;
          ctx.fillStyle = '#6B7280'; // gray-500
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
        rafRef.current = requestAnimationFrame(draw);
      };
      rafRef.current = requestAnimationFrame(draw);
    } catch (err) {
      console.error('Mic access error:', err);
    }
  };

  const stopRecording = () => {
    try {
      const r = recorderRef.current;
      if (r && r.state !== 'inactive') {
        r.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    } finally {
      setIsRecording(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      setIsPaused(false);
    }
  };

  const toggleMic = () => {
    if (isLoading) return;
    if (!isRecording) startRecording(); else stopRecording();
  };

  useEffect(() => {
    if (autoStartVoice && !isRecording && !recordedBlob) {
      startRecording();
    }
  }, [autoStartVoice]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const sendRecordedBlob = () => {
    if (!recordedBlob || isLoading) return;
    onSendVoiceBlob?.(recordedBlob);
    setRecordedBlob(null);
    setElapsedMs(0);
  };

  const discardRecordedBlob = () => {
    setRecordedBlob(null);
    setElapsedMs(0);
  };

  const discardRecordingSession = () => {
    stopRecording();
    setRecordedBlob(null);
    setElapsedMs(0);
  };

  const pauseRecording = () => {
    const r = recorderRef.current;
    if (!r || r.state !== 'recording') return;
    r.pause();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    const r = recorderRef.current;
    if (!r || r.state !== 'paused') return;
    r.resume();
    setIsPaused(false);
  };

  return (
    <div className="border-t border-gray-200 bg-white px-6 py-4">
      <div className="flex gap-3 max-w-4xl mx-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about medications, dosages, schedules..."
          disabled={isLoading}
          className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-primary"
        />
        <Button
          onClick={handleSend}
          disabled={(!input.trim() && !isRecording && !recordedBlob) || isLoading}
          size="icon"
          className="bg-primary hover:bg-primary/90 text-white flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
        <Button
          onClick={toggleMic}
          disabled={isLoading}
          size="icon"
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-200 hover:bg-gray-300'} text-gray-900 flex-shrink-0`}
        >
          {/* Mic emoji per request */}
          <span className="text-lg">🎤</span>
        </Button>
      </div>
      {isRecording && (
        <div className="max-w-4xl mx-auto mt-2 text-sm flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-md px-3 py-2">
          <button
            className="text-gray-600 hover:text-gray-800"
            title="Discard"
            onClick={discardRecordingSession}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <span className="text-red-600">Recording...</span>
          <span className="text-gray-600">{formatElapsed(elapsedMs)}</span>
          <canvas ref={canvasRef} width={180} height={24} className="flex-1 h-6" />
          {isPaused ? (
            <button
              className="text-gray-700 hover:text-gray-900"
              onClick={resumeRecording}
              title="Resume"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="text-gray-700 hover:text-gray-900"
              onClick={pauseRecording}
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {!isRecording && recordedBlob && (
        <div className="max-w-4xl mx-auto mt-2 text-sm flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-md px-3 py-2">
          <Trash2 className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">Voice ready - Click send to submit</span>
          <span className="text-gray-600">{formatElapsed(elapsedMs)}</span>
          <canvas ref={canvasRef} width={180} height={24} className="flex-1 h-6" />
          <button
            onClick={discardRecordedBlob}
            className="text-gray-700 hover:text-gray-900"
            title="Discard"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
