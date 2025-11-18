import React, { useState, ChangeEvent, FormEvent } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../utils/auth';
import NavBar from './NavBar';
import Footer from './Footer';
import contactIcon from '../images/contact.png';

interface LoginPageProps {}

const ForgotPassword: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send reset email.');
      }

      setMsg(data.message || 'Password reset link sent to your email!');
      setEmail('');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="forgot-password-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '10px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        <img src={require('../images/logo.png')} className="logo" alt="Logo" />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center' }}>
          Forgot Password
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
          />
          {msg && <p style={{ color: 'green', fontSize: '0.9rem' }}>{msg}</p>}
          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

const LoginPage: React.FC<LoginPageProps> = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [viewOnly, setViewOnly] = useState(true); // ✅ Start in View Only mode

  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error('Invalid username or password');
      const data: { access: string } = await res.json();

      setToken(data.access);
      navigate('/home');
    } catch (err) {
      if (err instanceof Error) setErrorMsg(err.message);
      else setErrorMsg('An unknown error occurred');
    }
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (errorMsg) setErrorMsg('');
    };

  return (
    <>
      <NavBar profile={null} />
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundImage: `url(${require('../images/bg4.png')})`,
          backgroundSize: 'cover',
          padding: '20px',
        }}
      >
        <div className="login-page">
{viewOnly ? (
  <div
    style={{
      backgroundColor: 'rgba(255,255,255,0.95)',
      padding: '30px',
      borderRadius: '8px',
      textAlign: 'center',
      maxWidth: '1000px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '30px',
      
    }}
  > 
    <div style={{ flex: 1, textAlign: 'left' }}>
      <p style={{fontSize: '1.1rem', textAlign:'left', marginBottom:'-20px', fontWeight:'bold'}}>Happy Homes Community</p>
      <h2 style={{ fontSize: '4rem', marginBottom: '10px', color: '#1b3d1b', textAlign: 'left', fontWeight: 'bold' }}>
        Happy Homes: <br /> Where Life Connects.
      </h2>
      <p style={{ color: '#4CAF50', marginBottom: '20px' }}>
      | Home is not a place… it’s a feeling. Welcome to the happiest one.
      </p>
<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
  <button
    style={{
      flex: 1,              // each button takes equal space
      padding: '12px 24px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
    }}
    onClick={() => navigate('/contact')} // Navigate to /contact
  >
    <img style={{ filter: 'none' }} src={contactIcon} alt="contactIcon" className="icon" />Make An Enquiry
  </button>
  <button
    style={{
      flex: 1,              // same as above
      padding: '12px 24px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
    }}
    onClick={() => setViewOnly(false)}
  >
    Go to Login
  </button>
</div>
    </div>
    <div style={{ flex: 1 }}>
      <img
        src={require('../images/house123.png')} // your uploaded house image
        alt="House"
        style={{ width: '100%', borderRadius: '8px' }}
      />
    </div>
  </div>
          ) : (
            <div className="login-container">
              <div className="login-form">
                <img src={require('../images/logo.png')} className="logo" alt="Logo" />
                <form onSubmit={handleLogin}>
                  <div className="input-group" style={{ position: 'relative', marginBottom: '15px' }}>
                    <img
                      src={require('../images/user-icon.png')}
                      alt="User Icon"
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '20px',
                        height: '20px',
                        opacity: 0.6,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={handleInputChange(setUsername)}
                      style={{
                        padding: '10px 12px 10px 45px',
                        fontSize: '16px',
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #dbdbdb',
                        borderRadius: '4px',
                        background: '#fafafa',
                      }}
                    />
                  </div>

                  <div className="input-group" style={{ position: 'relative', marginBottom: '15px' }}>
                    <img
                      src={require('../images/lock-icon.png')}
                      alt="Lock Icon"
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '20px',
                        height: '20px',
                        opacity: 0.6,
                      }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      style={{
                        padding: '10px 12px 10px 45px',
                        fontSize: '16px',
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #dbdbdb',
                        borderRadius: '4px',
                        background: '#fafafa',
                      }}
                    />
                  </div>

                  <p className="privacy-text">
                    "I have read, understood, and accept Happy Homes' Privacy Policy and consent to the collection and processing of my information by the company and its authorized parties."
                  </p>

                  {errorMsg && <div className="error-msg">{errorMsg}</div>}

                  <button type="submit">Login</button>
                  <button type="button" className="register-btn" onClick={() => navigate('/register')}>
                    Register
                  </button>
                </form>

                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#007BFF',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      padding: 0,
                      fontSize: '14px',
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Our Main Focus Section */}

