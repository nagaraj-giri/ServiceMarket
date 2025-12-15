
import React, { useState, useRef } from 'react';
import { api } from '../services/api';

interface FileUploaderProps {
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  label: string;
  isCircular?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ currentImageUrl, onUploadComplete, label, isCircular = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use a fallback image if current is empty
  const displayImage = currentImageUrl || 'https://via.placeholder.com/150?text=Upload';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
    setErrorMessage(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file (JPG, PNG).');
      return;
    }

    // Validate size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('File size exceeds 2MB limit.');
      return;
    }

    setIsUploading(true);

    try {
      const downloadURL = await api.uploadFile(file);
      onUploadComplete(downloadURL);
    } catch (error: any) {
      console.error("Upload failed", error);
      
      let msg = error.message || 'Failed to upload image.';
      
      if (error.code === 'storage/unauthorized') {
         msg = `Access Denied. If you are on a custom domain, please configure CORS for your storage bucket. (Code: ${error.code})`;
      } else if (error.code === 'storage/retry-limit-exceeded') {
         msg = 'Network unstable. Upload failed after retries.';
      } else if (error.code === 'storage/canceled') {
         msg = 'Upload canceled.';
      }
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
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
              <span className="text-white text-xs font-bold">Uploading...</span>
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
      {errorMessage && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 mt-2">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
