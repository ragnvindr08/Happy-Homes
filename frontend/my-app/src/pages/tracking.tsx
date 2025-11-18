import React from 'react';
import './tracking.css';
import NavBar from './NavBar';


const TrackingPage = () => {
    return (
        <div className="tracking-page">
            
            <NavBar />
            
            
            <h1>Tracking Page</h1>
            <div className="container">
                <p>Track your activities and progress here.</p>
                <p>Use the map to see your current location and surroundings.</p>
                <p>Additional tracking features will be added soon!</p>
            </div>
            <div>

            </div>
        </div>



    );
};

export default TrackingPage;


