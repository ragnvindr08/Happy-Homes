// import React, { useEffect, useState } from 'react';

// interface Profile {
//   username: string;
//   email?: string;
//   first_name?: string;
//   last_name?: string;
// }

// function UserProfile() {
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     const token = localStorage.getItem('access'); // or sessionStorage
    
//     if (!token) {
//       setError('User not logged in');
//       return;
//     }

//     fetch('http://127.0.0.1:8000/api/profile/', {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       }
//     })
//       .then(response => {
//         if (!response.ok) {
//           throw new Error('Failed to fetch profile');
//         }
//         return response.json();
//       })
//       .then((data: Profile) => setProfile(data))
//       .catch(err => setError(err.message));
//   }, []);

//   if (error) return <div>Error: {error}</div>;
//   if (!profile) return <div>Loading...</div>;

//   return (
//     <div className="profile-card">
//       <h2>👤 My Profile</h2>
//       <p><strong>Username:</strong> {profile.username}</p>
//       <p><strong>Email:</strong> {profile.email || 'N/A'}</p>
//       <p><strong>First Name:</strong> {profile.first_name || 'N/A'}</p>
//       <p><strong>Last Name:</strong> {profile.last_name || 'N/A'}</p>
//     </div>
//   );
// }

// export default UserProfile;