<div
  style={{
          marginTop:'-200px;',
          minHeight: '100vh',
          boxShadow:'1px 1px 1px 1px black',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor:'white',
          // backgroundImage: `url(${require('../images/bg4.png')})`,
          backgroundSize: 'cover',
          padding: '20px',
  }}
>
  <p style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '10px' }}>Our Services</p>
  <h2 style={{ fontSize: '2.5rem', marginBottom: '40px', fontWeight: 'bold' }}>Our Main Focus</h2>

  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '20px',
    }}
  >
    {/* Buy a Home */}
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        flex: '1 1 250px',
        maxWidth: '300px',
        textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={require('../images/service-1.png')}
        alt="Buy a Home"
        style={{
          width: '150px',
          margin: '0 auto 20px',
          display: 'block',
        }}
      />
      <h3 style={{ marginBottom: '10px' }}>Buy a home</h3>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        With a total of 250 exclusive home slots in our community, we currently have 200 happy families who already call this home. Limited spaces are available—find the house that's waiting for you!
      </p>
<a
  href="#"
  style={{
    marginTop: '35px',
    display: 'inline-block',
    color: '#4CAF50',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'color 0.3s',
  }}
  onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#388E3C')}
  onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#4CAF50')}
>
  {/* Find A Home → */}
</a>
    </div>

    {/* Rent a Home */}
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        flex: '1 1 250px',
        maxWidth: '300px',
        textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={require('../images/service-2.png')}
        alt="Rent a Home"
        style={{
          width: '150px',
          margin: '0 auto 20px',
          display: 'block',
        }}
      />
      <h3 style={{ marginBottom: '10px' }}>Rent a home</h3>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Experience the thriving life alongside 200 established families already enjoying our 250 exclusive community slots. Limited rental opportunities are currently available.
      </p>
<a
  href="#"
  style={{
    marginTop: '45px',
    display: 'inline-block',
    color: '#4CAF50',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'color 0.3s',
  }}
  onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#388E3C')}
  onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#4CAF50')}
>
  {/* Find A Home → */}
</a>
    </div>

    {/* Book Amenities */}
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        flex: '1 1 250px',
        maxWidth: '300px',
        textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={require('../images/service-3.png')}
        alt="Book Amenities"
        style={{
          width: '150px',
          margin: '0 auto 20px',
          display: 'block',
        }}
      />
      <h3 style={{ marginBottom: '10px' }}>Book Amenities</h3>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Your next happy memory starts now. Our exclusive resident portal offers seamless, real-time access to reserve all available amenities. Secure your pool time, clubhouse for parties, or court space instantly.
      </p>
<a
  href="#"
  style={{
    marginTop: '25px',
    display: 'inline-block',
    color: '#4CAF50',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'color 0.3s',
  }}
  onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#388E3C')}
  onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#4CAF50')}
>
  {/* Find A Home → */}
</a>
    </div>
  </div>
</div>

      {showForgotPassword && <ForgotPassword onClose={() => setShowForgotPassword(false)} />}
      <Footer />
    </>
  );
};

export default LoginPage;





// import React, { useState, ChangeEvent, FormEvent } from 'react';
// import './LoginPage.css';
// import { useNavigate } from 'react-router-dom';
// import { setToken } from '../utils/auth';
// import NavBar from './NavBar';
// import Footer from './Footer';
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import ReCAPTCHA from 'react-google-recaptcha';

// interface LoginPageProps {}

// const LoginPage: React.FC<LoginPageProps> = () => {
//   const [username, setUsername] = useState<string>('');
//   const [password, setPassword] = useState<string>('');
//   const [errorMsg, setErrorMsg] = useState<string>('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
//   const navigate = useNavigate();

//   const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setErrorMsg('');

//     if (!recaptchaValue) {
//       setErrorMsg('Please complete the reCAPTCHA.');
//       return;
//     }

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/token/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password, recaptcha: recaptchaValue }),
//       });

//       if (!res.ok) throw new Error('Invalid username or password');
//       const data: { access: string } = await res.json();

