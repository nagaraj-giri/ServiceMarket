
import React, { useState, useRef } from 'react';

interface FileUploaderProps {
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  label: string;
  isCircular?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ currentImageUrl, onUploadComplete, label, isCircular = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use a fallback image if current is empty
  const displayImage = currentImageUrl || 'https://via.placeholder.com/150?text=Upload';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG).');
      return;
    }

    // Validate size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit.');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    // SIMULATE UPLOAD PROCESS (This would be Firebase Storage uploadTask)
    const totalSteps = 10;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const newProgress = Math.round((currentStep / totalSteps) * 100);
      setProgress(newProgress);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        
        // Mock successful upload response
        // In real Firebase, this would be: const url = await getDownloadURL(snapshot.ref);
        
        // We create a fake local URL for preview purposes in this mock environment
        // Or generate a random avatar URL to simulate a "new" file on a server
        const mockServerUrl = URL.createObjectURL(file); 
        
        onUploadComplete(mockServerUrl);
        setIsUploading(false);
      }
    }, 200); // 200ms * 10 steps = 2 seconds upload time
  };

  return (
    <div className="flex items-center gap-6">
      <div className={`relative group cursor-pointer overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 ${isCircular ? 'w-24 h-24 rounded-full' : 'w-32 h-24 rounded-lg'}`}
           onClick={() => !isUploading && fileInputRef.current?.click()}>
        
        <img 
          src={displayImage} 
          alt={label} 
          className="w-full h-full object-cover transition-opacity group-hover:opacity-75" 
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
            <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-dubai-gold animate-spin mb-2"></div>
            <span className="text-white text-xs font-bold">{progress}%</span>
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900">{label}</h3>
        <p className="text-sm text-gray-500 mb-2">
          {isUploading ? 'Uploading to secure storage...' : 'Click image to upload. JPG or PNG, max 2MB.'}
        </p>
        <button 
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-dubai-blue font-bold hover:underline"
        >
          {currentImageUrl ? 'Change Image' : 'Upload Image'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/png, image/jpeg"
        />
      </div>
    </div>
  );
};

export default FileUploader;
