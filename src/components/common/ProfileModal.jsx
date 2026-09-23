import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { User, Key, X, CheckCircle, Shield } from 'lucide-react';
import Avatar from './Avatar';
import '../../pages/client/ClientPortal.css';

export default function ProfileModal({ isOpen, onClose }) {
  const { currentUser, changeUserPassword } = useContext(AppContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleClose = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
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
      setErrorMsg('New password must be different from your current password.');
      return;
    }

    setIsSubmitting(true);
    const res = await changeUserPassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrorMsg(res.message || 'Failed to change password. Please verify current password.');
    }
  };

  return (
    <div className="portal-profile-overlay animate-fade-in" onClick={handleClose}>
      <div className="portal-profile-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
        
        <div className="portal-profile-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.2rem' }}>
            <User size={20} className="gold-text" /> Account Profile & Security
          </h3>
          <button 
            type="button"
            className="btn-text" 
            onClick={handleClose}
            aria-label="Close Profile Modal"
            style={{ color: '#a0aec0', cursor: 'pointer', padding: '4px', background: 'none', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="portal-profile-body">
          {/* User Details Card */}
          <div className="portal-profile-details-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Avatar name={currentUser.name} src={currentUser.photo} size={54} />
              <div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>{currentUser.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className="portal-role-badge">{currentUser.role}</span>
                  {currentUser.designation && <span style={{ fontSize: '0.8rem', color: '#c5a880' }}>• {currentUser.designation}</span>}
                </div>
              </div>
            </div>
            <div className="portal-profile-grid">
              <div className="portal-profile-field">
                <label>Full Name</label>
                <p>{currentUser.name}</p>
              </div>
              <div className="portal-profile-field">
                <label>Account Role</label>
                <div>
                  <span className="portal-role-badge">{currentUser.role}</span>
                </div>
              </div>
              <div className="portal-profile-field">
                <label>Registered Email</label>
                <p>{currentUser.email}</p>
              </div>
              <div className="portal-profile-field">
                <label>Contact Phone</label>
                <p>{currentUser.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="portal-change-pass-section">
            <h4 className="portal-change-pass-title">
              <Key size={16} className="gold-text" /> Change Account Password
            </h4>
            <p className="portal-change-pass-desc">
              Enter your current password followed by your new password (minimum 6 characters).
            </p>

            {errorMsg && (
              <div className="login-error-alert animate-fade-in" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="portal-success-badge animate-fade-in">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="portal-password-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-control"
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-control"
                  placeholder="Confirm new secure password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          <div style={{
            marginTop: '1.2rem',
            padding: '10px 14px',
            background: 'rgba(197, 168, 128, 0.08)',
            border: '1px solid rgba(197, 168, 128, 0.2)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#a0aec0'
          }}>
            <Shield size={14} className="gold-text" style={{ flexShrink: 0 }} />
            <span>Passwords are hashed with bcrypt and protected against unauthorized access.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