//       setToken(data.access);
//       navigate('/home');
//     } catch (err) {
//       if (err instanceof Error) {
//         setErrorMsg(err.message);
//       } else {
//         setErrorMsg('An unknown error occurred');
//       }
//     }
//   };

//   const handleInputChange =
//     (setter: React.Dispatch<React.SetStateAction<string>>) =>
//     (e: ChangeEvent<HTMLInputElement>) => {
//       setter(e.target.value);
//       if (errorMsg) setErrorMsg('');
//     };

//   const handleRecaptchaChange = (value: string | null) => {
//     setRecaptchaValue(value);
//   };

//   return (
//     <>
//       <NavBar profile={null} />
//             <div
//         style={{
//           minHeight: "100vh",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           backgroundImage: `url(${require('../images/bg4.png')})`,
//           backgroundSize: "cover",
//           // background: "linear-gradient(135deg, #000000, #2e6f40)",
//           padding: "20px",
//         }}
//       >

//       <div className="login-page">
//         <div className="login-container">
//           {/* Left image/branding */}
//           <div className="login-image">
//             {/* Happy Homes */}
//           </div>

//           {/* Right login form */}
//           <div className="login-form">
//             <img
//               src={require('../images/logo.png')}
//               className="logo"
//               alt="Logo"
//             />
//             <form onSubmit={handleLogin}>
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={username}
//                 onChange={handleInputChange(setUsername)}
//               />

//               <div className="input-wrapper">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Password"
//                   value={password}
//                   onChange={handleInputChange(setPassword)}
//                   className="password-input"
//                 />
//                 <span
//                   className="toggle-password-icon"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </span>
//               </div>

//               <div className="recaptcha-container">
//                 <ReCAPTCHA
//                   sitekey="6Lc7-awrAAAAAEUEFyyYa_DQWKg9RUF-PEmuYwfD"
//                   onChange={handleRecaptchaChange}
//                 />
//               </div>

//               <p className="privacy-text">
//                 "I have read, understood, and accept Happy Homes' Privacy Policy and consent to the collection and processing of my information by the company and its authorized parties."
//               </p>

//               {errorMsg && <div className="error-msg">{errorMsg}</div>}

//               <button type="submit">Login</button>
//               <button
//                 type="button"
//                 className="register-btn"
//                 onClick={() => navigate('/register')}
//               >
//                 Register
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//       </div>

//       <Footer />
//     </>
//   );
// };

// export default LoginPage;




// import React, { useState, ChangeEvent, FormEvent } from 'react';
// import './LoginPage.css';
// import { useNavigate } from 'react-router-dom';
// import { setToken } from '../utils/auth';
// import NavBar from './NavBar';
// import './NavBar.css';
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import Footer from './Footer';

// // Import the reCAPTCHA component
// import ReCAPTCHA from 'react-google-recaptcha';

// interface LoginPageProps {}

// const LoginPage: React.FC<LoginPageProps> = () => {
//   const [showLoginForm, setShowLoginForm] = useState(false);
//   const [username, setUsername] = useState<string>('');
//   const [password, setPassword] = useState<string>('');
//   const [errorMsg, setErrorMsg] = useState<string>('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null); // State for reCAPTCHA
//   const navigate = useNavigate();

//   const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setErrorMsg('');

//     // Check if reCAPTCHA was solved
//     if (!recaptchaValue) {
//       setErrorMsg('Please complete the reCAPTCHA.');
//       return;
//     }

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/token/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password, recaptcha: recaptchaValue }),
//       });

//       if (!res.ok) throw new Error('Invalid username or password');
//       const data: { access: string } = await res.json();

//       setToken(data.access);
//       navigate('/home');
//     } catch (err) {
//       if (err instanceof Error) {
//         setErrorMsg(err.message);
//       } else {
//         setErrorMsg('An unknown error occurred');
//       }
//     }
//   };

//   const handleInputChange =
//     (setter: React.Dispatch<React.SetStateAction<string>>) =>
//     (e: ChangeEvent<HTMLInputElement>) => {
//       setter(e.target.value);
//       if (errorMsg) setErrorMsg('');
//     };

//   // Function to handle reCAPTCHA verification
//   const handleRecaptchaChange = (value: string | null) => {
//     setRecaptchaValue(value);
//   };

//   return (
    
