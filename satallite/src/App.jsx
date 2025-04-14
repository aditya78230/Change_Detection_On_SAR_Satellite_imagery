import React from 'react';
import Main from './components/Main';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
//import Nav from './components/Navbar';
import NavBar from './components/Navbar';
import Aditya from './components/Aditya';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path ="/" element={<Main />}/>
        <Route path ="/hi" element={<NavBar/>}/>
        <Route path ="/hii" element={<Aditya/>}/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;