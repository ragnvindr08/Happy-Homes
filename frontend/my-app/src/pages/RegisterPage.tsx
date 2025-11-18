import React, { useState } from 'react';
import { setToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import './RegisterPage.css';
import phFlag from '../images/philippines.png';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('+639');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);

  const navigate = useNavigate();

  const validatePassword = (pwd: string) => {
    const minLength = /.{8,}/;
    if (!minLength.test(pwd)) return 'Password must be at least 8 characters';
    return '';
  };

  const validateEmailStrict = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format.';
    return '';
  };

  const sendVerificationCode = async () => {
    const emailError = validateEmailStrict(email);
    if (emailError) return alert(emailError);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/send_verification_email/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setIsCodeSent(true);
        alert('Verification code sent to your email.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send verification code.');
      }
    } catch (err) {
      alert('Error sending email verification.');
      console.error(err);
    }
  };

  const verifyCode = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/verify_email_code/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();

      if (data.verified) {
        setIsEmailVerified(true);
        alert('Email verified successfully!');
      } else {
        alert('Invalid verification code.');
      }
    } catch (err) {
      alert('Error verifying code.');
      console.error(err);
    }
  };

  const handleRegister = async () => {
    if (!isEmailVerified) {
      alert('Please verify your email before registering.');
      return;
    }

    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      return;
    }

    setPasswordError('');

    let formattedNumber = contactNumber;
    if (!formattedNumber.startsWith('+639')) {
      formattedNumber = '+639' + formattedNumber.replace(/\D/g, '').slice(0, 9);
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          first_name: firstName,
          last_name: lastName,
          email,
          contact_number: formattedNumber,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setToken(data.access);
        navigate('/home');
      } else {
        if (res.status === 400 && data.email) {
          alert('This email is already registered.');
        } else {
          alert('Registration failed: ' + JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error('Error during registration:', err);
      alert('Something went wrong. Please try again later.');
    }
  };

  return (
    <div>
      <NavBar />
      <div className="register-container">
        <div className="register-box">
          <img src={require('../images/register.png')} alt="Register" className="login-profile-img" />
          <h2 style={{ color: '#2e7d32' }}>Register</h2>

          <input className="register-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
          <input className="register-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              className="register-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={isEmailVerified}
            />
            {!isEmailVerified && (
              <button onClick={sendVerificationCode} className="verify-button">
                {isCodeSent ? 'Resend' : 'Send Code'}
              </button>
            )}
          </div>

          {isCodeSent && !isEmailVerified && (
            <div style={{ marginTop: '8px' }}>
              <input
                className="register-input"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <button onClick={verifyCode} className="verify-button">Verify</button>
            </div>
          )}

          {isEmailVerified && <p style={{ color: 'green' }}>Email verified</p>}

          <input className="register-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
          <input className="register-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          {passwordError && <p className="error-text">{passwordError}</p>}

          <div className="contact-number-container">
            <img src={phFlag} alt="PH Flag" className="flag-icon" />
            <span className="prefix">+639</span>
            <div className="contact-input-wrapper">
              <input
                type="text"
                className="contact-input"
                value={contactNumber.replace(/^\+639/, '')}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 9) val = val.slice(0, 9);
                  setContactNumber(val ? '+639' + val : '+639');
                }}
                placeholder="xxxxxxxxx"
              />
            </div>
          </div>

          <button className="register-button" onClick={handleRegister}>
            Register
          </button>
          <button className="login-button" onClick={() => navigate('/login')}>
            Login Instead
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterPage;




// import React, { useState } from 'react';
// import { setToken } from '../utils/auth';
// import { useNavigate } from 'react-router-dom';
// import NavBar from './NavBar';
// import Footer from './Footer';
// import './RegisterPage.css';
// import phFlag from '../images/philippines.png';

// // ✅ Auto-switch between localhost and ngrok
// const API_BASE_URL =
//   window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
//     ? 'http://127.0.0.1:8000'
//     : 'https://7e0311ebfe5d.ngrok-free.app';

// const RegisterPage: React.FC = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [email, setEmail] = useState('');
//   const [contactNumber, setContactNumber] = useState('+639');
//   const [passwordError, setPasswordError] = useState('');
//   const navigate = useNavigate();

//   const validatePassword = (pwd: string) => {
//     const minLength = /.{8,}/; // at least 8 characters
//     if (!minLength.test(pwd)) return 'Password must be at least 8 characters';
//     return '';
//   };

//   const handleRegister = async () => {
//     // validate password first
//     const error = validatePassword(password);
//     if (error) {
//       setPasswordError(error);
//       return;
//     }
//     setPasswordError('');

//     // Ensure contact number is in correct format
//     let formattedNumber = contactNumber;
//     if (!formattedNumber.startsWith('+639')) {
//       formattedNumber = '+639' + formattedNumber.replace(/\D/g, '').slice(0, 9);
//     }

//     try {
//       const res = await fetch(`${API_BASE_URL}/api/register/`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           username,
//           password,
//           first_name: firstName,
//           last_name: lastName,
//           email,
//           contact_number: formattedNumber,
//         }),
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setToken(data.access);
//         navigate('/home');
//       } else {
//         const err = await res.json();
//         alert('Registration failed: ' + (err.detail || JSON.stringify(err)));
//       }
//     } catch (err) {
//       alert('❌ Failed to connect to server. Check if Django is running or ngrok is active.');
//       console.error(err);
//     }
//   };

//   return (
//     <div>
//       <NavBar />
//       <div className="register-container">
//         <div className="register-box">
//           <img
//             src={require('../images/register.png')}
//             alt="Register"
//             className="login-profile-img"
//           />
//           <h2 style={{ color: '#2e7d32' }}>Register</h2>

//           <input
//             className="register-input"
//             value={firstName}
//             onChange={(e) => setFirstName(e.target.value)}
//             placeholder="First Name"
//           />
//           <input
//             className="register-input"
//             value={lastName}
//             onChange={(e) => setLastName(e.target.value)}
//             placeholder="Last Name"
//           />
//           <input
//             className="register-input"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder="Email"
//           />
//           <input
//             className="register-input"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             placeholder="Username"
//           />
//           <input
//             className="register-input"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Password"
//           />
//           {passwordError && <p className="error-text">{passwordError}</p>}

//           {/* Contact Number */}
//           <div className="contact-number-container">
//             <img src={phFlag} alt="PH Flag" className="flag-icon" />
//             <span className="prefix">+639</span>
//             <div className="contact-input-wrapper">
//               <input
//                 type="text"
//                 className="contact-input"
//                 value={contactNumber.replace(/^\+639/, '')} // editable part only
//                 onChange={(e) => {
//                   let val = e.target.value.replace(/\D/g, '');
//                   if (val.length > 9) val = val.slice(0, 9);
//                   setContactNumber(val ? '+639' + val : '+639');
//                 }}
//                 placeholder="xxxxxxxxx"
//               />
//             </div>
//           </div>

//           <button className="register-button" onClick={handleRegister}>
//             Register
//           </button>
//           <button className="login-button" onClick={() => navigate('/login')}>
//             Login Instead
//           </button>
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// };

// export default RegisterPage;

