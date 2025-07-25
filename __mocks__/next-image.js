/**
 * Next.js Image Mock
 * Mock implementation of Next.js Image component for testing
 */

import React from 'react';

const NextImage = ({ src, alt, ...props }) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} {...props} />;
};

export default NextImage;
