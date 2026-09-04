import { createContext, useState } from 'react';

export const UploadContext = createContext({
  uploads: [],
  addUpload: () => {},
  updateUploadProgress: () => {},
  removeUpload: () => {},
});

export const UploadProvider = ({ children }) => {
  const [uploads, setUploads] = useState([]);

  // Add a new upload task with file name
  const addUpload = (id, fileName) => {
    setUploads((prev) => [...prev, { id, fileName, progress: 0 }]);
  };

  // Update the progress of an existing upload task
  const updateUploadProgress = (id, progress) => {
    setUploads((prev) =>
      prev.map((upload) => (upload.id === id ? { ...upload, progress } : upload))
    );
  };

  // Remove the upload task when it's completed
  const removeUpload = (id) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
  };

  return (
    <UploadContext.Provider value={{ uploads, addUpload, updateUploadProgress, removeUpload }}>
      {children}
    </UploadContext.Provider>
  );
};
