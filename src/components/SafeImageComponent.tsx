'use client';

import React from 'react';
import { createSafeImageProps, PLACEHOLDER_IMAGE_DATA_URL } from '@/utils/imageUtils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

/**
 * A component that safely renders images with fallback for Firebase Storage URLs
 * and handles loading errors
 */
const SafeImage: React.FC<SafeImageProps> = (props) => {
  const imageProps = createSafeImageProps(props);
  
  return <img {...imageProps} />;
};

export default SafeImage; 