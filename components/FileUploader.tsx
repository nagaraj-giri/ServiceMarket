
import React, { useState, useRef } from 'react';
import { api } from '../services/api';

interface FileUploaderProps {
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  label: string;
  variant?: 'circular' | 'square' | 'banner';
  helperText?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  currentImageUrl, 
  onUploadComplete, 
  label, 
  variant = 'square',
  helperText = 'Click image to upload. JPG or PNG, max 2MB.'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use a fallback image if current is empty
  const displayImage = currentImageUrl || 'https://via.placeholder.com/150?text=Upload';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setErrorMessage(null);

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file (JPG, PNG).');
      return;
    }

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
         msg = `Permission Denied. Check console for CORS fix.`;
      }
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Dimensions based on variant
  const containerClasses = {
    circular: 'w-24 h-24 rounded-full',
    square: 'w-24 h-24 rounded-lg',
    banner: 'w-48 h-24 rounded-lg'
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-6">
        <div 
          className={`relative group cursor-pointer overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0 shadow-sm hover:border-dubai-gold transition-colors ${containerClasses[variant]}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <img 
            src={displayImage} 
            alt={label} 
            className="w-full h-full object-cover transition-opacity group-hover:opacity-75" 
          />
          
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-dubai-gold animate-spin mb-2"></div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900">{label}</h3>
          <p className="text-xs text-gray-500 mb-2">
            {isUploading ? 'Uploading...' : helperText}
          </p>
          <button 
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-blue-600 font-bold hover:text-blue-700 hover:underline"
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
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 mt-1">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
