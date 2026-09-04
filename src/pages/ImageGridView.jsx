import React, { useState, useRef, useEffect } from "react";

function ImageGridView({
  filedata,
  onFileClick,
  apiUrl,
  token,
  isSharedValue,
  filenameRedux,
}) {
  const imageTypes = ["jpeg", "jpg", "png", "gif", "heic", "hevc", "heif", "svg", "webp", "avif"];

  const imageFiles = (filedata || []).filter(
    (f) =>
      !f.isFolder &&
      f.fileType &&
      imageTypes.includes(f.fileType.toLowerCase())
  );

  if (!imageFiles.length) {
    return (
      <div style={{ padding: "16px", textAlign: "center", color: "#777", fontSize: "14px" }}>
        No images found in this folder.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#00000070",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 5000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          padding: "24px 16px 16px",
          width: "90vw",
          height: "85vh",
          backgroundColor: "white",
          borderRadius: "30px",
          zIndex: 5010,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Scrollable grid area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px",
              paddingBottom: "16px",
            }}
          >
            {imageFiles.map((file) => {
              const fileKey = file.fileName;
              const base = `${apiUrl}getFileDefault?token=${token}&filePath=${encodeURIComponent(
                fileKey
              )}`;
              const fullSrc = isSharedValue
                ? `${base}&shared=${encodeURIComponent(filenameRedux)}`
                : base;

              return (
                <ImageCard
                  key={file.fileName}
                  file={file}
                  fullSrc={fullSrc}
                  onClick={() => {
                    if (onFileClick) onFileClick(file);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageCard({ file, fullSrc, onClick }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "200px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#f3f3f3",
        cursor: "pointer",
        height: 0,
        paddingBottom: "100%",
      }}
    >
      {!isLoaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, #f3f3f3 0%, #ececec 50%, #f3f3f3 100%)",
            backgroundSize: "200px 100%",
            animation: "imageShimmer 1.3s infinite",
          }}
        />
      )}

      <img
        ref={imgRef}
        src={shouldLoad ? fullSrc : undefined}
        alt={file.fileName}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.2s ease-out",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "6px 8px",
          background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.65))",
          color: "#fff",
          fontSize: "11px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={file.fileName}
      >
        {file.fileName}
      </div>

      <style>
        {`
          @keyframes imageShimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
          }
        `}
      </style>
    </div>
  );
}

export default ImageGridView;
