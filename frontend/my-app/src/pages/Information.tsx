import React from "react";
import NavBar from "./NavBar";
import "./PageStyles.css";

const Information = () => {
  return (
    <>
      <NavBar />
      <div className="page-container">
        <h1>ℹ️ Information</h1>
        <p>
          Welcome to the Information page. Here you can find details about our
          community, upcoming events, and important resources.
        </p>
        <ul>
          <li>Community guidelines</li>
          <li>Public services and offices</li>
          <li>Emergency contacts</li>
          <li>Important documents</li>
        </ul>
      </div>
    </>
  );
};

export default Information;
