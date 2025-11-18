import React, { FC, FormEvent, useState } from "react";
import NavBar from "./NavBar";
import "./PageStyles.css";
import { useNotifications } from "./NotificationContext";



const Contact: FC = () => {
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    inquiryType: '',
    fullName: '',
    email: '',
    phone: '',
    message: '',
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!formData.consent) {
    alert('Please accept the terms and conditions to proceed.');
    return;
  }

  setIsSubmitting(true);
  setSubmitStatus('idle');

  try {
    const emailPayload = {
      subject: `New Inquiry: ${formData.inquiryType} from ${formData.fullName}`,
      // HTML-formatted message
      message: `
        New Inquiry Received
        Name:${formData.fullName}
        Email:${formData.email}
        Phone:${formData.phone}
        Inquiry Type:${formData.inquiryType}
        Message:${formData.message.replace(/\n/g, '<br/>')}
      `,
      recipient: "happyphhomes@gmail.com",
      isHtml: true // Ensure your backend interprets this
    };

    const response = await fetch('http://localhost:8000/api/notifications/send-email/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) throw new Error('Failed to send email');

    addNotification(`✅ Inquiry submitted successfully! We'll get back to you soon.`);
    setSubmitStatus('success');
    setFormData({
      inquiryType: '',
      fullName: '',
      email: '',
      phone: '',
      message: '',
      consent: false
    });
    setTimeout(() => setSubmitStatus('idle'), 5000);
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    setSubmitStatus('error');
    addNotification(`❌ Failed to submit inquiry. Please try again or contact us directly.`);
    setTimeout(() => setSubmitStatus('idle'), 5000);
  } finally {
    setIsSubmitting(false);
  }
};

const inquiryTypes = [
  { label: 'Select an option', value: '', disabled: true },
  { label: 'Property Inquiry', value: 'Property Inquiry' },
  { label: 'General Information', value: 'General Information' },
  { label: 'Support Request', value: 'Support Request' },
  { label: 'Partnership', value: 'Partnership' },
  { label: 'Feedback', value: 'Feedback' },
  { label: 'Other', value: 'Other' }
];

  return (
    <>
      <NavBar />
      {/* Hero Section */}
      <div className="hero-section" style={{
        background: 'rgb(83, 138, 99)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '4rem', margin: '0 0 16px 0', fontWeight: '400', letterSpacing: '1px', color: 'white' }}>Contact Us</h1>
          <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Get in touch with our team for any questions about properties, support, or general inquiries
          </p>
        </div>
      </div>

      {/* Contact Grid */}
      <div className="contact-grid" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px 60px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '40px',
        alignItems: 'start'
      }}>
        {/* Form Card */}
        <div className="form-card" style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ color: '#2e6F40', margin: '0 0 20px 0', fontSize: '1.8rem', fontWeight: '600' }}>Send Inquiry</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#333' }}>Inquiry Type *</label>
<select
  name="inquiryType"
  value={formData.inquiryType}
  onChange={handleInputChange}
  required
>
  {inquiryTypes.map((type, index) => (
    <option
      key={index}
      value={type.value}
      disabled={type.disabled || false}
      hidden={index === 0} // hide the placeholder after selection
    >
      {type.label}
    </option>
  ))}
</select>
            </div>
            <div>
              <label>Full Name *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="Enter your full name" />
            </div>
            <div>
              <label>Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Enter your email" />
            </div>
            <div>
              <label>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter your phone number" />
            </div>
            <div>
              <label>Message *</label>
              <textarea name="message" value={formData.message} onChange={handleInputChange} required rows={5} placeholder="Tell us about your inquiry..." />
            </div>
            <div>
              <label>
                <input type="checkbox" name="consent" checked={formData.consent} onChange={handleInputChange} required />
                I accept the Terms and Privacy Policy
              </label>
            </div>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Submit Inquiry'}</button>

            {submitStatus === 'success' && <div>Your inquiry was sent successfully!</div>}
            {submitStatus === 'error' && <div>Something went wrong. Please try again.</div>}
          </form>
        </div>

        {/* Contact Info / Map */}
        <div style={{ background: '#f7f7f7', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          {/* Example content */}
          <h2 style={{ color: '#2e6F40', marginBottom: '20px' }}>Our Contact Info</h2>
          <p>Email: happyphhomes@gmail.com</p>
          <p>Phone: +1 234 567 890</p>
          <p>Address: Happy Homes, Imus, Cavite</p>
          {/* Map placeholder */}
          {/* Contact Info / Map */}
<div className="map-responsive">
  <iframe
    title="Happy Homes Location"
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2397.602078931177!2d120.94677353861209!3d14.407506596514082!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d3acc860116d%3A0xd1c6dd43386abbdd!2sHappy%20Homes%20Subdivision%2C%20Imus%2C%20Cavite!5e1!3m2!1sen!2sph!4v1761660624868!5m2!1sen!2sph"
    allowFullScreen
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  ></iframe>
</div>
        </div>
      </div>
    </>
  );
};

export default Contact;
