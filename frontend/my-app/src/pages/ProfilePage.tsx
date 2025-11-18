import React, { useEffect, useState } from 'react';
import { getToken, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropUtils"; 
import phFlag from '../images/philippines.png';
import defaultProfile from '../images/profile1.png';
import axios from 'axios';
import './ProfilePage.css';
import documentImg from '../images/document.png';

interface Profile {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  user?: {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  profile?: {
    profile_image?: string;
    contact_number?: string;
    is_verified?: boolean;
    document?: string;
    billing_records?: string[]; // ✅ add this
  };
}
// interface Profile {
//   username: string;
//   email?: string;
//   first_name?: string;
//   last_name?: string;
//   profile?: {
//     profile_image?: string;
//     contact_number?: string;
//     is_verified?: boolean;
//     document?: string;
//   };
// }

interface ResidentPin {
  pin: string | null;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [residentPin, setResidentPin] = useState<ResidentPin | null>(null);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('+639');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [billingFile, setBillingFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const navigate = useNavigate();
  const token = getToken();
  if (!token) navigate('/login');

  // ------------------ PROFILE ------------------
  const fetchProfile = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      if (!data.profile) data.profile = {};

      setProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setEmail(data.email || '');
      setUsername(data.username || '');
      setContactNumber(data.profile.contact_number || '+639');

      if (data.profile.profile_image) {
        localStorage.setItem('profileImage', data.profile.profile_image);
      }
    } catch {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchResidentPin();
    const interval = setInterval(() => {
      fetchProfile();
      fetchResidentPin();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ------------------ RESIDENT PIN ------------------
  const fetchResidentPin = async () => {
    setPinLoading(true);
    setPinError(null);
    setPinMessage(null);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/resident-pin/my/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResidentPin(res.data);
    } catch (err: any) {
      setPinError(err.response?.data?.error || 'Unable to fetch PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const generatePin = async () => {
    setPinLoading(true);
    setPinError(null);
    setPinMessage(null);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/resident-pin/my/', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResidentPin(res.data);
      setPinMessage('New PIN generated successfully!');
    } catch (err: any) {
      setPinError(err.response?.data?.error || 'Failed to generate PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const copyPin = () => {
    if (residentPin?.pin) {
      navigator.clipboard.writeText(residentPin.pin);
      setPinMessage('PIN copied to clipboard!');
    }
  };

  // ------------------ PROFILE IMAGE & DOCUMENT ------------------
  const onCropComplete = (_: any, croppedArea: any) => setCroppedAreaPixels(croppedArea);
  const handleCrop = async () => {
    if (!profileImage || !croppedAreaPixels) return;
    try {
      const base64 = await getCroppedImg(URL.createObjectURL(profileImage), croppedAreaPixels);
      setCroppedImage(base64);
      const res = await fetch(base64);
      const blob = await res.blob();
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      setProfileImage(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('email', email);
    formData.append('username', username);
    formData.append('contact_number', contactNumber);
    if (profileImage) formData.append('profile_image', profileImage);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/update/', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) return alert('Update failed');
      const data = await res.json();
      if (!data.profile) data.profile = {};
      setProfile(data);
      setContactNumber(data.profile.contact_number || '+639');
      if (data.profile.profile_image) localStorage.setItem('profileImage', data.profile.profile_image);

      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update');
    }
  };

  // ------------------ PASSWORD ------------------
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed: ${err.detail || 'Something went wrong'}`);
        return;
      }
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (err) {
      console.error(err);
      alert('Error changing password');
    }
  };

  // ------------------ DOCUMENT ------------------
  const handleUploadDocument = async () => {
    if (!documentFile) return alert("Please select a document first.");
    const formData = new FormData();
    formData.append('document', documentFile);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/upload-document/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) return alert('Failed to upload document');
      alert('Document uploaded successfully!');
      setDocumentFile(null);
      fetchProfile();
    } catch (err) {
      console.error(err);
      alert('Error uploading document');
    }
  };

  if (!profile) return <p>Loading...</p>;

  const storedImage = localStorage.getItem('profileImage');
  const profileImageUrl = croppedImage || (storedImage
    ? storedImage.startsWith('http')
      ? storedImage
      : `http://127.0.0.1:8000${storedImage}`
    : defaultProfile);




const handleUploadBilling = async () => {
  if (!billingFile) return alert("Please select a billing file first.");

  const formData = new FormData();
  formData.append('billing', billingFile);

  try {
    const res = await fetch('http://127.0.0.1:8000/api/profile/upload-billing/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) return alert('Failed to upload billing');
    alert('Billing uploaded successfully!');
    setBillingFile(null);
  } catch (err) {
    console.error(err);
    alert('Error uploading billing');
  }
};



  return (
    <div>
      <NavBar />
      <div className="profile-container">
        <h2>My Profile</h2>

        {/* --- EDIT MODE --- */}
        {editMode ? (
          <div className="profile-form">
            {/* Profile inputs ... same as before */}
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="responsive-input" />
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="responsive-input" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="responsive-input" />
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="responsive-input" />

            <div className="contact-input-wrapper">
              <img src={phFlag} alt="PH Flag" className="flag-icon" />
              <input
                type="text"
                value={contactNumber}
                onChange={e => {
                  let val = e.target.value.replace(/^(\+639)?/, '').replace(/\D/g, '');
                  val = val.slice(0, 9);
                  setContactNumber(val ? '+639' + val : '+639');
                }}
                placeholder="+639XXXXXXXXX"
                className="responsive-input"
              />
            </div>

 <div className="file-upload-wrapper">
  <label htmlFor="profileImage" className="custom-file-label">
    Upload Profile Image
  </label>
  <input
    id="profileImage"
    type="file"
    accept="image/*"
    onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
  />
  {profileImage && <p className="file-name">{profileImage.name}</p>}
</div>

{profileImage && (
  <div className="cropper-container">
    <Cropper
      image={URL.createObjectURL(profileImage)}
      crop={crop}
      zoom={zoom}
      aspect={1}
      onCropChange={setCrop}
      onZoomChange={setZoom}
      onCropComplete={onCropComplete}
    />
    <button onClick={handleCrop}>Crop Image</button>
  </div>
)}

<div className="verification-upload">
  <label>Verification of Property Documents</label>
  <p className="doc-verify"><img src={documentImg} alt="Document" className="doc-icon" />
  To ensure your property’s authenticity, please upload all required house documents clearly and accurately. This includes the property title, tax declaration, deed of sale, lot plan, and other supporting certificates. Files should be original, readable, and unaltered to avoid delays in the verification process.
</p>
  {profile.profile?.is_verified ? (
    <>
      {profile.profile?.document ? (
        <p>
          <strong>Uploaded Document:</strong>{" "}
          <a
            href={
              profile.profile.document.startsWith("http")
                ? profile.profile.document
                : `http://127.0.0.1:8000${profile.profile.document}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            View Document
          </a>
        </p>
      ) : (
        <p>No document uploaded.</p>
      )}
      <p style={{ color: "green", fontWeight: "bold" }}>Verified</p>
    </>
  ) : (
    <>
      {/* ✅ If not verified — allow upload */}
      {profile.profile?.document ? (
        <>
          <p>
            <strong>Uploaded Document:</strong>{" "}
            <a
              href={
                profile.profile.document.startsWith("http")
                  ? profile.profile.document
                  : `http://127.0.0.1:8000${profile.profile.document}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </a>
          </p>
          <p style={{ color: "orange" }}>Pending verification...</p>
        </>
      ) : (
        <>
<input
  id="documentFile"
  type="file"
  accept=".pdf,.jpg,.png"
  style={{ display: "none" }}  // hidden
  onChange={(e) => {
    const file = e.target.files?.[0] || null;
    setDocumentFile(file);
    if (file) {
      // Optionally auto-upload here or keep separate button
      console.log("Selected file:", file.name);
    }
  }}
/>

{/* Button that opens file picker */}
<button
  onClick={() => {
    const fileInput = document.getElementById("documentFile") as HTMLInputElement;
    fileInput?.click(); // triggers the OS file explorer
  }}
>
  Upload Documents
</button>

{/* Show selected file name */}
{documentFile && <p className="file-name">{documentFile.name}</p>}

{/* Optional: upload button */}
{documentFile && <button onClick={handleUploadDocument}>Upload Document</button>}
        </>
      )}
    </>
  )}
</div>

    {/* --- BILLING UPLOAD --- */}
    <div className="billing-upload">
      <label>Monthly Billing Upload</label>
      <p className="doc-verify">
        Upload your monthly dues billing statement (PDF, JPG, PNG). This ensures your account is up-to-date.
      </p>

      <input
        id="billingFile"
        type="file"
        accept=".pdf,.jpg,.png"
        style={{ display: "none" }}
        onChange={(e) => setBillingFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={() => {
          const fileInput = document.getElementById("billingFile") as HTMLInputElement;
          fileInput?.click();
        }}
        className="upload-btn"
      >
        Upload Billing
      </button>

      {billingFile && <p className="file-name">{billingFile.name}</p>}
      {billingFile && <button onClick={handleUploadBilling} className="upload-btn submit">Submit Billing</button>}

      {/* Display uploaded bills */}
      {profile.profile?.billing_records && profile.profile.billing_records.length > 0 && (
        <div className="billing-records">
          <h4>Uploaded Bills</h4>
          <div className="billing-list">
            {profile.profile.billing_records.map((bill: any, idx: number) => {
              const url = bill.startsWith('http') ? bill : `http://127.0.0.1:8000${bill}`;
              return (
                <div key={idx} className="billing-item">
                  {url.endsWith('.pdf') ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <img src={documentImg} alt="PDF" className="billing-img" />
                      <p>{bill.split('/').pop()}</p>
                    </a>
                  ) : (
                    <img src={url} alt={`Bill ${idx}`} className="billing-img" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>


<div className="buttons">
  <button onClick={handleUpdate}>Save</button>
  <button onClick={() => setEditMode(false)}>Cancel</button>
</div>
          </div>
        ) : (
          <div className="profile-details">
            {/* Profile info display */}
            <img src={profileImageUrl} alt="Profile" className="profile-preview" />
            <p><strong>First Name:</strong> {profile.first_name || profile.user?.first_name || '-'}</p>
            <p><strong>Last Name:</strong> {profile.last_name || profile.user?.last_name || '-'}</p>
            <p><strong>Email:</strong> {profile.email || '-'}</p>
            <p><strong>Username:</strong> {profile.username || '-'}</p>
            <p><strong>Contact Number:</strong> {profile.profile?.contact_number || '-'}</p>

            {profile.profile?.document && (
              <p>
                <strong>Uploaded Document:</strong>{" "}
                <a
                  href={profile.profile.document.startsWith('http') ? profile.profile.document : `http://127.0.0.1:8000${profile.profile.document}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
              </p>
            )}

            <p>
              <strong>Verified User:</strong>{" "}
              {profile.profile?.is_verified ? (
                <span style={{ color: 'green' }}>Verified</span>
              ) : profile.profile?.document ? (
                <span style={{ color: 'orange' }}>Pending Verification...</span>
              ) : (
                <span style={{ color: 'red' }}>Not Verified</span>
              )}
            </p>

            <div className="buttons">
              <button onClick={() => setEditMode(true)}>Edit Profile</button>
              <button onClick={() => setShowChangePassword(!showChangePassword)}>Change Password</button>
            </div>
          </div>
        )}

        {/* --- CHANGE PASSWORD --- */}
        {showChangePassword && (
          <div style={{marginTop: '10px'}} className="change-password">
            <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <button onClick={handleChangePassword}>Change Password</button>
          </div>
        )}

        {/* --- RESIDENT PIN --- */}
        <div className="resident-pin" style={{marginTop: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px'}}>
          <h3>Visitor PIN</h3>
          {pinLoading && <p>Loading...</p>}
          {pinError && <p style={{color:'red'}}>{pinError}</p>}
          {pinMessage && <p style={{color:'green'}}>{pinMessage}</p>}
          {residentPin && (
            <>
              <p style={{fontSize:'18px', fontWeight:'bold'}}>{residentPin.pin || 'No PIN yet'}</p>
              <div className="buttons" style={{display:'flex', gap:'10px'}}>
                <button onClick={generatePin} disabled={pinLoading} style={{padding:'6px 12px'}}>Generate/Regenerate PIN</button>
                <button onClick={copyPin} disabled={!residentPin.pin} style={{padding:'6px 12px'}}>Copy PIN</button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;

// import React, { useEffect, useState } from 'react';
// import { getToken, logout } from '../utils/auth';
// import { useNavigate } from 'react-router-dom';
// import NavBar from './NavBar';
// import Footer from './Footer';
// import Cropper from "react-easy-crop";
// import { getCroppedImg } from "../utils/cropUtils"; 
// import phFlag from '../images/philippines.png';
// import defaultProfile from '../images/profile1.png';
// import './ProfilePage.css';

// interface Profile {
//   username: string;
//   email?: string;
//   first_name?: string;
//   last_name?: string;
//   profile?: {
//     profile_image?: string;
//     contact_number?: string;
//     is_verified?: boolean;
//     document?: string;
//   };
// }

// const ProfilePage: React.FC = () => {
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [editMode, setEditMode] = useState(false);
//   const [showChangePassword, setShowChangePassword] = useState(false);

//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [email, setEmail] = useState('');
//   const [username, setUsername] = useState('');
//   const [contactNumber, setContactNumber] = useState('+639');
//   const [profileImage, setProfileImage] = useState<File | null>(null);
//   const [documentFile, setDocumentFile] = useState<File | null>(null);

//   // Password fields
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   // Cropper states
//   const [crop, setCrop] = useState({ x: 0, y: 0 });
//   const [zoom, setZoom] = useState(1);
//   const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
//   const [croppedImage, setCroppedImage] = useState<string | null>(null);

//   const navigate = useNavigate();
//   const token = getToken();
//   if (!token) navigate('/login');

//   const fetchProfile = async () => {
//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/profile/', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error('Unauthorized');
//       const data = await res.json();
//       if (!data.profile) data.profile = {};

//       setProfile(data);
//       setFirstName(data.first_name || '');
//       setLastName(data.last_name || '');
//       setEmail(data.email || '');
//       setUsername(data.username || '');
//       setContactNumber(data.profile.contact_number || '+639');

//       if (data.profile.profile_image) {
//         localStorage.setItem('profileImage', data.profile.profile_image);
//       }
//     } catch {
//       logout();
//       navigate('/login');
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//     const interval = setInterval(fetchProfile, 15000); // poll every 15s
//     return () => clearInterval(interval);
//   }, []);

//   const onCropComplete = (_: any, croppedArea: any) => setCroppedAreaPixels(croppedArea);

//   const handleCrop = async () => {
//     if (!profileImage || !croppedAreaPixels) return;
//     try {
//       const base64 = await getCroppedImg(URL.createObjectURL(profileImage), croppedAreaPixels);
//       setCroppedImage(base64);

//       const res = await fetch(base64);
//       const blob = await res.blob();
//       const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
//       setProfileImage(file);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleUpdate = async () => {
//     const formData = new FormData();
//     formData.append('first_name', firstName);
//     formData.append('last_name', lastName);
//     formData.append('email', email);
//     formData.append('username', username);
//     formData.append('contact_number', contactNumber);
//     if (profileImage) formData.append('profile_image', profileImage);

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/profile/update/', {
//         method: 'PUT',
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });

//       if (!res.ok) return alert('Update failed');

//       const data = await res.json();
//       if (!data.profile) data.profile = {};
//       setProfile(data);
//       setContactNumber(data.profile.contact_number || '+639');
//       if (data.profile.profile_image) localStorage.setItem('profileImage', data.profile.profile_image);

//       setEditMode(false);
//       alert('Profile updated successfully!');
//     } catch (err) {
//       console.error(err);
//       alert('Failed to update');
//     }
//   };

//   const handleChangePassword = async () => {
//     if (newPassword !== confirmPassword) {
//       alert("New passwords do not match!");
//       return;
//     }

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/change-password/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           old_password: currentPassword,
//           new_password: newPassword,
//         }),
//       });

//       if (!res.ok) {
//         const err = await res.json();
//         alert(`Failed: ${err.detail || 'Something went wrong'}`);
//         return;
//       }

//       alert('Password changed successfully!');
//       setCurrentPassword('');
//       setNewPassword('');
//       setConfirmPassword('');
//       setShowChangePassword(false);
//     } catch (err) {
//       console.error(err);
//       alert('Error changing password');
//     }
//   };

//   const handleUploadDocument = async () => {
//     if (!documentFile) return alert("Please select a document first.");

//     const formData = new FormData();
//     formData.append('document', documentFile);

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/profile/upload-document/', {
//         method: 'POST',
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });

//       if (!res.ok) return alert('Failed to upload document');
//       alert('Document uploaded successfully!');
//       setDocumentFile(null);
//       fetchProfile(); // refresh profile to reflect document
//     } catch (err) {
//       console.error(err);
//       alert('Error uploading document');
//     }
//   };

//   if (!profile) return <p>Loading...</p>;

//   const storedImage = localStorage.getItem('profileImage');
//   const profileImageUrl = croppedImage || (storedImage
//     ? storedImage.startsWith('http')
//       ? storedImage
//       : `http://127.0.0.1:8000${storedImage}`
//     : defaultProfile);

//   return (
//     <div>
//       <NavBar />
//       <div className="profile-container">
//         <h2>My Profile</h2>

//         {editMode ? (
//           <div className="profile-form">
//             <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="responsive-input" />
//             <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="responsive-input" />
//             <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="responsive-input" />
//             <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="responsive-input" />

//             <div className="contact-input-wrapper">
//               <img src={phFlag} alt="PH Flag" className="flag-icon" />
//               <input
//                 type="text"
//                 value={contactNumber}
//                 onChange={e => {
//                   let val = e.target.value.replace(/^(\+639)?/, '').replace(/\D/g, '');
//                   val = val.slice(0, 9);
//                   setContactNumber(val ? '+639' + val : '+639');
//                 }}
//                 placeholder="+639XXXXXXXXX"
//                 className="responsive-input"
//               />
//             </div>

//             <input type="file" accept="image/*" onChange={e => setProfileImage(e.target.files?.[0] || null)} />

//             {profileImage && (
//               <div className="cropper-container">
//                 <Cropper
//                   image={URL.createObjectURL(profileImage)}
//                   crop={crop}
//                   zoom={zoom}
//                   aspect={1}
//                   onCropChange={setCrop}
//                   onZoomChange={setZoom}
//                   onCropComplete={onCropComplete}
//                 />
//                 <button onClick={handleCrop}>Crop Image</button>
//               </div>
//             )}

//             <div className="verification-upload">
//               <label>Upload Verification Document:</label>
//               <input type="file" accept=".pdf,.jpg,.png" onChange={e => setDocumentFile(e.target.files?.[0] || null)} />
//               <button onClick={handleUploadDocument}>Upload Document</button>
//             </div>

//             <div className="buttons">
//               <button onClick={handleUpdate}>Save</button>
//               <button onClick={() => setEditMode(false)}>Cancel</button>
//             </div>
//           </div>
//         ) : (
//           <div className="profile-details">
//             <img src={profileImageUrl} alt="Profile" className="profile-preview" />
//             <p><strong>First Name:</strong> {profile.first_name || '-'}</p>
//             <p><strong>Last Name:</strong> {profile.last_name || '-'}</p>
//             <p><strong>Email:</strong> {profile.email || '-'}</p>
//             <p><strong>Username:</strong> {profile.username || '-'}</p>
//             <p><strong>Contact Number:</strong> {profile.profile?.contact_number || '-'}</p>

//             {profile.profile?.document && (
//               <p>
//                 <strong>Uploaded Document:</strong>{" "}
//                 <a
//                   href={profile.profile.document.startsWith('http') ? profile.profile.document : `http://127.0.0.1:8000${profile.profile.document}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                 >
//                   View
//                 </a>
//               </p>
//             )}

//             <p>
//               <strong>Verified User:</strong>{" "}
//               {profile.profile?.is_verified ? (
//                 <span style={{ color: 'green' }}>Verified</span>
//               ) : profile.profile?.document ? (
//                 <span style={{ color: 'orange' }}>Pending Verification...</span>
//               ) : (
//                 <span style={{ color: 'red' }}>Not Verified</span>
//               )}
//             </p>


//             <div className="buttons">
//               <button onClick={() => setEditMode(true)}>Edit Profile</button>
//               <button onClick={() => setShowChangePassword(!showChangePassword)}>Change Password</button>
//             </div>
//           </div>
//         )}

//         {showChangePassword && (
//           <div style={{marginTop: '10px'}} className="change-password">
//             <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
//             <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
//             <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
//             <button onClick={handleChangePassword}>Change Password</button>
//           </div>
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// };

// export default ProfilePage;
