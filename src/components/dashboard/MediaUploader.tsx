'use client';

import { useState, useRef } from 'react';
import { XMarkIcon, PhotoIcon, FilmIcon } from '@/components/icons';

interface MediaUploaderProps {
  existingMedia?: string[];
  onMediaChange: (mediaUrls: string[]) => void;
  folderPath?: string;
}

export default function MediaUploader({ existingMedia = [], onMediaChange, folderPath }: MediaUploaderProps) {
  const [mediaUrls, setMediaUrls] = useState<string[]>(existingMedia);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    const files = Array.from(e.target.files);
    const newUrls: string[] = [];
    
    try {
      for (const file of files) {
        // Check file size - limit to 5MB for this example
        if (file.size > 5 * 1024 * 1024) {
          setError(`File ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }
        
        // Convert file to base64
        const base64 = await convertFileToBase64(file);
        newUrls.push(base64);
      }
      
      const updatedUrls = [...mediaUrls, ...newUrls];
      setMediaUrls(updatedUrls);
      onMediaChange(updatedUrls);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    const updatedUrls = mediaUrls.filter((_, i) => i !== index);
    setMediaUrls(updatedUrls);
    onMediaChange(updatedUrls);
  };

  const isVideoUrl = (url: string): boolean => {
    // Check if it's a base64 video
    if (url.startsWith('data:video/')) {
      return true;
    }
    
    // Check common video extensions and platforms
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const videoPlatforms = ['youtube.com', 'youtu.be', 'vimeo.com'];
    
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
           videoPlatforms.some(platform => lowerUrl.includes(platform));
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              multiple
              className="sr-only"
              id="media-upload"
            />
            <label
              htmlFor="media-upload"
              className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PhotoIcon className="h-4 w-4 inline mr-1" />
              Choose Files
            </label>
            
            {uploading && (
              <div className="ml-3 flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-2"></div>
                Uploading...
              </div>
            )}
          </div>
          
          {error && (
            <p className="ml-3 text-sm text-red-600">{error}</p>
          )}
        </div>
        
        <p className="mt-1 text-xs text-gray-500">
          Upload images or videos (max 5MB each).
        </p>
      </div>
      
      {mediaUrls.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Media</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative group">
                {isVideoUrl(url) ? (
                  <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex flex-col items-center justify-center">
                    <FilmIcon className="h-8 w-8 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Video</span>
                  </div>
                ) : (
                  <div className="h-32 relative">
                    <img 
                      src={url} 
                      alt={`Media ${index}`} 
                      className="h-full w-full object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.png';
                      }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 