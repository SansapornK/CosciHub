import imageCompression from 'browser-image-compression';

export const convertToWebP = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1,            
    maxWidthOrHeight: 1920,  
    useWebWorker: true,
    fileType: 'image/webp'   
  };
  
  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], `${file.name.split('.')[0]}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Image conversion error:", error);
    return file; 
  }
};