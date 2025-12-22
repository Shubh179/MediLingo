import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Image, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface PhotoUploadProps {
  onUpload: (file: File) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const PhotoUpload = ({ onUpload, onCancel, isProcessing = false }: PhotoUploadProps) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview('pdf');
      }
      onUpload(file);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col slide-in-bottom">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-secondary">{t.upload.title}</h2>
          <p className="text-sm text-muted-foreground">{t.upload.subtitle}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          aria-label={t.upload.cancel}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col gap-5">
        {isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <p className="text-lg font-medium text-secondary">{t.upload.processing}</p>
          </div>
        ) : preview ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {preview === 'pdf' ? (
              <div className="w-40 h-52 rounded-3xl bg-muted flex flex-col items-center justify-center gap-3">
                <FileText className="w-16 h-16 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">PDF</span>
              </div>
            ) : (
              <img 
                src={preview} 
                alt="Prescription preview" 
                className="max-h-[50vh] rounded-3xl shadow-elevated object-contain"
              />
            )}
            <p className="text-lg font-medium text-primary">{t.upload.success}</p>
          </div>
        ) : (
          <>
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                <Image className="w-10 h-10 text-primary" />
              </div>
              <p className="text-lg font-medium text-muted-foreground text-center px-4">
                {t.upload.dragDrop}
              </p>
              <p className="text-sm text-muted-foreground">{t.upload.supportedFormats}</p>
            </div>

            <p className="text-center text-muted-foreground font-medium">{t.upload.or}</p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                variant="touch" 
                size="lg" 
                onClick={() => cameraInputRef.current?.click()}
                className="w-full"
              >
                <Camera className="w-6 h-6" />
                {t.upload.takePhoto}
              </Button>

              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-6 h-6" />
                {t.upload.chooseFile}
              </Button>
            </div>

            {/* Hidden Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-border">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="w-full"
        >
          {t.upload.cancel}
        </Button>
      </div>
    </div>
  );
};

export default PhotoUpload;
