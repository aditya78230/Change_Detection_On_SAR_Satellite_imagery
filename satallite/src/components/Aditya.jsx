import React, { useState,useEffect } from "react";
import axios from "axios";

export default function Aditya() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const processImage = async (imageUrl) => {
  const img = new Image();
  img.crossOrigin = "anonymous"; // Ensures CORS compatibility
  img.src = imageUrl;

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert black to transparent
        if (r === 0 && g === 0 && b === 0) {
          data[i + 3] = 0; // Set alpha to 0 (fully transparent)
        }

        // Convert blue to red (checking for blue shades)
        if (b > 150 && r < 100 && g < 100) {
          data[i] = 255; // Red channel
          data[i + 1] = 0; // Green channel
          data[i + 2] = 0; // Blue channel (removed)
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
  });
};

const [processedImage, setProcessedImage] = useState(null);

useEffect(() => {
  if (result?.change_map) {
    processImage(`http://localhost:5000${result.change_map}`).then(setProcessedImage);
  }
}, [result]);
 // const [processedImage, setProcessedImage] = useState(null);




  const handleImageChange = (event) => {
    const files = event.target.files;
    if (files.length === 2) {
      setImages(files);
    } else {
      alert("Please select exactly two images.");
    }
  };

  const handleUpload = async () => {
    if (images.length !== 2) {
      alert("Please upload exactly two images.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    try {
      const response = await axios.post("http://localhost:5000/process-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to process images.");
    }
    setLoading(false);
  };

  return (
    <div className="p-5 bg-gray-100 min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Satellite Image Segmentation</h1>
      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="mb-4" />
      <button 
        onClick={handleUpload} 
        disabled={loading} 
        className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
        {loading ? "Processing..." : "Upload & Process"}
      </button>

      {result && (
        <div className="mt-5">
          <h2 className="text-xl font-semibold">Results:</h2>
          <div className="flex flex-wrap gap-4 mt-2">
            <div>
              <h3>Segmented Image 1</h3>
              <img src={`http://localhost:5000${result.seg1}`} alt="Segmented 1" className="w-64 h-64" />
            </div>
            <div>
              <h3>Segmented Image 2</h3>
              <img src={`http://localhost:5000${result.seg2}`} alt="Segmented 2" className="w-64 h-64" />
            </div>
            <div>
              <h3>Change Detection</h3>
              <img src={`http://localhost:5000${result.change_map}`} alt="Change Map" className="w-64 h-64" />
            </div>
            {processedImage && <img src={processedImage} alt="Change Map" className="w-64 h-64" />}

          </div>
        </div>
      )}
    </div>
  );
}
