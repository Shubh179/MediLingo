import { Camera, Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrescriptionUploadProps {
  onCameraClick: () => void;
  onUploadClick: () => void;
}

const PrescriptionUpload = ({ onCameraClick, onUploadClick }: PrescriptionUploadProps) => {
  return (
    <div className="text-center py-4 px-5 w-full relative">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2" style={{ lineHeight: '1.5' }}>
          Your Health, Deciphered
        </h1>
        <p className="max-w-2xl mx-auto text-gray-600 text-xs md:text-sm mb-5" style={{ lineHeight: '1.5' }}>
        Transform handwritten prescriptions into clear, personalized medication
        guidance in your language
      </p>

      <div className="relative max-w-xl w-full mx-auto p-8 rounded-3xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
        {/* Icon circle */}
        <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <Image className="w-12 h-12 text-primary" strokeWidth={2} />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-3" style={{ lineHeight: '1.5' }}>
          Drop or Scan Prescription
        </h3>
        <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto" style={{ lineHeight: '1.5' }}>
          Take a photo of your prescription or upload an image file
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Button
            onClick={onCameraClick}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl font-semibold gap-2 text-base shadow-lg hover:shadow-xl transition-all"
          >
            <Camera className="w-5 h-5" />
            Take Photo
          </Button>
          <Button
            onClick={onUploadClick}
            variant="outline"
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-6 rounded-xl font-semibold gap-2 text-base shadow-sm hover:shadow-md transition-all"
          >
            <Upload className="w-5 h-5" />
            Upload File
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUpload;

