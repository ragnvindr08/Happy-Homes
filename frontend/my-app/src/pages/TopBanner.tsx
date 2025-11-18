import React from 'react';
import './TopBanner.css';

interface TopBannerProps {
  message?: string;
}

const TopBanner: React.FC<TopBannerProps> = ({ message }) => {
  return (
    <div className="top-banner">
      <div className="marquee">
        <span>{message || 'Welcome to HappyHomes!'}</span>
      </div>
    </div>
  );
};

export default TopBanner;
