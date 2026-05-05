// src/hooks/useCloudinaryUpload.ts
import { useState, useCallback } from 'react';

interface UploadOptions {
  folder: string;
  publicId?: string;
  resourceType?: 'image' | 'raw' | 'auto';
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  url: string;
  publicId: string;
}

export function useCloudinaryUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, options: UploadOptions): Promise<UploadResult | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Get signature from our API
        const signatureRes = await fetch('/api/cloudinary/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folder: options.folder,
            publicId: options.publicId,
            resourceType: options.resourceType || 'image',
          }),
        });

        if (!signatureRes.ok) {
          throw new Error('Failed to get upload signature');
        }

        const { signature, timestamp, cloudName, apiKey, folder, publicId } =
          await signatureRes.json();

        // Prepare form data for Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp.toString());
        formData.append('api_key', apiKey);
        formData.append('folder', folder);

        if (publicId) {
          formData.append('public_id', publicId);
        }

        // Upload directly to Cloudinary using XMLHttpRequest for progress tracking
        const result = await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setProgress(percentComplete);
              options.onProgress?.(percentComplete);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              resolve({
                url: response.secure_url,
                publicId: response.public_id,
              });
            } else {
              reject(new Error('Upload failed'));
            }
          };

          xhr.onerror = () => reject(new Error('Upload failed'));

          const resourceType = options.resourceType || 'image';
          xhr.open(
            'POST',
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
          );
          xhr.send(formData);
        });

        setIsUploading(false);
        setProgress(100);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        setIsUploading(false);
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
  };
}

// Utility function for direct upload without hook (for multiple files)
export async function uploadToCloudinaryClient(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  // Get signature from our API
  const signatureRes = await fetch('/api/cloudinary/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folder: options.folder,
      publicId: options.publicId,
      resourceType: options.resourceType || 'image',
    }),
  });

  if (!signatureRes.ok) {
    throw new Error('Failed to get upload signature');
  }

  const { signature, timestamp, cloudName, apiKey, folder, publicId } =
    await signatureRes.json();

  // Prepare form data for Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', signature);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', apiKey);
  formData.append('folder', folder);

  if (publicId) {
    formData.append('public_id', publicId);
  }

  const resourceType = options.resourceType || 'image';
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const result = await response.json();
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}
