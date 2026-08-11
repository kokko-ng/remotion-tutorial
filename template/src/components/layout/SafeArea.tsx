import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';

/**
 * Content container with the 5% safe margin. Scenes place their content
 * inside a SafeArea; absolutely positioned children are relative to it.
 */
export const SafeArea: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        left: width * 0.05,
        top: height * 0.05,
        width: width * 0.9,
        height: height * 0.9,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
