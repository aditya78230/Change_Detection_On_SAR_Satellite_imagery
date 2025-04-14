import React from 'react'
import gg from '../assets/gg.mp4'
import { Navigate, useNavigate } from 'react-router-dom'
import './Main.css'

const Main = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/hi');
  };

  return (
    <div className='main'>
        
        <div className="overlay"></div>
        <video src={gg} autoPlay loop muted />
        <div className="content">
          <div className="geeks">Change Detection in
          Synthetic Aperture radar</div>
            <div className="gfg">
            Satellite image    
            </div>
            <div id="container">
        <button className="learn-more">
            <span className="circle" aria-hidden="true">
                <span className="icon arrow"></span>
            </span>
            <span className="button-text" onClick={handleGetStarted}>Get Started </span>
        </button>
    </div>        
          </div>
    </div>

  )
}

export default Main