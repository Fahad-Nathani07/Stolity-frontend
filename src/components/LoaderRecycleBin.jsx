// src/components/Loader.jsx
import React from 'react';
import Lottie from 'lottie-react';
// import loaderAnimation from '../loader/Loader1.json';
import loaderAnimation from '../loader/Temp Delete.json';

const LoaderRecycleBin = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      // cursor:"not-allowed"
      cursor:"wait"
    }}>
      <Lottie
        animationData={loaderAnimation}
        loop={true}
        autoplay={true}
        style={{ width: 150, height: 150 }}
      />
    </div>
  );
};

export default LoaderRecycleBin;
