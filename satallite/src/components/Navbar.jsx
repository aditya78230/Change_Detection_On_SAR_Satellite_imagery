import React, { useState, useCallback, useEffect } from "react";
import "./Navbar.css";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";
import videoBg from "../assets/videoBg.mp4";
import CustomizedSwitches from "./CustomizedSwitches";
import axios from "axios";

const Navbar = () => {
  const [selectedImage, setSelectedImage] = useState(2005);
  const [selectedLocation, setSelectedLocation] = useState("");  
  const [year, setYear] = useState("");
  const [processedImage, setProcessedImage] = useState(null);
  const [toggle, setToggle] = useState(true);

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
  };

  const handleYearChange = (event) => {
    setYear(event.target.value);
  };

  const years = [2005, 2010, 2015, 2020, 2025];
  const locations = ["Dubai", "Mumbai", "France", "London", "pune"];

  const getImagePath = (imgYear) => {
    if (!selectedLocation || !imgYear) return null;
    return `assets/${selectedLocation.toLowerCase()}${imgYear}.png`;
  };

  const valuetext = useCallback(
    (value) => {
      if (selectedImage !== value) setSelectedImage(value);
      return `${value}`;
    },
    [selectedImage]
  );


  
  const processImage = async () => {
    if (!year || !selectedImage) {
      alert("Please select both years.");
      return;
    }
    
    const imagePaths = [getImagePath(year), getImagePath(selectedImage)];
    
    if (!imagePaths[0] || !imagePaths[1]) {
      alert("Invalid image selection.");
      return;
    }
  
    try {
      const formData = new FormData();
  
      // Fetch images as Blob
      const fetchImageAsBlob = async (imagePath) => {
        const response = await fetch(imagePath);
        const blob = await response.blob();
        return new File([blob], imagePath.split('/').pop(), { type: blob.type });
      };
  
      const imageFile1 = await fetchImageAsBlob(imagePaths[0]);
      const imageFile2 = await fetchImageAsBlob(imagePaths[1]);
  
      formData.append("images", imageFile1);
      formData.append("images", imageFile2);
  
      const response = await axios.post("http://localhost:5000/process-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      setProcessedImage(response.data.change_map);
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };
  

  return (
    <div>
      <video autoPlay muted loop className="video-background">
        <source src={videoBg} type="video/mp4" />
      </video>
      <div className="overlay"></div>
      <header className="text-white flex justify-center tc pv2 avenir">
        <nav className="mw7 mt4">
          <div className="tc mt4 grid grid-cols-5 gap-4">
            <FormControl className="col-span-3" sx={{ color: 'white' }}>
              <InputLabel id="location-label" sx={{ color: 'white' }}>Select Location</InputLabel>
              <Select
                labelId="location-label"
                id="location-select"
                value={selectedLocation}
                onChange={handleLocationChange}
                sx={{
                  color: 'white',
                  '.MuiSvgIcon-root': { color: 'white' },
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' }
                }}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl className="" sx={{ color: 'white' }}>
              <InputLabel id="year-label" sx={{ color: 'white' }}>From</InputLabel>
              <Select
                labelId="year-label"
                id="year-select"
                value={year}
                onChange={handleYearChange}
                sx={{
                  color: 'white',
                  '.MuiSvgIcon-root': { color: 'white' },
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' }
                }}
              >
                {years.filter((value) => value < selectedImage)
                  .map((value) => (
                    <MenuItem key={value} value={value}>{value}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3">
              <Slider
                aria-label="Year"
                value={selectedImage}
                onChange={(event, newValue) => setSelectedImage(newValue)}
                valueLabelDisplay="auto"
                step={5}
                marks
                min={2005}
                max={2025}
              />
            </div>
            <Button variant="outlined" color="primary" onClick={()=>{setToggle((val)=>!val)}}>
                  Toggle change
            </Button>
          </div>
        </nav>
      </header>
      <div className="relative tc mt4 " style={{ width: "100vw", height: "90vh" }}>
  {selectedLocation && getImagePath(selectedImage) && (
    <div className="relative inline-block">
      <img
        src={getImagePath(selectedImage)}
        alt={`${selectedLocation} - Year ${selectedImage}`}
        className="center db cursor-pointer"
        style={{
          maxWidth: "100vw",
          maxHeight: "90vh",
          objectFit: "cover",
          display: "block",
        }}
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.target;
          const minSize = Math.min(naturalWidth, naturalHeight);

          e.target.style.width = `${minSize}px`;
          e.target.style.height = `${minSize}px`;
          e.target.parentNode.style.width = `${minSize}px`;
          e.target.parentNode.style.height = `${minSize}px`;
        }}
      />
      {toggle && processedImage && (
        <img
          src={`http://localhost:5000${processedImage}`}
          alt="Processed Image Overlay"
          className="absolute top-0 left-0 opacity-50"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
    </div>
  )}
</div>



      <div className="absolute top-4 right-4">
        <Button variant="outlined" color="primary" onClick={processImage}>
          Process Image
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
