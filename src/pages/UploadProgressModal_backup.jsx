import React, { useContext } from 'react';
import { UploadContext } from './UploadContext';


const UploadProgressModal = () => {
  const { uploads } = useContext(UploadContext);

  return (
    <>
      {uploads.map((upload) => (
        <div key={upload.id} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></div>
              <h3 className="text-lg font-semibold">Uploading {upload.fileName}...</h3>
            </div>

            {/* Progress bar container */}
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${upload.progress}%` }}
              />
            </div>

            {/* Progress percentage */}
            <p className="text-center mt-2 text-gray-600">
              {Math.round(upload.progress)}% Complete
            </p>

            {/* Alternate progress bar representation */}
            
          </div>
        </div>
      ))}
    </>
  );
};

export default UploadProgressModal;

