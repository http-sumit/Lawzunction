import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Shield, Key, CheckCircle, AlertTriangle, LogOut } from 'lucide-react';
import '../client/ClientPortal.css';

export default function ForceChangePassword() {
  const { currentUser, changeUserPassword, logoutClient } = useContext(AppContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current temporary password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg('New password must be different from your temporary password.');
      return;
    }

    setIsSubmitting(true);
    const res = await changeUserPassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Your password has been successfully updated! Redirecting to dashboard...');
      setTimeout(() => {
        // AppContext state will trigger re-render into protected view
      }, 1000);
    } else {
      setErrorMsg(res.message || 'Failed to update password. Please verify current password.');
    }
  };

  return (
    <div className="portal-login-page-container animate-fade-in" style={{ padding: '60px 20px' }}>
      <section className="login-box-section">
        <div className="container flex-center">
          <div className="glass-card login-portal-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="login-header text-center">
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(197, 168, 128, 0.15)',
                border: '1px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px auto'
              }}>
                <Key className="gold-text" size={28} />
              </div>
              
              <span className="portal-shield-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <Shield size={12} className="gold-text" /> MANDATORY SECURITY VERIFICATION
              </span>

              <h2 className="login-title">First-Time Password Change</h2>
              <p className="login-desc">
                Welcome <strong>{currentUser?.name}</strong> ({currentUser?.role}). An initial temporary password was assigned to your account. You must establish a new permanent password before accessing your attorney workspace.
              </p>
            </div>

            {errorMsg && (
              <div className="login-error-alert animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                <AlertTriangle size={18} /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="green-text animate-fade-in" style={{
                padding: '12px 15px',
                background: 'rgba(46, 204, 113, 0.15)',
                border: '1px solid #2ecc71',
                borderRadius: '6px',
                margin: '0 0 1.2rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}>
                <CheckCircle size={18} /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Current (Temporary) Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter initial password provided by Admin"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password (Min 6 chars)</label>
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
                {isSubmitting ? 'Updating Password...' : 'Save Password & Access Workspace'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              <button 
                type="button" 
                onClick={logoutClient} 
                className="btn-text" 
                style={{ color: '#a0a0a0', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <LogOut size={14} /> Sign out and change password later
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