//     <>
//       <NavBar profile={null} />
//     <div style={{
//       minHeight: "100vh",
//       display: "flex",
//       flexDirection: "column",
//       justifyContent: "center",
//     }}>
//       <div className={`login-container ${showLoginForm ? 'show-login' : 'hide-login'}`}>
//         <aside className="login-sidebar">
//           <div className="hamburger" onClick={() => setShowLoginForm(!showLoginForm)}>
//             <div className="bar"></div>
//             <div className="bar"></div>
//             <div className="bar"></div>
//           </div>
// <div
//   style={{
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr ",
//     marginLeft:"-10px",
//     alignItems: "center",
//     marginTop: "20px",
//   }}
// >
//   {/* Left column: logo + text */}
//   <div style={{ textAlign: "center" }}>
//     <img
//       src={require("../images/logo.png")}
//       alt="Happy Homes Logo"
//       style={{
//         width: "250px",
//         height: "auto",
//         marginBottom: "15px",
//         marginLeft:"-750px",
       
//       }}
//     />
//     {/* <h1 style={{ fontSize: "28px", margin: "10px 0" }}>Happy Homes</h1>
//     <p style={{ fontSize: "16px", color: "#ccc" }}>Subdivision Imus, Cavite</p> */}
//   </div>

//   {/* Right column: Map */}
//   <div
//     // className="map-container"
//     // style={{
//     //   backgroundColor: "#2b2b2b",
//     //   borderRadius: "10px",
//     //   padding: "5px",
//     // }}
//   >
//     {/* <iframe
//       src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1699!2d120.9444513!3d14.4077212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d3acc860116d%3A0xd1c6dd43386abbdd!2sHappy%20Homes%20Subdivision%2C%20Imus%2C%20Cavite!5e0!3m2!1sen!2sph!4v1693140000000!5m2!1sen!2sph"
//       width="600"
//       height="600"
//       style={{ border: 0, borderRadius: "10px" }}
//       allowFullScreen
//       loading="lazy"
//       referrerPolicy="no-referrer-when-downgrade"
//       title="Happy Homes Satellite Map"
//     ></iframe> */}

    
//   </div>
// {/* <div style={{ textAlign: "center", color: "#fff" }}>
//   <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Contact Us</h2>
//   <p>📞 (02) 123-4567</p>
//   <p>📧 info@happyhomes.com</p>
// </div> */}
// </div>

//         </aside>

//         <main className={`login-main ${showLoginForm ? 'slide-in' : 'slide-out'}`}>
//           <div className="login-box">
//             <img
//               src={require('../images/logo.png')}
//               alt="Logo"
//               className="login-logo-img"
//               style={{
//                 width: 'auto',
//                 height: '90px',
//                 objectFit: 'cover',
//                 margin: '0 auto 16px',
//                 display: 'block',
//                 maxWidth: '100%',
//                 paddingBottom: '10px',
//               }}
//             />
//             {/* <h1 style={{ textAlign: 'center', fontSize: '25px', color: '#2e7d32' }}>Login</h1> */}

//             <form onSubmit={handleLogin}>
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={username}
//                 onChange={handleInputChange(setUsername)}
//                 required
//                 className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />

//               <div className="input-wrapper">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Password"
//                   value={password}
//                   onChange={handleInputChange(setPassword)}
//                   required
//                   className="input-field password-input"
//                 />
//                 <span
//                   onClick={() => setShowPassword(!showPassword)} // Toggling the password visibility
//                   className="toggle-password-icon"
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </span>
//               </div>

//               {/* Google reCAPTCHA */}
//               <div className="recaptcha-container">
//                 <ReCAPTCHA
//                   sitekey="6Lc7-awrAAAAAEUEFyyYa_DQWKg9RUF-PEmuYwfD" // Your site key
//                   onChange={handleRecaptchaChange}
//                 />

//               </div>
//               <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', paddingBottom: '15px' }}>
//                 "I have read, understood, and accept Happy Homes' Privacy Policy and consent to the collection and processing of my information by the company and its authorized parties."
//               </p>
//               <button
//                 type="submit"
//                 className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
//               >
//                 Login
//               </button>

//               <button
//                 type="button"
//                 className="w-full p-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
//                 onClick={() => navigate('/register')}
//               >
//                 Register
//               </button>

//               {errorMsg && <div className="text-red-600 mt-2 text-sm">{errorMsg}</div>}
//             </form>
//           </div>
//         </main>
//       </div>
//       </div>

//       <Footer />
//     </>

    
//   );
// };

// export default LoginPage;
