import React, { FC } from "react";
import "./Footer.css"; // Optional for custom styles

const Footer: FC = () => {
  return (
    <footer  className="footer" style={{
        backgroundColor: "#222", // fixed dark background
        color: "#fff",           // white text
        padding: "20px",
        marginTop: "auto",
      }}>
      <div className="footer-sections">

        <div className="footer-column">
          <h3>Discover</h3>
          <ul>
            <li>Amenities</li>
            <li>Map</li>
            <li>Booking for amenities</li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>
          <ul>
            <li>Inquire Now</li>
            <li>Explore Homes</li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Our Gmail</h3>
          <ul>
            <li>happyphhomes@gmail.com</li>

          </ul>
        </div>

      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Happy Homes. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
