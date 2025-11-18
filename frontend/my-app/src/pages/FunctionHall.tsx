// src/pages/amenities/FunctionHall.js
import React from "react";
import NavBar from "./NavBar";   // Adjust path depending on your folder
import Footer from "./Footer";  // Adjust path depending on your folder

const FunctionHall = () => {
  return (
    <div>
      <NavBar />
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Function Hall</h1>
        <p>Hello World 🌍 — this is the Function Hall page.</p>
      </div>
      <Footer />
    </div>
  );
};

export default FunctionHall;
