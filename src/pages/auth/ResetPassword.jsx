import { useState } from 'react';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import '../client/ClientPortal.css';

export default function ResetPassword() {
  const [token, setToken] = useState(() => {
    const hash = window.location.hash || '';
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const urlParams = new URLSearchParams(queryStr);
    return urlParams.get('token') || '';
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    if (!token) {
      setErrorMsg('Invalid or missing password reset token. Please request a new link.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();

      setIsSubmitting(false);

      if (res.ok && data.success) {
        setSuccess(true);
        setMessage(data.message || 'Password successfully updated! You can now log in.');
      } else {
        setErrorMsg(data.message || 'Failed to reset password. Link may be expired.');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Server connection failed. Please try again.');
    }
  };

  return (
    <div className="portal-login-page-container animate-fade-in" style={{ padding: '80px 20px' }}>
      <section className="login-box-section">
        <div className="container flex-center">
          <div className="glass-card login-portal-card" style={{ maxWidth: '450px', margin: '0 auto' }}>
            <div className="login-header text-center">
              <Lock className="lock-icon gold-text" size={36} />
              <h2 className="login-title">Reset Your Password</h2>
              <p className="login-desc">Enter your new secure password below to restore access to your Lawzunction account.</p>
            </div>

            {errorMsg && (
              <div className="login-error-alert animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {success ? (
              <div className="text-center animate-fade-in" style={{ padding: '20px 0' }}>
                <CheckCircle size={48} className="gold-text" style={{ margin: '0 auto 15px auto' }} />
                <h4 style={{ color: '#fff' }}>Password Reset Successful!</h4>
                <p style={{ color: '#a0a0a0', margin: '10px 0 20px 0' }}>{message}</p>
                <a href="#/portal" className="btn btn-primary btn-block">
                  Sign In to Lawzunction Portal
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="login-form">
                {!token && (
                  <div className="form-group">
                    <label className="form-label">Reset Token</label>
                    <input
                      type="text"
                      required
                      placeholder="Paste reset token here..."
                      className="form-control"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
