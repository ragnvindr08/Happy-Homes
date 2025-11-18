import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResetPassword.css'; // Import the CSS

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const uid = queryParams.get('uid');
  const token = queryParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/password-reset-confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Reset failed.');
        return;
      }

      setSuccessMsg('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setErrorMsg('Something went wrong.');
    }
  };

  if (!uid || !token) {
    return <div>Invalid or missing reset link.</div>;
  }

  return (
    <div className="reset-password-container">
      
      <div className="reset-password-form">
                        <img
                src={require('../images/logo.png')}
                className="logo"
                alt="Logo"
              />
        <h2>Reset Your Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              Show Password
            </label>
          </div>

          {errorMsg && <p className="error">{errorMsg}</p>}
          {successMsg && <p className="success">{successMsg}</p>}

          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
