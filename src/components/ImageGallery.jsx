import { useState } from "react";

const MediaGallery = ({ images }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);

  if (!images || images.length === 0) return null;

  const renderMedia = (url) => {
    if (url.includes('.mp4') || url.includes('video')) {
      return (
        <video 
          src={url}
          className="h-32 w-full object-cover rounded-md"
          controls
        />
      )
    } else if (url.includes('.mp3') || url.includes('audio')) {
      return (
        <audio 
          src={url}
          className="w-full mt-2"
          controls
        />
      )
    } else {
      return (
        <img
          src={url}
          alt="Media"
          className="h-32 w-full object-cover rounded-md"
        />
      )
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {images.map((url, index) => (
          <div
            key={index}
            className="relative cursor-pointer"
            onClick={() => setSelectedMedia(url)}
          >
            {renderMedia(url)}
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="max-w-4xl max-h-[90vh] p-4">
            {selectedMedia.includes('.mp4') || selectedMedia.includes('video') ? (
              <video
                src={selectedMedia}
                className="max-w-full max-h-full"
                controls
                autoPlay
              />
            ) : selectedMedia.includes('.mp3') || selectedMedia.includes('audio') ? (
              <audio
                src={selectedMedia}
                className="w-full"
                controls
                autoPlay
              />
            ) : (
              <img
                src={selectedMedia}
                alt="Full size"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;