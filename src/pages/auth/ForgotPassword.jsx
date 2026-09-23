import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import '../client/ClientPortal.css';

export default function ForgotPassword() {
  const { requestForgotPassword, navigateTo } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address format.');
      return;
    }

    setIsSubmitting(true);
    const res = await requestForgotPassword(cleanEmail);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Password reset link has been dispatched to your email.');
    } else {
      setErrorMsg(res.message || 'Unable to process password reset request. Please try again.');
    }
  };

  return (
    <div className="portal-login-page-container animate-fade-in" style={{ padding: '80px 20px', minHeight: '80vh' }}>
      <section className="login-box-section">
        <div className="container flex-center">
          <div className="glass-card login-portal-card" style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
            
            <div className="login-header text-center">
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(197, 168, 128, 0.15)',
                border: '1px solid var(--accent-gold, #c5a880)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px auto'
              }}>
                <Mail className="gold-text" size={28} />
              </div>

              <span className="portal-shield-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <Shield size={12} className="gold-text" /> ACCOUNT SECURITY RECOVERY
              </span>

              <h2 className="login-title">Reset Your Password</h2>
              <p className="login-desc">
                Enter your registered email address below (clients, advocates, or administrators). We will dispatch a secure 15-minute password reset link.
              </p>
            </div>

            {errorMsg && (
              <div className="login-error-alert animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {successMsg ? (
              <div className="animate-fade-in" style={{ textAlign: 'center', padding: '15px 0' }}>
                <div style={{
                  background: 'rgba(46, 204, 113, 0.12)',
                  border: '1px solid #2ecc71',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#2ecc71',
                  fontSize: '0.92rem',
                  lineHeight: '1.5'
                }}>
                  <CheckCircle size={22} style={{ flexShrink: 0 }} />
                  <div style={{ textAlign: 'left' }}>
                    <strong>Reset Link Dispatched</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#e2e8f0', fontSize: '0.85rem' }}>{successMsg}</p>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '20px' }}>
                  Please check your inbox (and spam folder) for the reset instructions. The link is single-use and expires in 15 minutes.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => {
                      setSuccessMsg('');
                      setEmail('');
                    }}
                  >
                    Send to another email
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => navigateTo('#/portal')}
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label className="form-label">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@lawzunction.in or your email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                  <small style={{ display: 'block', marginTop: '6px', color: '#a0aec0', fontSize: '0.78rem' }}>
                    Works for all registered clients, partners, and administrators.
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={isSubmitting}
                  style={{ marginTop: '15px' }}
                >
                  {isSubmitting ? 'Dispatching Reset Link...' : 'Send Password Reset Link'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => navigateTo('#/portal')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c5a880',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>

                  <a
                    href="#/reset-password"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('#/reset-password');
                    }}
                    style={{
                      color: '#a0aec0',
                      fontSize: '0.82rem',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Have a reset token?
                  </a>
                </div>
              </form>
            )}

            <div className="credentials-helper-tip" style={{ marginTop: '25px' }}>
              <Shield size={14} className="gold-text" />
              <div>
                <strong>Security Protection:</strong>
                <p style={{ marginTop: '0.3rem', marginBottom: '0', fontSize: '0.8rem', color: '#a0aec0' }}>
                  Reset links are time-limited (15 minutes), single-use, and cryptographically hashed for institutional security.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
