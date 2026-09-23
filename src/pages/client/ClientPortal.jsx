import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { 
  Shield, Lock, FileText, Upload, Send, CreditCard, LogOut, AlertCircle, 
  RefreshCw, Key, Trash2, CheckCircle, Edit3, AlertTriangle, Eye, Download, 
  UserCheck, Briefcase, Award, Globe, MapPin, ExternalLink, Check, X, 
  Clock, XCircle, Sparkles
} from 'lucide-react';
import { ProfileModal, Avatar } from '../../components/common';
import { canRemoveUser, canEditUser, canAssignRole, getAllowedAssignableRoles, normalizeRole } from '../../utils/rolePermissions';
import './ClientPortal.css';

const ALL_SPECIALIZATIONS = [
  'Criminal', 'Civil', 'Family', 'Corporate', 'Property', 'Cyber', 'Labour', 'Tax', 'Consumer', 'Other'
];

const ALL_LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Punjabi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Urdu', 'Other'
];

export default function ClientPortal() {
  const {
    currentUser,
    setCurrentUser,
    portalCases,
    portalInvoices,
    portalDocuments,
    portalMessages,
    notifications,
    
    // Lawyer Specifics
    lawyerCases,
    lawyerAppointments,
    updateCaseStatus,

    // Admin Specifics
    adminStats,
    adminUsers,
    adminLawyers,
    adminCases,
    adminEnquiries,
    adminJobApplications,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    updateAdminLawyer,
    deleteAdminLawyer,
    approveAdminLawyer,
    rejectAdminLawyer,
    unpublishAdminLawyer,
    fetchLawyerProfile,
    updateLawyerProfile,
    submitLawyerProfileForReview,
    deleteJobApplication,
    assignLawyerToCase,
    updateAdminCase,
    deleteAdminCase,
    deleteEnquiry,
    deleteAllEnquiries,
    updateEnquiryStatus,
    resetUserPassword,

    // Auth actions
    registerClient,
    loginClient,
    logoutClient,
    deleteAccount,
    uploadPortalDocument,
    sendPortalMessage,
    payPortalInvoice,
    changeUserPassword,
    requestForgotPassword
  } = useContext(AppContext);

  // Forced Password Change State (Section 1)
  const [forcedCurrentPass, setForcedCurrentPass] = useState('');
  const [forcedNewPass, setForcedNewPass] = useState('');
  const [forcedConfirmPass, setForcedConfirmPass] = useState('');
  const [forcedPassError, setForcedPassError] = useState('');
  const [forcedPassSuccess, setForcedPassSuccess] = useState('');
  const [isSubmittingForcedPass, setIsSubmittingForcedPass] = useState(false);

  // Lawyer Self-Service Profile State (Section 3)
  const [lawyerProfileData, setLawyerProfileData] = useState({
    name: '',
    phone: '',
    photo: '',
    title: 'Advocate',
    experience: 0,
    specializations: [],
    languages: ['English', 'Hindi'],
    courts: '',
    city: '',
    education: '',
    barCouncilNumber: '',
    bio: '',
    consultationFee: '',
    slug: '',
    profileStatus: 'incomplete',
    rejectionReason: '',
    submittedAt: null,
    approvedAt: null
  });
  const [isSavingLawyerProfile, setIsSavingLawyerProfile] = useState(false);
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  const [lawyerProfileFeedback, setLawyerProfileFeedback] = useState(null);
  const [lawyerProfileLoaded, setLawyerProfileLoaded] = useState(false);

  // Admin Lawyer Approval & Filter State (Section 4)
  const [lawyerStatusFilter, setLawyerStatusFilter] = useState('all');
  const [lawyerToReject, setLawyerToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [rejectModalError, setRejectModalError] = useState('');

  // Admin Reset User Password State
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [tempResetPassInput, setTempResetPassInput] = useState('');
  const [isResettingPass, setIsResettingPass] = useState(false);

  // Admin Edit User State
  const [userToEdit, setUserToEdit] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('CLIENT');
  const [editDesignation, setEditDesignation] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [userEditError, setUserEditError] = useState('');

  // Admin Delete User State
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userDeleteError, setUserDeleteError] = useState('');

  // Admin Advocate/Lawyer Edit & Delete State
  const [lawyerToEdit, setLawyerToEdit] = useState(null);
  const [editLawyerForm, setEditLawyerForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: 'Advocate',
    experience: 3,
    barCouncilNumber: '',
    status: 'ACTIVE',
    specializations: '',
    languages: 'English, Hindi',
    education: '',
    linkedin: '',
    bio: '',
    photo: '',
    courts: '',
    city: '',
    consultationFee: '',
    profileStatus: 'incomplete'
  });
  const [isSavingLawyer, setIsSavingLawyer] = useState(false);
  const [lawyerEditError, setLawyerEditError] = useState('');
  const [lawyerActionFeedback, setLawyerActionFeedback] = useState(null);
  const [isDeletingLawyerId, setIsDeletingLawyerId] = useState(null);
  const [lawyerToDelete, setLawyerToDelete] = useState(null);
  const [isDeletingLawyer, setIsDeletingLawyer] = useState(false);
  const [lawyerDeleteError, setLawyerDeleteError] = useState('');

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  // Registration state
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  // Profile & Change Password Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangePassError('');
    setChangePassSuccess('');

    if (!currentPassInput || !newPassInput) {
      setChangePassError('Please enter both your current and new password.');
      return;
    }

    if (newPassInput.length < 6) {
      setChangePassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setChangePassError('New password and confirmation password do not match.');
      return;
    }

    setIsChangingPass(true);
    const res = await changeUserPassword(currentPassInput, newPassInput);
    setIsChangingPass(false);

    if (res.success) {
      setChangePassSuccess(res.message || 'Password successfully updated!');
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
    } else {
      setChangePassError(res.message || 'Failed to update password.');
    }
  };

  // 1. Forced Password Change Handler
  const handleForcedPasswordSubmit = async (e) => {
    e.preventDefault();
    setForcedPassError('');
    setForcedPassSuccess('');

    if (!forcedCurrentPass || !forcedNewPass || !forcedConfirmPass) {
      setForcedPassError('Please complete all password fields.');
      return;
    }

    if (forcedNewPass.length < 6) {
      setForcedPassError('New password must be at least 6 characters long.');
      return;
    }

    if (forcedNewPass === forcedCurrentPass) {
      setForcedPassError('New password must differ from your temporary administrator password.');
      return;
    }

    if (forcedNewPass !== forcedConfirmPass) {
      setForcedPassError('New password and confirmation password do not match.');
      return;
    }

    setIsSubmittingForcedPass(true);
    const res = await changeUserPassword(forcedCurrentPass, forcedNewPass);
    setIsSubmittingForcedPass(false);

    if (res.success) {
      setForcedPassSuccess('Password successfully set! Unlocking your workspace...');
      setForcedCurrentPass('');
      setForcedNewPass('');
      setForcedConfirmPass('');
      if (currentUser) {
        setCurrentUser(prev => ({ ...prev, mustChangePassword: false }));
      }
    } else {
      setForcedPassError(res.message || 'Failed to update password.');
    }
  };

  // 2. Lawyer Self-Service Profile Auto-loader
  useEffect(() => {
    const hasLawyerProfile = currentUser && (currentUser.role === 'LAWYER' || currentUser.lawyerProfile || currentUser.lawyerProfileId);
    if (currentUser && hasLawyerProfile && !currentUser.mustChangePassword) {
      fetchLawyerProfile().then(res => {
        if (res.success && res.profile) {
          setLawyerProfileData({
            name: res.profile.name || currentUser.name || '',
            phone: res.profile.phone || currentUser.phone || '',
            photo: res.profile.photo || '',
            title: res.profile.title || 'Advocate',
            experience: res.profile.experience !== undefined ? res.profile.experience : 0,
            specializations: res.profile.specializations || [],
            languages: res.profile.languages || ['English', 'Hindi'],
            courts: res.profile.courts || '',
            city: res.profile.city || '',
            education: res.profile.education || '',
            barCouncilNumber: res.profile.barCouncilNumber || '',
            bio: res.profile.bio || '',
            consultationFee: res.profile.consultationFee || '',
            slug: res.profile.slug || '',
            profileStatus: res.profile.profileStatus || 'incomplete',
            rejectionReason: res.profile.rejectionReason || '',
            submittedAt: res.profile.submittedAt || null,
            approvedAt: res.profile.approvedAt || null
          });
          setLawyerProfileLoaded(true);
        }
      }).catch(err => {
        console.error('Failed to auto-load lawyer profile:', err?.message || err);
      });
    }
  }, [currentUser]);

  // 3. Specialization & Language Toggles
  const handleToggleSpecialization = (spec) => {
    setLawyerProfileData(prev => {
      const exists = prev.specializations.includes(spec);
      const updated = exists 
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec];
      return { ...prev, specializations: updated };
    });
  };

  const handleToggleLanguage = (lang) => {
    setLawyerProfileData(prev => {
      const exists = prev.languages.includes(lang);
      const updated = exists 
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang];
      return { ...prev, languages: updated };
    });
  };

  const handleLawyerSelfPhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLawyerProfileFeedback({
        type: 'error',
        text: 'Invalid file format. Please upload JPG, PNG, or WEBP image.'
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLawyerProfileFeedback({
        type: 'error',
        text: 'Profile photo size exceeds 2 MB. Please select a smaller image.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setLawyerProfileData(prev => ({
        ...prev,
        photo: loadEvt.target.result
      }));
      setLawyerProfileFeedback({
        type: 'success',
        text: 'Photo selected. Click "Save Draft" to persist your changes.'
      });
    };
    reader.readAsDataURL(file);
  };

  // 4. Calculate Profile Completion (9 required fields)
  const calculateProfileCompletion = () => {
    const reqs = [
      { key: 'photo', name: 'Profile Photo', valid: Boolean(lawyerProfileData.photo && lawyerProfileData.photo.trim()) },
      { key: 'specializations', name: 'Specialization (1+)', valid: Boolean(lawyerProfileData.specializations && lawyerProfileData.specializations.length > 0) },
      { key: 'experience', name: 'Years of Experience', valid: Boolean(lawyerProfileData.experience !== undefined && lawyerProfileData.experience !== null && lawyerProfileData.experience !== '' && Number(lawyerProfileData.experience) >= 0) },
      { key: 'languages', name: 'Languages (1+)', valid: Boolean(lawyerProfileData.languages && lawyerProfileData.languages.length > 0) },
      { key: 'courts', name: 'Courts of Practice', valid: Boolean(lawyerProfileData.courts && lawyerProfileData.courts.trim().length > 0) },
      { key: 'city', name: 'City', valid: Boolean(lawyerProfileData.city && lawyerProfileData.city.trim().length > 0) },
      { key: 'education', name: 'Education & Qualifications', valid: Boolean(lawyerProfileData.education && lawyerProfileData.education.trim().length > 0) },
      { key: 'barCouncilNumber', name: 'Bar Council Registration', valid: Boolean(lawyerProfileData.barCouncilNumber && lawyerProfileData.barCouncilNumber.trim().length > 0) },
      { key: 'bio', name: 'Short Professional Bio', valid: Boolean(lawyerProfileData.bio && lawyerProfileData.bio.trim().length > 0) }
    ];

    const completed = reqs.filter(r => r.valid).length;
    const percentage = Math.round((completed / reqs.length) * 100);
    const missing = reqs.filter(r => !r.valid);
    return { percentage, completed, total: reqs.length, missing, reqs };
  };

  const handleSaveLawyerProfileDraft = async (e) => {
    if (e) e.preventDefault();
    setIsSavingLawyerProfile(true);
    setLawyerProfileFeedback(null);

    const res = await updateLawyerProfile(lawyerProfileData);
    setIsSavingLawyerProfile(false);

    if (res.success) {
      if (res.profile) {
        setLawyerProfileData(prev => ({
          ...prev,
          ...res.profile
        }));
      }
      setLawyerProfileFeedback({
        type: 'success',
        text: res.sensitiveFieldChanged
          ? 'Sensitive details updated (Name, Bar Council No., or Specializations). Your profile has been placed back in review.'
          : 'Profile details saved successfully.'
      });
      setTimeout(() => setLawyerProfileFeedback(null), 6000);
    } else {
      setLawyerProfileFeedback({
        type: 'error',
        text: res.message || 'Failed to save profile details.'
      });
    }
  };

  const handleSubmitProfileForReview = async () => {
    const { percentage, missing } = calculateProfileCompletion();
    if (percentage < 100) {
      setLawyerProfileFeedback({
        type: 'error',
        text: `Cannot submit for review: Please complete the following required fields first: ${missing.map(m => m.name).join(', ')}.`
      });
      return;
    }

    setIsSubmittingForReview(true);
    setLawyerProfileFeedback(null);

    const saveRes = await updateLawyerProfile(lawyerProfileData);
    if (!saveRes.success) {
      setIsSubmittingForReview(false);
      setLawyerProfileFeedback({
        type: 'error',
        text: saveRes.message || 'Failed to save changes before submission.'
      });
      return;
    }

    const res = await submitLawyerProfileForReview();
    setIsSubmittingForReview(false);

    if (res.success) {
      setLawyerProfileData(prev => ({
        ...prev,
        profileStatus: 'pending_review',
        submittedAt: new Date()
      }));
      setLawyerProfileFeedback({
        type: 'success',
        text: 'Profile submitted successfully! Lawzunction administrators have been notified at lawzunction@gmail.com. You will receive an email once approved and live.'
      });
    } else {
      setLawyerProfileFeedback({
        type: 'error',
        text: res.message || 'Failed to submit profile for review.'
      });
    }
  };

  // 5. Admin Approval & Moderation Actions
  const handleApproveLawyer = async (lawyer) => {
    const targetId = lawyer.id || lawyer.userId;
    const res = await approveAdminLawyer(targetId);
    if (res.success) {
      setLawyerActionFeedback({
        type: 'success',
        text: `Advocate "${lawyer.name}" profile has been approved and published to the directory.`
      });
      setTimeout(() => setLawyerActionFeedback(null), 5000);
    } else {
      setLawyerActionFeedback({
        type: 'error',
        text: res.message || 'Failed to approve advocate profile.'
      });
      setTimeout(() => setLawyerActionFeedback(null), 5000);
    }
  };

  const handleUnpublishLawyer = async (lawyer) => {
    const targetId = lawyer.id || lawyer.userId;
    const res = await unpublishAdminLawyer(targetId);
    if (res.success) {
      setLawyerActionFeedback({
        type: 'success',
        text: `Advocate "${lawyer.name}" profile has been unpublished.`
      });
      setTimeout(() => setLawyerActionFeedback(null), 5000);
    } else {
      setLawyerActionFeedback({
        type: 'error',
        text: res.message || 'Failed to unpublish advocate profile.'
      });
      setTimeout(() => setLawyerActionFeedback(null), 5000);
    }
  };

  const handleConfirmRejectLawyer = async (e) => {
    e.preventDefault();
    if (!lawyerToReject) return;
    if (!rejectReason.trim()) {
      setRejectModalError('A rejection reason is mandatory.');
      return;
    }

    setIsSubmittingReject(true);
    setRejectModalError('');

    const targetId = lawyerToReject.id || lawyerToReject.userId;
    const res = await rejectAdminLawyer(targetId, rejectReason.trim());
    setIsSubmittingReject(false);

    if (res.success) {
      setLawyerToReject(null);
      setRejectReason('');
      setLawyerActionFeedback({
        type: 'success',
        text: `Advocate "${lawyerToReject.name}" profile rejected. Guidance email dispatched.`
      });
      setTimeout(() => setLawyerActionFeedback(null), 5000);
    } else {
      setRejectModalError(res.message || 'Failed to reject advocate profile.');
    }
  };


  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccessMsg('');
    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your account email address.');
      return;
    }
    setIsSendingForgot(true);
    const res = await requestForgotPassword(forgotEmail.trim());
    setIsSendingForgot(false);
    if (res.success) {
      setForgotSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message || 'Failed to send reset link.');
    }
  };

  // Portal tabs (Shared selector)
  const [activeTab, setActiveTab] = useState('cases'); // cases, docs, billing, messages
  const [adminTab, setAdminTab] = useState('stats'); // stats, users, cases, enquiries, logs
  const [lawyerTab, setLawyerTab] = useState('cases'); // cases, appointments

  // Messaging state
  const [typedMessage, setTypedMessage] = useState('');

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  // Billing checkout state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPayingInvoice, setIsPayingInvoice] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Lawyer Update Status Modal State
  const [selectedCaseForUpdate, setSelectedCaseForUpdate] = useState(null);
  const [caseStatusInput, setCaseStatusInput] = useState('IN_PROGRESS');
  const [caseProgressInput, setCaseProgressInput] = useState(0);
  const [caseUpdateInput, setCaseUpdateInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Admin Case Assign State
  const [selectedCaseForAssign, setSelectedCaseForAssign] = useState(null);
  const [assignedLawyerIdInput, setAssignedLawyerIdInput] = useState('');
  const [isAssigningLawyer, setIsAssigningLawyer] = useState(false);

  // Admin Edit Case State
  const [selectedCaseForEdit, setSelectedCaseForEdit] = useState(null);
  const [editCaseForm, setEditCaseForm] = useState({
    title: '',
    caseNumber: '',
    caseType: 'Corporate Law',
    lawyerProfileId: '',
    status: 'IN_PROGRESS',
    progress: 0,
    hearingDate: '',
    deadline: '',
    description: '',
    lastUpdate: ''
  });
  const [isUpdatingCase, setIsUpdatingCase] = useState(false);
  const [caseActionFeedback, setCaseActionFeedback] = useState(null);
  const [isDeletingCaseId, setIsDeletingCaseId] = useState(null);

  // Admin Enquiry Action State
  const [enquiryActionFeedback, setEnquiryActionFeedback] = useState(null);
  const [isDeletingEnquiryId, setIsDeletingEnquiryId] = useState(null);
  const [isDeletingAllEnquiries, setIsDeletingAllEnquiries] = useState(false);

  // Admin New User Creation State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('CLIENT');
  const [newLawyerTitle, setNewLawyerTitle] = useState('Senior Associate');
  const [newLawyerExp, setNewLawyerExp] = useState(3);
  const [newLawyerBio, setNewLawyerBio] = useState('');
  const [newLawyerEdu, setNewLawyerEdu] = useState('');
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  const handleAdminResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserForReset || !tempResetPassInput) return;

    setIsResettingPass(true);
    const res = await resetUserPassword(selectedUserForReset.id, tempResetPassInput);
    setIsResettingPass(false);

    if (res.success) {
      alert(res.message);
      setSelectedUserForReset(null);
      setTempResetPassInput('');
    } else {
      alert(res.message || 'Failed to reset password.');
    }
  };

  const handleStartEditUser = (u) => {
    setUserEditError('');
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditRole(normalizeRole(u.role) || 'CLIENT');
    setEditDesignation(u.designation || u.profileDetails?.title || u.profileDetails?.company || '');
    setUserToEdit(u);
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!userToEdit) return;
    setUserEditError('');

    if (!editName.trim()) {
      setUserEditError('User name is required.');
      return;
    }
    if (!editEmail.trim()) {
      setUserEditError('User email address is required.');
      return;
    }

    // Role-change confirmation dialog
    if (normalizeRole(editRole) !== normalizeRole(userToEdit.role)) {
      const proceed = window.confirm(`This will change ${userToEdit.name}'s role from "${userToEdit.role}" to "${editRole}". Continue?`);
      if (!proceed) return;
    }

    setIsSavingEdit(true);
    const res = await updateAdminUser(userToEdit.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
      designation: editDesignation.trim(),
      company: editDesignation.trim()
    });
    setIsSavingEdit(false);

    if (res.success) {
      setAdminSuccessMsg(res.message || `User "${userToEdit.name}" updated successfully.`);
      setUserToEdit(null);
      setTimeout(() => setAdminSuccessMsg(''), 5000);
    } else {
      setUserEditError(res.message || 'Failed to update user details.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setUserDeleteError('');
    setIsDeletingUser(true);
    const res = await deleteAdminUser(userToDelete.id);
    setIsDeletingUser(false);

    if (res.success) {
      setAdminSuccessMsg(res.message || `User "${userToDelete.name}" successfully removed.`);
      setUserToDelete(null);
      setTimeout(() => setAdminSuccessMsg(''), 5000);
    } else {
      setUserDeleteError(res.message || 'Failed to remove user account.');
    }
  };

  // --- LAWYER / ADVOCATE MANAGEMENT HANDLERS (Task 2) ---
  const handleStartEditLawyer = (l) => {
    setLawyerEditError('');
    const profile = l.profileDetails || {};
    const specs = Array.isArray(l.specializations)
      ? l.specializations.join(', ')
      : (Array.isArray(profile.specializations) ? profile.specializations.join(', ') : (l.specializations || ''));
    const langs = Array.isArray(l.languages)
      ? l.languages.join(', ')
      : (Array.isArray(profile.languages) ? profile.languages.join(', ') : (l.languages || 'English, Hindi'));

    setEditLawyerForm({
      name: l.name || '',
      email: l.email || '',
      phone: l.phone || '',
      title: l.title || l.designation || profile.title || 'Advocate',
      experience: l.experience ?? profile.experience ?? 3,
      barCouncilNumber: l.barCouncilNumber || profile.barCouncilNumber || '',
      status: l.status || profile.status || 'ACTIVE',
      specializations: specs,
      languages: langs,
      education: l.education || profile.education || '',
      linkedin: l.linkedin || profile.linkedin || '',
      bio: l.bio || profile.bio || '',
      photo: l.photo || profile.photo || '',
      courts: l.courts || profile.courts || '',
      city: l.city || profile.city || '',
      consultationFee: l.consultationFee ?? profile.consultationFee ?? '',
      profileStatus: l.profileStatus || profile.profileStatus || 'incomplete'
    });
    setLawyerToEdit(l);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLawyerEditError('Invalid file type. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    // Validate size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setLawyerEditError('Image size exceeds 2 MB. Please select a smaller photo.');
      return;
    }

    setLawyerEditError('');
    const reader = new FileReader();
    reader.onload = () => {
      setEditLawyerForm(prev => ({ ...prev, photo: reader.result }));
    };
    reader.onerror = () => {
      setLawyerEditError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLawyerEdit = async (e) => {
    e.preventDefault();
    if (!lawyerToEdit) return;
    setLawyerEditError('');

    if (!editLawyerForm.name.trim()) {
      setLawyerEditError('Advocate name is required.');
      return;
    }
    if (!editLawyerForm.email.trim()) {
      setLawyerEditError('Email address is required.');
      return;
    }

    setIsSavingLawyer(true);
    const targetId = lawyerToEdit.lawyerProfileId || lawyerToEdit.id || lawyerToEdit._id;
    const res = await updateAdminLawyer(targetId, editLawyerForm);
    setIsSavingLawyer(false);

    if (res.success) {
      setLawyerActionFeedback({ type: 'success', text: res.message || `Advocate "${editLawyerForm.name}" updated successfully.` });
      setLawyerToEdit(null);
      setTimeout(() => setLawyerActionFeedback(null), 5000);
    } else {
      setLawyerEditError(res.message || 'Failed to update advocate details.');
    }
  };

  const handleStartDeleteLawyer = (l) => {
    setLawyerDeleteError('');
    setLawyerToDelete(l);
  };

  const handleConfirmDeleteLawyer = async () => {
    if (!lawyerToDelete) return;
    setLawyerDeleteError('');
    setIsDeletingLawyer(true);

    const targetId = lawyerToDelete.lawyerProfileId || lawyerToDelete.id || lawyerToDelete._id;
    const res = await deleteAdminLawyer(targetId);
    setIsDeletingLawyer(false);

    if (res.success) {
      setLawyerActionFeedback({ type: 'success', text: res.message || `Advocate "${lawyerToDelete.name}" removed successfully.` });
      setLawyerToDelete(null);
      setTimeout(() => setLawyerActionFeedback(null), 5000);
    } else {
      setLawyerDeleteError(res.message || 'Failed to delete advocate.');
    }
  };

  const allowedRolesForRequester = getAllowedAssignableRoles(currentUser?.role);

  const combinedLawyers = (adminLawyers && adminLawyers.length > 0)
    ? adminLawyers
    : (adminUsers || []).filter(u => u.role === 'LAWYER' || u.profileDetails?.id || u.lawyerProfileId || u.lawyerProfile).map(u => ({
        id: u.id,
        userId: u.id,
        lawyerProfileId: u.profileDetails?.id || u.lawyerProfileId || u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        title: u.designation || u.profileDetails?.title || 'Advocate',
        experience: u.profileDetails?.experience || 0,
        barCouncilNumber: u.profileDetails?.barCouncilNumber || '',
        status: u.profileDetails?.status || 'ACTIVE',
        specializations: u.profileDetails?.specializations || [],
        languages: u.profileDetails?.languages || ['English', 'Hindi'],
        education: u.profileDetails?.education || '',
        linkedin: u.profileDetails?.linkedin || '',
        bio: u.profileDetails?.bio || '',
        photo: u.photo || u.profileDetails?.photo || '',
        courts: u.profileDetails?.courts || '',
        city: u.profileDetails?.city || '',
        consultationFee: u.profileDetails?.consultationFee || '',
        profileStatus: u.profileDetails?.profileStatus || 'incomplete',
        rejectionReason: u.profileDetails?.rejectionReason || '',
        slug: u.profileDetails?.slug || '',
        casesCount: (adminCases || []).filter(c => c.lawyerId === u.profileDetails?.id || c.lawyerId === u.id).length,
        profileDetails: u.profileDetails || {}
      }));

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegistering) {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      const res = await registerClient(name, company, email, phone, password);
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setName('');
        setCompany('');
        setPhone('');
        setEmail('');
        setPassword('');
      }
    } else {
      const res = await loginClient(email, password);
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setEmail('');
        setPassword('');
      }
    }
  };

  const handleMessageSend = (e) => {
    e.preventDefault();
    if (typedMessage.trim()) {
      sendPortalMessage(typedMessage);
      setTypedMessage('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleDocUpload = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadPercent(20);

    const interval = setInterval(() => {
      setUploadPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(async () => {
            try {
              await uploadPortalDocument(uploadFile);
            } catch (err) {
              console.error('Error uploading document:', err);
              alert(err?.message || 'Failed to upload document');
            } finally {
              setIsUploading(false);
              setUploadFile(null);
            }
          }, 500);
          return 100;
        }
        return prev + 40;
      });
    }, 250);
  };

  const triggerPayInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsPayingInvoice(true);
    setTimeout(async () => {
      try {
        await payPortalInvoice(selectedInvoice.id);
        alert(`Payment of ${selectedInvoice.amount} for ${selectedInvoice.id} successfully processed. E-receipt sent to your inbox.`);
        setSelectedInvoice(null);
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
      } catch (err) {
        console.error('Error paying invoice:', err);
        alert(err?.message || 'Failed to process invoice payment');
      } finally {
        setIsPayingInvoice(false);
      }
    }, 2000);
  };

  // Lawyer Update Handler
  const handleLawyerStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCaseForUpdate) return;
    
    setIsUpdatingStatus(true);
    const success = await updateCaseStatus(
      selectedCaseForUpdate.id,
      caseStatusInput,
      caseProgressInput,
      caseUpdateInput
    );
    setIsUpdatingStatus(false);
    if (success) {
      alert('Case status details successfully updated.');
      setSelectedCaseForUpdate(null);
      setCaseUpdateInput('');
    } else {
      alert('Failed to update case status.');
    }
  };

  // Admin Case Allocation Handler
  const handleCaseAllocationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCaseForAssign) return;

    setIsAssigningLawyer(true);
    const success = await assignLawyerToCase(selectedCaseForAssign.id, assignedLawyerIdInput);
    setIsAssigningLawyer(false);
    if (success) {
      alert('Case successfully allocated to selected lawyer.');
      setSelectedCaseForAssign(null);
      setAssignedLawyerIdInput('');
    } else {
      alert('Failed to assign lawyer.');
    }
  };

  // Admin Case Edit & Delete Handlers
  const handleStartEditCase = (cs) => {
    setSelectedCaseForEdit(cs);
    const lId = cs.lawyer?._id || cs.lawyerId || (cs.lawyer?.user?._id ? cs.lawyer._id : '');
    setEditCaseForm({
      title: cs.title || '',
      caseNumber: cs.caseNumber || '',
      caseType: cs.caseType || 'Corporate Law',
      lawyerProfileId: lId || '',
      status: cs.status || 'IN_PROGRESS',
      progress: cs.progress ?? 0,
      hearingDate: cs.hearingDate || '',
      deadline: cs.deadline || '',
      description: cs.description || '',
      lastUpdate: cs.lastUpdate || ''
    });
    setCaseActionFeedback(null);
  };

  const handleCaseEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCaseForEdit) return;

    if (!editCaseForm.title.trim()) {
      setCaseActionFeedback({ type: 'error', text: 'Case title is required.' });
      return;
    }

    setIsUpdatingCase(true);
    setCaseActionFeedback(null);
    const caseId = selectedCaseForEdit.id || selectedCaseForEdit._id;
    const res = await updateAdminCase(caseId, editCaseForm);
    setIsUpdatingCase(false);

    if (res.success) {
      setCaseActionFeedback({ type: 'success', text: `Case "${editCaseForm.title}" updated successfully.` });
      setTimeout(() => {
        setSelectedCaseForEdit(null);
        setCaseActionFeedback(null);
      }, 1500);
    } else {
      setCaseActionFeedback({ type: 'error', text: res.message || 'Failed to update case.' });
    }
  };

  const handleDeleteCase = async (cs) => {
    const caseId = cs.id || cs._id;
    const caseTitle = cs.title || cs.caseNumber || 'this case';
    if (!window.confirm(`Are you sure? This cannot be undone.\n\nPermanently delete case "${caseTitle}" and all linked records?`)) {
      return;
    }

    setIsDeletingCaseId(caseId);
    setCaseActionFeedback(null);
    const res = await deleteAdminCase(caseId);
    setIsDeletingCaseId(null);

    if (res.success) {
      setCaseActionFeedback({ type: 'success', text: `Case "${caseTitle}" successfully deleted.` });
      setTimeout(() => setCaseActionFeedback(null), 4000);
    } else {
      setCaseActionFeedback({ type: 'error', text: res.message || 'Failed to delete case.' });
      setTimeout(() => setCaseActionFeedback(null), 5000);
    }
  };

  // Enquiry Delete Handlers
  const handleDeleteEnquiry = async (eq) => {
    const eqId = eq.id || eq._id;
    const sender = eq.name || 'this visitor';
    if (!window.confirm(`Are you sure you want to delete the enquiry from "${sender}"?`)) {
      return;
    }

    setIsDeletingEnquiryId(eqId);
    setEnquiryActionFeedback(null);
    const res = await deleteEnquiry(eqId);
    setIsDeletingEnquiryId(null);

    if (res.success) {
      setEnquiryActionFeedback({ type: 'success', text: `Enquiry from "${sender}" successfully deleted.` });
      setTimeout(() => setEnquiryActionFeedback(null), 3500);
    } else {
      setEnquiryActionFeedback({ type: 'error', text: res.message || 'Failed to delete enquiry.' });
      setTimeout(() => setEnquiryActionFeedback(null), 4500);
    }
  };

  const handleDeleteAllEnquiries = async () => {
    const totalCount = adminEnquiries?.length || 0;
    if (totalCount === 0) {
      alert('There are no visitor intake enquiries to delete.');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ CRITICAL CONFIRMATION: DELETE ALL ENQUIRIES\n\n` +
      `Are you sure you want to permanently delete ALL ${totalCount} visitor intake enquiries?\n\n` +
      `This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeletingAllEnquiries(true);
    setEnquiryActionFeedback(null);
    const res = await deleteAllEnquiries();
    setIsDeletingAllEnquiries(false);

    if (res.success) {
      setEnquiryActionFeedback({ type: 'success', text: `All ${res.count || totalCount} visitor intake enquiries permanently deleted.` });
      setTimeout(() => setEnquiryActionFeedback(null), 4000);
    } else {
      setEnquiryActionFeedback({ type: 'error', text: res.message || 'Failed to delete all enquiries.' });
      setTimeout(() => setEnquiryActionFeedback(null), 5000);
    }
  };

  // Admin New User Handler
  const handleAdminCreateUserSubmit = async (e) => {
    e.preventDefault();
    setAdminSuccessMsg('');
    setErrorMsg('');

    const userData = {
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      password: newUserPassword,
      role: newUserRole
    };

    if (newUserRole === 'LAWYER') {
      userData.details = {
        title: newLawyerTitle,
        experience: newLawyerExp,
        bio: newLawyerBio,
        education: newLawyerEdu
      };
    }

    const res = await createAdminUser(userData);
    if (res.success) {
      setAdminSuccessMsg(`${newUserRole} successfully created!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserPassword('');
      setNewLawyerBio('');
      setNewLawyerEdu('');
    } else {
      setErrorMsg(res.message || 'Creation failed');
    }
  };

  // Career Application Action Handlers
  const handleViewResume = (app) => {
    const token = localStorage.getItem('lawz_jwt_token');
    const appId = app.id || app._id;
    const url = `/api/admin/job-applications/${appId}/resume?token=${encodeURIComponent(token || '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadResume = (app) => {
    const token = localStorage.getItem('lawz_jwt_token');
    const appId = app.id || app._id;
    const url = `/api/admin/job-applications/${appId}/resume?download=true&token=${encodeURIComponent(token || '')}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = app.fileName || 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteCareerApplication = async (appId, candidateName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the career application from "${candidateName || 'Candidate'}"?`)) {
      return;
    }
    const res = await deleteJobApplication(appId);
    if (res && res.success) {
      alert('Career application successfully deleted.');
    } else {
      alert(res?.message || 'Failed to delete application.');
    }
  };

  // --- REUSABLE PROFILE & SECURITY TAB SECTION ---
  const renderProfileSection = (title, subtitle) => {
    return (
      <div className="portal-profile-tab animate-fade-in">
        <h3 className="workspace-title">{title}</h3>
        <p className="workspace-desc">{subtitle}</p>

        <div className="portal-profile-details-card glass-card" style={{ maxWidth: '680px', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Avatar name={currentUser.name} src={currentUser.photo} size={64} />
            <div>
              <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>{currentUser.name}</h4>
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

          <hr className="portal-section-divider" />

          <div className="portal-change-pass-section">
            <h4 className="portal-change-pass-title">
              <Key size={16} className="gold-text" /> Change Account Password
            </h4>
            <p className="portal-change-pass-desc">
              Enter your current password and set a new password (min 6 characters).
            </p>

            {changePassError && (
              <div className="login-error-alert animate-fade-in" style={{ marginBottom: '1rem' }}>{changePassError}</div>
            )}

            {changePassSuccess && (
              <div className="portal-success-badge animate-fade-in">
                <CheckCircle size={16} /> {changePassSuccess}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="portal-password-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
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
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
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
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isChangingPass}
                >
                  {isChangingPass ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderProfileModal = () => (
    <ProfileModal 
      isOpen={showProfileModal} 
      onClose={() => {
        setShowProfileModal(false);
        setChangePassError('');
        setChangePassSuccess('');
      }} 
    />
  );

  // --- UNAUTHENTICATED: LOGIN/REGISTER/FORGOT PASSWORD VIEW ---
  if (!currentUser) {

    return (
      <div className="portal-login-page-container animate-fade-in">
        <section className="login-box-section">
          <div className="container flex-center">
            <div className="glass-card login-portal-card">
              {isForgotPassword ? (
                <>
                  <div className="login-header text-center">
                    <Key className="lock-icon gold-text" size={36} />
                    <h2 className="login-title">Reset Your Password</h2>
                    <p className="login-desc">
                      Enter your registered email address below to receive password reset instructions.
                    </p>
                  </div>

                  {errorMsg && <div className="login-error-alert animate-fade-in">{errorMsg}</div>}
                  {forgotSuccessMsg && (
                    <div className="login-error-alert animate-fade-in" style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', borderColor: 'var(--color-success)', color: '#2ecc71' }}>
                      {forgotSuccessMsg}
                    </div>
                  )}

                  {!forgotSuccessMsg ? (
                    <form onSubmit={handleForgotPasswordSubmit} className="login-form">
                      <div className="form-group">
                        <label className="form-label">Registered Email</label>
                        <input
                          type="email"
                          required
                          placeholder="client@lawzunction.in"
                          className="form-control"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary btn-block" disabled={isSendingForgot}>
                        {isSendingForgot ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                      </button>
                    </form>
                  ) : null}

                  <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsForgotPassword(false);
                        setForgotSuccessMsg('');
                        setErrorMsg('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#c5a880', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="login-header text-center">
                    <Lock className="lock-icon gold-text" size={36} />
                    <h2 className="login-title">{isRegistering ? 'Register Client Account' : 'Lawzunction Portal Access'}</h2>
                    <p className="login-desc">
                      {isRegistering 
                        ? 'Create an account to track active legal matters, documents, and invoicing.' 
                        : 'Secure privileged access for clients, advocates, and administrators.'}
                    </p>
                  </div>

                  {errorMsg && <div className="login-error-alert animate-fade-in">{errorMsg}</div>}

                  <form onSubmit={handleAuthSubmit} className="login-form">
                    {isRegistering && (
                      <>
                        <div className="form-group animate-fade-in">
                          <label className="form-label">Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Vikas Singhal"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div className="form-group animate-fade-in">
                          <label className="form-label">Company Name (Optional)</label>
                          <input
                            type="text"
                            placeholder="Singhal Tech Systems"
                            className="form-control"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                          />
                        </div>
                        <div className="form-group animate-fade-in">
                          <label className="form-label">Phone Number (Optional)</label>
                          <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            className="form-control"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    <div className="form-group">
                      <label className="form-label">{isRegistering ? 'Client Email' : 'Registered Email Address'}</label>
                      <input
                        type="email"
                        required
                        placeholder={isRegistering ? 'client@company.com' : 'advocate@lawzunction.in or registered email'}
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Password</label>
                        {!isRegistering && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(true);
                              setForgotEmail(email);
                              setErrorMsg('');
                              setForgotSuccessMsg('');
                            }}
                            style={{ background: 'none', border: 'none', color: '#c5a880', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block">
                      {isRegistering ? 'Create Client Account' : 'Secure Sign In'}
                    </button>
                  </form>

                  <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setErrorMsg('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#c5a880', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}
                    >
                      {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register here'}
                    </button>
                  </div>

                  <div className="credentials-helper-tip">
                    <Shield size={14} className="gold-text" />
                    <div>
                      <strong>Secure Portal Access:</strong>
                      <p style={{ marginTop: '0.3rem', marginBottom: '0.2rem' }}>
                        Authorized advocates, corporate clients, and administrators may sign in using their registered email and secure password.
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Need credentials or a password reset? Contact your firm administrator or use the password recovery link above.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // --- CLIENT PORTAL DASHBOARD VIEW ---
  if (currentUser.role === 'CLIENT') {
    return (
      <div className="client-portal-dashboard animate-fade-in">
        <section className="portal-header-banner">
          <div className="container portal-header-flex">
            <div className="portal-welcome">
              <span className="portal-shield-label"><Shield size={12} className="gold-text" /> ATTENTION: PRIVILEGED SESSION ACTIVATED</span>
              <h1 className="portal-client-title">Welcome back, {currentUser.name}</h1>
              <p className="portal-client-company">{currentUser.company || 'Private Client'} • Client Portal</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setChangePassError('');
                  setChangePassSuccess('');
                  setShowProfileModal(true);
                }}
              >
                <Key size={13} className="gold-text" /> Profile & Security
              </button>
              <button
                className="btn btn-outline"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={async () => {
                  if (window.confirm("Delete Account & Personal Data:\n\nAre you sure you want to permanently delete your client account and personal data? This action complies with data privacy laws (Right to Erasure) and cannot be undone.")) {
                    const result = await deleteAccount();
                    if (!result.success) {
                      alert(result.message || 'Failed to delete account.');
                    }
                  }
                }}
              >
                <Trash2 size={13} /> Delete Account
              </button>
              <button className="btn btn-outline sign-out-portal-btn" onClick={logoutClient}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </section>

        {/* Mandatory temporary password warning banner */}
        {currentUser.mustChangePassword && (
          <div className="container" style={{ marginTop: '1.5rem' }}>
            <div className="glass-card animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.88rem' }}>
                <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span><strong>Security Notice:</strong> You are currently using a temporary password. Please set your new password now.</span>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => {
                  setChangePassError('');
                  setChangePassSuccess('');
                  setShowProfileModal(true);
                }}
              >
                Change Password Now
              </button>
            </div>
          </div>
        )}

        {/* Tabs selector */}
        <section className="portal-nav-bar">
          <div className="container">
            <div className="portal-tabs-row">
              <button className={`portal-tab-btn ${activeTab === 'cases' ? 'active' : ''}`} onClick={() => setActiveTab('cases')}>
                Active Cases ({portalCases.length})
              </button>
              <button className={`portal-tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
                Document Share ({portalDocuments.length})
              </button>
              <button className={`portal-tab-btn ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
                Billing & Invoices ({portalInvoices.length})
              </button>
              <button className={`portal-tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
                Secure Messages
              </button>
              <button className={`portal-tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                Profile & Security
              </button>
            </div>
          </div>
        </section>


        {/* Portal Tab Screens */}
        <section className="section portal-workspace-section">
          <div className="container">
            {/* Notifications panel if any unread */}
            {notifications.length > 0 && (
              <div className="glass-card mb-3" style={{ borderLeft: '4px solid var(--gold-primary)', padding: '15px' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}><AlertCircle size={16} className="gold-text" /> Case Alerts</h5>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {notifications.slice(0, 3).map(n => (
                    <li key={n.id} style={{ marginBottom: '5px' }}>{n.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* TAB 1: CASES */}
            {activeTab === 'cases' && (
              <div className="portal-cases-tab animate-fade-in">
                <h3 className="workspace-title">Your Active Legal Matters</h3>
                <p className="workspace-desc">Track real-time litigation, corporate filings, and case statuses.</p>

                <div className="portal-cases-list">
                  {portalCases.map(c => (
                    <div key={c.id} className="glass-card case-status-card">
                      <div className="case-status-header">
                        <div>
                          <span className="case-id-tag">{c.caseNumber || 'Active'}</span>
                          <h4>{c.title}</h4>
                        </div>
                        <span className={`case-status-badge ${c.status === 'CLOSED' ? 'completed' : 'active'}`}>
                          {c.status}
                        </span>
                      </div>

                      <div className="case-attorney-row">
                        <strong>Lead Advocate:</strong> <span>{c.lawyer?.user?.name || 'Partner Advocate'}</span>
                      </div>

                      <div className="case-progress-bar-block">
                        <div className="progress-labels">
                          <span>Completion Progress</span>
                          <span>{c.progress}%</span>
                        </div>
                        <div className="case-progress-bar-container">
                          <div className="case-progress-bar-fill" style={{ width: `${c.progress}%` }}></div>
                        </div>
                      </div>

                      <div className="case-latest-updates">
                        <strong>Latest Update:</strong>
                        <p>{c.lastUpdate || 'Waiting for initial lawyer brief.'}</p>
                      </div>
                    </div>
                  ))}
                  {portalCases.length === 0 && (
                    <div className="text-center glass-card" style={{ padding: '40px' }}>
                      <p>No active case files open. If you just registered, our team will link your case shortly.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENT SHARE */}
            {activeTab === 'docs' && (
              <div className="portal-docs-tab animate-fade-in">
                <div className="docs-workspace-header">
                  <div>
                    <h3 className="workspace-title">Secure Document Exchange</h3>
                    <p className="workspace-desc">View official litigation drafts, signed agreements, and upload files under privilege shield.</p>
                  </div>
                  {/* Document Uploader Form */}
                  <form className="portal-uploader-inline-form glass-card" onSubmit={handleDocUpload}>
                    <input
                      type="file"
                      id="portal-file-picker"
                      className="hidden-file-input"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="portal-file-picker" className="portal-upload-label">
                      <Upload size={14} /> <span>{uploadFile ? uploadFile.name : 'Select File'}</span>
                    </label>
                    {isUploading ? (
                      <div className="upload-progress-percent">{uploadPercent}%</div>
                    ) : (
                      <button type="submit" className="btn btn-primary" disabled={!uploadFile}>
                        Upload File
                      </button>
                    )}
                  </form>
                </div>

                <div className="custom-table-container mt-3">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Document Name</th>
                        <th>Size</th>
                        <th>Uploaded By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portalDocuments.map(doc => (
                        <tr key={doc.id}>
                          <td className="doc-name-cell"><FileText size={14} className="gold-text" /> {doc.name}</td>
                          <td>{doc.size}</td>
                          <td>{doc.uploadedBy}</td>
                          <td>
                            <a
                              className="btn btn-primary btn-pay-small"
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', padding: '4px 10px', fontSize: '0.8rem', textDecoration: 'none' }}
                            >
                              Download URL
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: BILLING & INVOICES */}
            {activeTab === 'billing' && (
              <div className="portal-billing-tab animate-fade-in">
                <h3 className="workspace-title">Invoicing & Retainer Records</h3>
                <p className="workspace-desc">Pay consultations, operational filing fees, or monthly retainers securely.</p>

                {selectedInvoice ? (
                  <div className="glass-card invoice-checkout-card animate-fade-in">
                    <div className="checkout-header">
                      <h4>Settle Bill: {selectedInvoice.id}</h4>
                      <button className="btn-text" onClick={() => setSelectedInvoice(null)}>Cancel</button>
                    </div>
                    <div className="checkout-summary">
                      <p><strong>Description:</strong> {selectedInvoice.description}</p>
                      <p><strong>Amount:</strong> <span className="gold-text">{selectedInvoice.amount}</span></p>
                    </div>

                    <form onSubmit={triggerPayInvoiceSubmit} className="checkout-credit-card-form">
                      <div className="form-group">
                        <label className="form-label">Cardholder Name</label>
                        <input type="text" required placeholder="Vikas Singhal" className="form-control" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Card Number</label>
                        <input
                          type="text"
                          required
                          placeholder="4111 2222 3333 4444"
                          className="form-control"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Expiry MM/YY</label>
                          <input type="text" required placeholder="12/28" className="form-control" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">CVV</label>
                          <input type="password" required placeholder="***" className="form-control" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
                        </div>
                      </div>

                      <button type="submit" className="btn btn-primary btn-block" disabled={isPayingInvoice}>
                        {isPayingInvoice ? 'Authorizing Payment Gateway...' : `Authorize payment for ${selectedInvoice.amount}`}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="custom-table-container mt-3">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portalInvoices.map(inv => (
                          <tr key={inv.id}>
                            <td>{inv.description}</td>
                            <td className="gold-text">{inv.amount}</td>
                            <td>
                              <span className={`status-badge-inline ${inv.status.toLowerCase()}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td>
                              {inv.status === 'Unpaid' ? (
                                <button className="btn btn-primary btn-pay-small" onClick={() => setSelectedInvoice(inv)}>
                                  <CreditCard size={12} /> Pay Now
                                </button>
                              ) : (
                                <span className="green-text" style={{ fontSize: '0.85rem' }}>Receipt Dispatched</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SECURE MESSAGING */}
            {activeTab === 'messages' && (
              <div className="portal-messages-tab animate-fade-in">
                <h3 className="workspace-title">Attorney Privileged Inbox</h3>
                <p className="workspace-desc">Send encrypted messages directly to Madhav Raghuwanshi (Founder).</p>

                <div className="portal-messaging-workspace-card glass-card">
                  <div className="portal-messages-log">
                    {portalMessages.map(msg => (
                      <div key={msg.id} className={`portal-msg-row ${msg.sender === 'Client (You)' ? 'outgoing' : 'incoming'}`}>
                        <div className="portal-msg-meta">
                          <strong>{msg.sender}</strong> • <span className="time">{msg.time}</span>
                        </div>
                        <div className="portal-msg-body-bubble">{msg.text}</div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleMessageSend} className="portal-messaging-input-form">
                    <input
                      type="text"
                      required
                      placeholder="Type encrypted message to attorney..."
                      className="form-control"
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      <Send size={16} /> Send
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 5: PROFILE & SECURITY */}
            {activeTab === 'profile' && renderProfileSection(
              'Client Profile & Security Credentials',
              'Review your registered client account and update your password.'
            )}
          </div>
        </section>

        {renderProfileModal()}
      </div>
    );
  }

  // --- FORCED MANDATORY PASSWORD CHANGE SCREEN (Section 1) ---
  if (currentUser && currentUser.mustChangePassword) {
    return (
      <div className="portal-login-page-container animate-fade-in" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <section className="login-box-section" style={{ width: '100%' }}>
          <div className="container flex-center">
            <div className="glass-card login-portal-card" style={{ maxWidth: '520px', width: '92%', border: '1.5px solid #c5a880', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div className="login-header text-center">
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'rgba(197, 168, 128, 0.15)', border: '2px solid #c5a880',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <Key className="gold-text" size={28} />
                </div>
                <h2 className="login-title" style={{ fontSize: '1.6rem', color: '#ffffff' }}>Permanent Password Required</h2>
                <p className="login-desc" style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                  Welcome Counsel <strong>{currentUser.name}</strong>. You are logged in using a temporary administrator password. For system and client confidentiality, you must change your password before accessing your workspace.
                </p>
              </div>

              {forcedPassError && (
                <div className="login-error-alert animate-fade-in" style={{ marginBottom: '1.25rem' }}>
                  <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  {forcedPassError}
                </div>
              )}
              {forcedPassSuccess && (
                <div className="login-error-alert animate-fade-in" style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', borderColor: '#2ecc71', color: '#2ecc71', marginBottom: '1.25rem' }}>
                  <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  {forcedPassSuccess}
                </div>
              )}

              <form onSubmit={handleForcedPasswordSubmit} className="login-form">
                <div className="form-group">
                  <label className="form-label">Current / Temporary Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter temporary password"
                    className="form-control"
                    value={forcedCurrentPass}
                    onChange={(e) => setForcedCurrentPass(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Permanent Password (Min 6 chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Create new secure password"
                    className="form-control"
                    value={forcedNewPass}
                    onChange={(e) => setForcedNewPass(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Must differ from your temporary password and contain at least 6 characters.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Permanent Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-enter new secure password"
                    className="form-control"
                    value={forcedConfirmPass}
                    onChange={(e) => setForcedConfirmPass(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  style={{ marginTop: '0.75rem', padding: '12px' }}
                  disabled={isSubmittingForcedPass}
                >
                  {isSubmittingForcedPass ? 'Updating Credentials...' : 'Save Password & Enter Workspace'}
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn-text"
                    style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={logoutClient}
                  >
                    <LogOut size={14} /> Log Out and Return Later
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // --- REUSABLE LAWYER SELF-SERVICE PROFILE (Section 3) ---
  const renderLawyerSelfProfile = () => {
    const completion = calculateProfileCompletion();
    const status = lawyerProfileData.profileStatus || 'incomplete';

    return (
      <div className="portal-profile-tab animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="workspace-title">My Professional Profile & Directory Listing</h3>
            <p className="workspace-desc">Complete your professional credentials, courts of practice, and bio for public directory listing.</p>
          </div>
          {status === 'published' && lawyerProfileData.slug && (
            <a
              href={`#/lawyers/${lawyerProfileData.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
            >
              <ExternalLink size={14} /> View Public Profile
            </a>
          )}
        </div>

        {/* 1. STATUS BANNER */}
        {status === 'published' && (
          <div className="status-banner-card published animate-fade-in" style={{ marginTop: '1.25rem' }}>
            <CheckCircle size={22} style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '0.98rem', display: 'block', color: '#ffffff' }}>Your Profile is Live on the Lawzunction Directory</strong>
              <span style={{ fontSize: '0.85rem', color: '#86efac' }}>
                Your advocate biography and consultation booking link are visible to the public.
              </span>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>
                ⚠️ Notice: If you update sensitive credentials (Full Name, Bar Council Number, or Specializations), your profile will automatically revert to pending review for admin verification.
              </p>
            </div>
          </div>
        )}

        {status === 'pending_review' && (
          <div className="status-banner-card pending_review animate-fade-in" style={{ marginTop: '1.25rem' }}>
            <Clock size={22} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.98rem', display: 'block', color: '#ffffff' }}>Your Profile is Pending Administrative Review</strong>
              <span style={{ fontSize: '0.85rem' }}>
                Your profile submission has been sent to Lawzunction administration. <strong>Your profile is not visible to the public yet.</strong> Once approved by the team, your profile will be published live on the directory and you will receive an email confirmation.
              </span>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="status-banner-card rejected animate-fade-in" style={{ marginTop: '1.25rem' }}>
            <XCircle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.98rem', display: 'block', color: '#ffffff' }}>Profile Submission Rejected</strong>
              <span style={{ fontSize: '0.85rem' }}>
                <strong>Your profile is not visible to the public yet.</strong> An administrator reviewed your profile and requested the following corrections:
              </span>
              <div style={{ margin: '8px 0', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #ef4444', color: '#fecaca', fontSize: '0.86rem' }}>
                "{lawyerProfileData.rejectionReason || 'Please verify and complete all necessary practice details.'}"
              </div>
              <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                Please resolve the remarks above, save your draft, and click "Submit for Review" once ready.
              </span>
            </div>
          </div>
        )}

        {status === 'incomplete' && (
          <div className="status-banner-card incomplete animate-fade-in" style={{ marginTop: '1.25rem' }}>
            <AlertCircle size={22} style={{ color: '#94a3b8', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.98rem', display: 'block', color: '#ffffff' }}>Your Profile is Incomplete & Hidden from Public</strong>
              <span style={{ fontSize: '0.85rem' }}>
                <strong>Your profile is not visible to the public yet.</strong> To be featured on the Lawzunction lawyer catalog, please complete all 9 required fields below and submit your profile for admin verification.
              </span>
            </div>
          </div>
        )}

        {/* 2. PROGRESS BAR */}
        <div className="profile-progress-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} className="gold-text" /> Profile Completion
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {completion.completed} of {completion.total} required fields filled
              </span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: completion.percentage === 100 ? '#22c55e' : '#ffd700' }}>
              {completion.percentage}%
            </div>
          </div>
          <div className="profile-progress-track">
            <div className="profile-progress-fill" style={{ width: `${completion.percentage}%`, background: completion.percentage === 100 ? 'linear-gradient(90deg, #22c55e, #10b981)' : 'linear-gradient(90deg, #c5a880, #ffd700)' }} />
          </div>
          {completion.missing.length > 0 ? (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
              Missing required fields: <span style={{ color: '#f59e0b', fontWeight: '500' }}>{completion.missing.map(m => m.name).join(', ')}</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: '#4ade80', marginTop: '6px', fontWeight: '500' }}>
              ✓ All required fields are completed! You are ready to submit for review.
            </div>
          )}
        </div>

        {/* FEEDBACK ALERT */}
        {lawyerProfileFeedback && (
          <div className={lawyerProfileFeedback.type === 'success' ? 'portal-success-badge animate-fade-in' : 'login-error-alert animate-fade-in'} style={{ marginBottom: '1.25rem' }}>
            {lawyerProfileFeedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{lawyerProfileFeedback.text}</span>
          </div>
        )}

        {/* 3. PROFILE FORM */}
        <form onSubmit={handleSaveLawyerProfileDraft}>
          {/* Photo & Identity Block */}
          <div className="glass-card mb-4" style={{ padding: '20px' }}>
            <h4 style={{ color: '#ffffff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              1. Profile Picture & Core Identity
            </h4>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              <Avatar name={lawyerProfileData.name} src={lawyerProfileData.photo} size={88} />
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label className="form-label" style={{ marginBottom: '4px' }}>
                  Professional Headshot Photo * <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(JPG, PNG, WEBP — max 2 MB)</span>
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                  <input
                    type="file"
                    id="lawyerSelfPhoto"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLawyerSelfPhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="lawyerSelfPhoto" className="btn btn-outline" style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '0.82rem', margin: 0 }}>
                    <Upload size={14} style={{ marginRight: '6px' }} /> Upload New Photo
                  </label>
                  {lawyerProfileData.photo && (
                    <button
                      type="button"
                      className="btn-text"
                      style={{ color: '#ef4444', fontSize: '0.82rem', padding: '6px 10px', cursor: 'pointer' }}
                      onClick={() => setLawyerProfileData(prev => ({ ...prev, photo: '' }))}
                    >
                      Remove Photo (Use Letter Fallback)
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', display: 'block' }}>
                  If no photo is uploaded, your public card will display a circular avatar with your initials.
                </span>
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name * <span style={{ color: '#ffd700', fontSize: '0.72rem' }}>(Sensitive field)</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={lawyerProfileData.name}
                  onChange={(e) => setLawyerProfileData({ ...lawyerProfileData, name: e.target.value })}
                  placeholder="e.g. Adv. Mahesh Gour"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  value={lawyerProfileData.phone}
                  onChange={(e) => setLawyerProfileData({ ...lawyerProfileData, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bar Council Registration Number * <span style={{ color: '#ffd700', fontSize: '0.72rem' }}>(Sensitive field)</span></label>
                <input
                  type="text"
                  required
                  className="form-control font-mono"
                  value={lawyerProfileData.barCouncilNumber}
                  onChange={(e) => setLawyerProfileData({ ...lawyerProfileData, barCouncilNumber: e.target.value })}
                  placeholder="e.g. MP/1234/2018"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="form-control"
                  value={lawyerProfileData.experience}
                  onChange={(e) => setLawyerProfileData({ ...lawyerProfileData, experience: parseInt(e.target.value) || 0 })}
                  placeholder="Years"
                />
              </div>
            </div>
          </div>

          {/* Specializations & Languages Block */}
          <div className="glass-card mb-4" style={{ padding: '20px' }}>
            <h4 style={{ color: '#ffffff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              2. Specializations & Practice Languages
            </h4>
            <div className="form-group mb-4">
              <label className="form-label">
                Specializations * <span style={{ color: '#ffd700', fontSize: '0.72rem' }}>(Sensitive field — Select all that apply)</span>
              </label>
              <div className="chip-group-grid">
                {ALL_SPECIALIZATIONS.map(spec => {
                  const isSelected = lawyerProfileData.specializations?.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      className={`chip-badge-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleToggleSpecialization(spec)}
                    >
                      {isSelected && <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Working Languages * (Select all that apply)</label>
              <div className="chip-group-grid">
                {ALL_LANGUAGES.map(lang => {
                  const isSelected = lawyerProfileData.languages?.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      className={`chip-badge-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleToggleLanguage(lang)}
                    >
                      {isSelected && <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Jurisdiction, Education & Bio Block */}
          <div className="glass-card mb-4" style={{ padding: '20px' }}>
            <h4 style={{ color: '#ffffff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              3. Jurisdiction, Qualifications & Professional Bio
            </h4>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Courts of Practice *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={lawyerProfileData.courts}
                  onChange={(e) => setLawyerProfileData({ ...lawyerProfileData, courts: e.target.value })}
                  placeholder="e.g. Supreme Court, MP High Court, Indore District Court"
                />
              </div>
              <div className="form-group">
                <label className="form-label">City / Primary Base *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={lawyerProfileData.city}
                  onChange={(e) => setLawyerProfileData({ ...lawyerProfileData, city: e.target.value })}
                  placeholder="e.g. Indore, New Delhi, Mumbai"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Consultation Fee (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={lawyerProfileData.consultationFee}
                  onChange={(e) => setLawyerProfileData({ ...lawyerProfileData, consultationFee: e.target.value })}
                  placeholder="e.g. ₹2,000 / 30 mins"
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Education / Qualifications *</label>
              <input
                type="text"
                required
                className="form-control"
                value={lawyerProfileData.education}
                onChange={(e) => setLawyerProfileData({ ...lawyerProfileData, education: e.target.value })}
                placeholder="e.g. B.B.A. LL.B. (Hons.), LL.M. in Constitutional Law"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Short Professional Bio *</label>
              <textarea
                rows="4"
                required
                className="form-control"
                value={lawyerProfileData.bio}
                onChange={(e) => setLawyerProfileData({ ...lawyerProfileData, bio: e.target.value })}
                placeholder="Write a concise overview of your practice, notable litigation representations, advisory focus, and client commitment..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
            <button
              type="submit"
              className="btn btn-outline"
              disabled={isSavingLawyerProfile}
            >
              {isSavingLawyerProfile ? 'Saving Draft...' : 'Save Changes / Draft'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={completion.percentage < 100 || isSubmittingForReview}
              onClick={handleSubmitProfileForReview}
              style={{
                opacity: completion.percentage < 100 ? 0.5 : 1,
                cursor: completion.percentage < 100 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              title={completion.percentage < 100 ? 'Complete all 9 required fields to submit for review' : 'Submit profile for admin approval'}
            >
              <Send size={15} />
              {isSubmittingForReview ? 'Submitting for Review...' : 'Submit Profile for Admin Review'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // --- REUSABLE LAWYER CASES WORKSPACE ---
  const renderLawyerCasesView = () => (
    <div className="portal-cases-tab animate-fade-in">
      <h3 className="workspace-title">Assigned Client Files</h3>
      <p className="workspace-desc">Update client legal status metrics and report milestones.</p>

      {selectedCaseForUpdate && (
        <div className="glass-card mb-4 animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid var(--gold-primary)' }}>
          <h4>Update Milestones: {selectedCaseForUpdate.title}</h4>
          <form onSubmit={handleLawyerStatusUpdateSubmit} style={{ marginTop: '15px' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Case Status Group</label>
                <select className="form-control" value={caseStatusInput} onChange={(e) => setCaseStatusInput(e.target.value)}>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Completion Progress ({caseProgressInput}%)</label>
                <input type="range" min="0" max="100" className="form-control" value={caseProgressInput} onChange={(e) => setCaseProgressInput(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Milestone Status Remarks (Dispatched to Client & Email)</label>
              <textarea rows="3" required className="form-control" placeholder="Summarize hearings, filings, or document reviews..." value={caseUpdateInput} onChange={(e) => setCaseUpdateInput(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="submit" className="btn btn-primary" disabled={isUpdatingStatus}>
                {isUpdatingStatus ? 'Dispatching updates...' : 'Submit Status Update'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setSelectedCaseForUpdate(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="portal-cases-list">
        {(lawyerCases || []).map(c => (
          <div key={c.id} className="glass-card case-status-card">
            <div className="case-status-header">
              <div>
                <span className="case-id-tag">{c.caseNumber || 'Active'}</span>
                <h4>{c.title}</h4>
              </div>
              <span className={`case-status-badge ${c.status === 'CLOSED' ? 'completed' : 'active'}`}>
                {c.status}
              </span>
            </div>

            <div className="case-attorney-row">
              <strong>Client Name:</strong> <span>{c.client?.user?.name || c.client?.company || 'Personal Matter'}</span>
            </div>

            <div className="case-progress-bar-block">
              <div className="progress-labels">
                <span>Completion Progress</span>
                <span>{c.progress}%</span>
              </div>
              <div className="case-progress-bar-container">
                <div className="case-progress-bar-fill" style={{ width: `${c.progress}%` }}></div>
              </div>
            </div>

            <div className="case-latest-updates">
              <strong>Latest Update:</strong>
              <p>{c.lastUpdate || 'No milestones filed.'}</p>
            </div>

            <button className="btn btn-primary mt-3 btn-pay-small" onClick={() => {
              setSelectedCaseForUpdate(c);
              setCaseStatusInput(c.status);
              setCaseProgressInput(c.progress);
            }}>
              <RefreshCw size={12} /> Settle Milestone Update
            </button>
          </div>
        ))}
        {(!lawyerCases || lawyerCases.length === 0) && (
          <div className="text-center glass-card" style={{ padding: '40px' }}>
            <p>You have not been assigned any active case sheets yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- LAWYER PORTAL DASHBOARD VIEW ---
  if (currentUser.role === 'LAWYER') {
    return (
      <div className="client-portal-dashboard animate-fade-in">
        <section className="portal-header-banner">
          <div className="container portal-header-flex">
            <div className="portal-welcome">
              <span className="portal-shield-label"><Shield size={12} className="gold-text" /> ATTORNEY WORKSPACE ACCESS</span>
              <h1 className="portal-client-title">Counsel {currentUser.name}</h1>
              <p className="portal-client-company">Law Firm Panel • Case Management Hub</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setChangePassError('');
                  setChangePassSuccess('');
                  setShowProfileModal(true);
                }}
              >
                <Key size={13} className="gold-text" /> Password & Security
              </button>
              <button className="btn btn-outline sign-out-portal-btn" onClick={logoutClient}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </section>

        <section className="portal-nav-bar">
          <div className="container">
            <div className="portal-tabs-row">
              <button className={`portal-tab-btn ${lawyerTab === 'profile' ? 'active' : ''}`} onClick={() => setLawyerTab('profile')}>
                My Profile & Directory Listing
                {lawyerProfileData.profileStatus === 'published' && (
                  <span style={{ background: '#22c55e', color: '#040814', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', marginLeft: '6px' }}>Live</span>
                )}
                {lawyerProfileData.profileStatus === 'pending_review' && (
                  <span style={{ background: '#f59e0b', color: '#040814', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', marginLeft: '6px' }}>In Review</span>
                )}
                {lawyerProfileData.profileStatus === 'rejected' && (
                  <span style={{ background: '#ef4444', color: '#ffffff', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', marginLeft: '6px' }}>Rejected</span>
                )}
              </button>
              <button className={`portal-tab-btn ${lawyerTab === 'cases' ? 'active' : ''}`} onClick={() => setLawyerTab('cases')}>
                My Cases ({lawyerCases.length})
              </button>
              <button className={`portal-tab-btn ${lawyerTab === 'appointments' ? 'active' : ''}`} onClick={() => setLawyerTab('appointments')}>
                Scheduled Consultations ({lawyerAppointments.length})
              </button>
            </div>
          </div>
        </section>

        <section className="section portal-workspace-section">
          <div className="container">
            {/* LAWYER MATTERS */}
            {lawyerTab === 'cases' && renderLawyerCasesView()}

            {/* LAWYER APPOINTMENTS */}
            {lawyerTab === 'appointments' && (
              <div className="portal-docs-tab animate-fade-in">
                <h3 className="workspace-title">Scheduled virtual consultations</h3>
                <p className="workspace-desc">Secure slots booked by clients for virtual conferences.</p>

                <div className="custom-table-container mt-3">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Client Name</th>
                        <th>Email / Phone</th>
                        <th>Scheduled Date</th>
                        <th>Time Slot</th>
                        <th>Video Conference Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lawyerAppointments.map(appt => (
                        <tr key={appt.id}>
                          <td>{appt.name}</td>
                          <td>{appt.email} <br /> {appt.phone}</td>
                          <td>{appt.date}</td>
                          <td>{appt.timeSlot}</td>
                          <td>
                            {appt.zoomLink ? (
                              <a href={appt.zoomLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-pay-small">Join Meet</a>
                            ) : (
                              <span className="text-muted">No link generated</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LAWYER SELF-SERVICE PROFILE & SECURITY (Section 3) */}
            {lawyerTab === 'profile' && renderLawyerSelfProfile()}
          </div>
        </section>

        {renderProfileModal()}
      </div>
    );
  }

  // --- ADMIN & SUPER ADMIN VIEW ---
  if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
    return (
      <div className="client-portal-dashboard animate-fade-in">
        <section className="portal-header-banner">
          <div className="container portal-header-flex">
            <div className="portal-welcome">
              <span className="portal-shield-label"><Shield size={12} className="gold-text" /> ADMINISTRATIVE SHIELD ENABLED</span>
              <h1 className="portal-client-title">Firm Control Console</h1>
              <p className="portal-client-company">Admin Portal ({currentUser.role})</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setChangePassError('');
                  setChangePassSuccess('');
                  setShowProfileModal(true);
                }}
              >
                <Key size={13} className="gold-text" /> Profile & Security
              </button>
              <button className="btn btn-outline sign-out-portal-btn" onClick={logoutClient}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </section>

        {/* Mandatory temporary password warning banner */}
        {currentUser.mustChangePassword && (
          <div className="container" style={{ marginTop: '1.5rem' }}>
            <div className="glass-card animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.88rem' }}>
                <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span><strong>Security Notice:</strong> You are currently using a temporary password. Please set your new password now.</span>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => {
                  setChangePassError('');
                  setChangePassSuccess('');
                  setShowProfileModal(true);
                }}
              >
                Change Password Now
              </button>
            </div>
          </div>
        )}


        <section className="portal-nav-bar">
          <div className="container">
            <div className="portal-tabs-row">
              <button className={`portal-tab-btn ${adminTab === 'stats' ? 'active' : ''}`} onClick={() => setAdminTab('stats')}>
                Analytics Stats
              </button>
              <button className={`portal-tab-btn ${adminTab === 'users' ? 'active' : ''}`} onClick={() => setAdminTab('users')}>
                Manage Users
              </button>
              <button className={`portal-tab-btn ${adminTab === 'lawyers' ? 'active' : ''}`} onClick={() => setAdminTab('lawyers')}>
                Lawyers & Advocates ({combinedLawyers.length})
              </button>
              <button className={`portal-tab-btn ${adminTab === 'cases' ? 'active' : ''}`} onClick={() => setAdminTab('cases')}>
                Case Allocations
              </button>
              <button className={`portal-tab-btn ${adminTab === 'enquiries' ? 'active' : ''}`} onClick={() => setAdminTab('enquiries')}>
                Public Enquiries
              </button>
              <button className={`portal-tab-btn ${adminTab === 'careers' ? 'active' : ''}`} onClick={() => setAdminTab('careers')}>
                Career Applications ({adminJobApplications?.length || 0})
              </button>
              {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (currentUser.lawyerProfile || currentUser.lawyerProfileId) && (
                <>
                  <button className={`portal-tab-btn ${adminTab === 'my-lawyer-profile' ? 'active' : ''}`} onClick={() => setAdminTab('my-lawyer-profile')}>
                    My Lawyer Profile
                  </button>
                  <button className={`portal-tab-btn ${adminTab === 'my-cases' ? 'active' : ''}`} onClick={() => setAdminTab('my-cases')}>
                    My Cases ({lawyerCases?.length || 0})
                  </button>
                </>
              )}
              <button className={`portal-tab-btn ${adminTab === 'profile' ? 'active' : ''}`} onClick={() => setAdminTab('profile')}>
                Profile & Security
              </button>
            </div>
          </div>
        </section>

        <section className="section portal-workspace-section">
          <div className="container">
            {/* STATS OVERVIEW */}
            {adminTab === 'stats' && (
              <div className="portal-cases-tab animate-fade-in">
                <h3 className="workspace-title">Firm Performance Analytics</h3>
                <p className="workspace-desc">Consolidated real-time operational database stats.</p>

                <div className="portal-cases-list mt-3">
                  <div className="glass-card" style={{ padding: '25px', textAlign: 'center' }}>
                    <h1 className="gold-text" style={{ fontSize: '3rem', margin: 0 }}>{adminStats.totalCases || 0}</h1>
                    <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Total Cases Registered</p>
                  </div>
                  <div className="glass-card" style={{ padding: '25px', textAlign: 'center' }}>
                    <h1 className="gold-text" style={{ fontSize: '3rem', margin: 0 }}>{adminStats.lawyersCount || 0}</h1>
                    <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Active Advocates</p>
                  </div>
                  <div className="glass-card" style={{ padding: '25px', textAlign: 'center' }}>
                    <h1 className="gold-text" style={{ fontSize: '3rem', margin: 0 }}>{adminStats.clientsCount || 0}</h1>
                    <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Registered Clients</p>
                  </div>
                  <div className="glass-card" style={{ padding: '25px', textAlign: 'center' }}>
                    <h1 className="gold-text" style={{ fontSize: '3rem', margin: 0 }}>{adminStats.pendingAppointments || 0}</h1>
                    <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Unassigned Bookings</p>
                  </div>
                </div>
              </div>
            )}

            {/* USERS MANAGEMENT */}
            {adminTab === 'users' && (
              <div className="portal-docs-tab animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="workspace-title">Manage User Accounts</h3>
                    <p className="workspace-desc">Register and review admins, lawyers, and clients databases.</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setIsCreatingUser(!isCreatingUser)}>
                    {isCreatingUser ? 'View Users Table' : 'Create User Account'}
                  </button>
                </div>

                {/* SUCCESS NOTIFICATION */}
                {adminSuccessMsg && (
                  <div className="green-text animate-fade-in" style={{ padding: '12px 16px', background: 'rgba(0,128,0,0.12)', border: '1px solid rgba(0,128,0,0.3)', borderRadius: '8px', margin: '14px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} /> {adminSuccessMsg}
                  </div>
                )}

                {/* EDIT USER MODAL */}
                {userToEdit && (
                  <div className="modal-backdrop animate-fade-in" style={{ zIndex: 2100 }}>
                    <div className="user-manage-modal-card animate-fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Edit3 size={18} className="gold-text" /> Edit User Account
                        </h4>
                        <button className="btn-text" style={{ fontSize: '1.2rem', color: '#94a3b8' }} onClick={() => setUserToEdit(null)}>✕</button>
                      </div>

                      {userEditError && (
                        <div className="login-error-alert mb-3" style={{ fontSize: '0.85rem' }}>{userEditError}</div>
                      )}

                      <form onSubmit={handleSaveUserEdit}>
                        <div className="form-group mb-3">
                          <label className="form-label">Full Name</label>
                          <input
                            type="text"
                            required
                            className="form-control"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Full Name"
                          />
                        </div>

                        <div className="form-group mb-3">
                          <label className="form-label">Email Address</label>
                          <input
                            type="email"
                            required
                            className="form-control"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="user@lawzunction.in"
                          />
                        </div>

                        <div className="form-group mb-3">
                          <label className="form-label">Assigned Role</label>
                          <select
                            className="form-control"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                          >
                            {allowedRolesForRequester.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          {normalizeRole(editRole) !== normalizeRole(userToEdit.role) && (
                            <span style={{ fontSize: '0.78rem', color: '#ffd700', marginTop: '4px', display: 'block' }}>
                              ⚠️ Changing role from <strong>{userToEdit.role}</strong> to <strong>{editRole}</strong> will require confirmation upon saving.
                            </span>
                          )}
                        </div>

                        <div className="form-group mb-3">
                          <label className="form-label">Designation / Company</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Senior Partner / Tata Consultancy"
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                          <button type="button" className="btn btn-outline" onClick={() => setUserToEdit(null)} disabled={isSavingEdit}>
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary" disabled={isSavingEdit}>
                            {isSavingEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* DELETE USER CONFIRMATION MODAL */}
                {userToDelete && (
                  <div className="modal-backdrop animate-fade-in" style={{ zIndex: 2100 }}>
                    <div className="user-manage-modal-card animate-fade-in" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '50%', color: '#ef4444' }}>
                          <AlertTriangle size={24} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: '#ffffff' }}>Confirm User Deletion</h4>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Permanent Account Removal</span>
                        </div>
                      </div>

                      {userDeleteError && (
                        <div className="login-error-alert mb-3" style={{ fontSize: '0.85rem' }}>{userDeleteError}</div>
                      )}

                      <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5', margin: '14px 0' }}>
                        Are you sure you want to remove <strong>{userToDelete.name}</strong> ({userToDelete.email} — Role: <span className="gold-text">{userToDelete.role}</span>)?
                      </p>
                      <p style={{ color: '#f87171', fontSize: '0.82rem', margin: '0 0 20px 0', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                        ⚠️ This action cannot be undone. All associated profiles and access privileges will be permanently deleted.
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => {
                            setUserToDelete(null);
                            setUserDeleteError('');
                          }}
                          disabled={isDeletingUser}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
                          onClick={handleConfirmDelete}
                          disabled={isDeletingUser}
                        >
                          {isDeletingUser ? 'Deleting...' : 'Confirm Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUserForReset && (
                  <div className="glass-card mb-4 mt-3 animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid var(--gold-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4>Reset Temporary Password for: {selectedUserForReset.name} ({selectedUserForReset.email})</h4>
                      <button className="btn-text" onClick={() => setSelectedUserForReset(null)}>Cancel</button>
                    </div>
                    <form onSubmit={handleAdminResetPasswordSubmit} style={{ marginTop: '15px' }}>
                      <div className="form-group">
                        <label className="form-label">New Temporary Password (Min 6 chars)</label>
                        <input
                          type="password"
                          required
                          className="form-control"
                          placeholder="••••••••"
                          value={tempResetPassInput}
                          onChange={(e) => setTempResetPassInput(e.target.value)}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: '4px', display: 'block' }}>
                          Note: The user will be required to change this temporary password immediately on their next login.
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button type="submit" className="btn btn-primary" disabled={isResettingPass}>
                          {isResettingPass ? 'Resetting Password...' : 'Confirm Password Reset & Email Credentials'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => setSelectedUserForReset(null)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {isCreatingUser ? (
                  <div className="glass-card mt-3 animate-fade-in" style={{ padding: '25px' }}>
                    <h4>Create System Credentials</h4>
                    {adminSuccessMsg && <div className="green-text" style={{ padding: '10px', background: 'rgba(0,128,0,0.1)', borderRadius: '5px', margin: '10px 0' }}>{adminSuccessMsg}</div>}
                    {errorMsg && <div className="login-error-alert">{errorMsg}</div>}
                    <form onSubmit={handleAdminCreateUserSubmit} style={{ marginTop: '20px' }}>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input type="text" required className="form-control" placeholder="e.g. Adv. Amit Sharma" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Account Role</label>
                          <select className="form-control" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                            <option value="CLIENT">CLIENT</option>
                            <option value="LAWYER">LAWYER (Triggers mandatory first-time password change)</option>
                            <option value="ADMIN">ADMIN (Admin restricted)</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Email Address</label>
                          <input type="email" required className="form-control" placeholder="lawyer@lawzunction.in" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Initial Temp Password</label>
                          <input type="password" required className="form-control" placeholder="••••••••" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input type="text" className="form-control" placeholder="+91 XXXXX XXXXX" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} />
                      </div>

                      {newUserRole === 'LAWYER' && (
                        <div className="glass-card mt-3" style={{ padding: '15px', background: 'rgba(197, 168, 128, 0.05)' }}>
                          <h5>Advocate Profile Specifics</h5>
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Title / Post</label>
                              <input type="text" required={newUserRole === 'LAWYER'} className="form-control" placeholder="Senior Partner - Dispute Resolution" value={newLawyerTitle} onChange={(e) => setNewLawyerTitle(e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Years of Experience</label>
                              <input type="number" required={newUserRole === 'LAWYER'} className="form-control" value={newLawyerExp} onChange={(e) => setNewLawyerExp(e.target.value)} />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Alma Mater / Education Details</label>
                              <input type="text" required={newUserRole === 'LAWYER'} className="form-control" placeholder="LL.M. in IP Law, NLSIU Bangalore" value={newLawyerEdu} onChange={(e) => setNewLawyerEdu(e.target.value)} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Brief Professional Biography</label>
                            <textarea rows="3" className="form-control" placeholder="Write professional practice highlights..." value={newLawyerBio} onChange={(e) => setNewLawyerBio(e.target.value)} />
                          </div>
                        </div>
                      )}

                      <button type="submit" className="btn btn-primary mt-3 btn-block">Confirm Account Registration</button>
                    </form>
                  </div>
                ) : (
                  <div className="custom-table-container mt-3">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Designation / Company</th>
                          <th>Security Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map(u => {
                          const canEdit = canEditUser(currentUser?.role, u.role).allowed;
                          const canDelete = canRemoveUser(currentUser?.role, u.role).allowed;
                          const isSuperAdmin = normalizeRole(u.role) === 'SUPER_ADMIN';

                          return (
                            <tr key={u.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <Avatar name={u.name} src={u.photo || u.profileDetails?.photo} size={34} />
                                  <div>
                                    <strong>{u.name}</strong>
                                    {u.role === 'CLIENT' && (
                                      <span
                                        className="badge-cases-count"
                                        style={{
                                          marginLeft: '8px',
                                          fontSize: '0.72rem',
                                          background: 'rgba(197, 168, 128, 0.15)',
                                          color: '#c5a880',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          border: '1px solid rgba(197, 168, 128, 0.35)',
                                          fontWeight: '600',
                                          display: 'inline-block'
                                        }}
                                      >
                                        {(u.casesCount ?? u.profileDetails?.cases?.length ?? 1)} {((u.casesCount ?? u.profileDetails?.cases?.length ?? 1) === 1) ? 'case' : 'cases'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`status-badge-inline ${isSuperAdmin ? 'role-badge-super' : 'paid'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td>{u.designation || u.profileDetails?.title || u.profileDetails?.company || 'Personal Client'}</td>
                              <td>
                                {u.mustChangePassword ? (
                                  <span className="status-badge-inline unpaid" style={{ fontSize: '0.75rem' }}>
                                    Reset Pending
                                  </span>
                                ) : (
                                  <span className="status-badge-inline paid" style={{ fontSize: '0.75rem' }}>
                                    Password Set
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="user-action-buttons">
                                  {canEdit && (
                                    <button
                                      type="button"
                                      className="btn-action-edit"
                                      onClick={() => {
                                        if (u.role === 'LAWYER') {
                                          handleStartEditLawyer(u);
                                        } else {
                                          handleStartEditUser(u);
                                        }
                                      }}
                                      title={u.role === 'LAWYER' ? 'Edit Advocate Profile' : 'Edit User Details'}
                                    >
                                      <Edit3 size={12} /> Edit
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      className="btn-action-delete"
                                      onClick={() => {
                                        if (u.role === 'LAWYER') {
                                          handleStartDeleteLawyer(u);
                                        } else {
                                          setUserDeleteError('');
                                          setUserToDelete(u);
                                        }
                                      }}
                                      title={u.role === 'LAWYER' ? 'Delete Advocate' : 'Delete User Account'}
                                    >
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-pay-small"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => setSelectedUserForReset(u)}
                                    title="Reset Password"
                                  >
                                    <Key size={12} /> Reset Pass
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}

            {/* LAWYERS & ADVOCATES SECTION (Task 2) */}
            {adminTab === 'lawyers' && (
              <div className="portal-docs-tab animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 className="workspace-title">Advocate & Counsel Management</h3>
                    <p className="workspace-desc">Review credentials, update profiles, manage bar registrations, and monitor case allocations.</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => { setAdminTab('users'); setIsCreatingUser(true); }}>
                    + Register New Advocate
                  </button>
                </div>

                {/* ACTION FEEDBACK NOTIFICATION */}
                {lawyerActionFeedback && (
                  <div className={lawyerActionFeedback.type === 'success' ? 'portal-success-badge animate-fade-in' : 'login-error-alert animate-fade-in'} style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                    {lawyerActionFeedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{lawyerActionFeedback.text}</span>
                  </div>
                )}

                {/* EDIT ADVOCATE MODAL */}
                {lawyerToEdit && (
                  <div className="modal-backdrop animate-fade-in" style={{ zIndex: 2100 }}>
                    <div className="edit-case-modal-card animate-fade-in" style={{ maxWidth: '720px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Edit3 size={18} className="gold-text" /> Edit Advocate: {lawyerToEdit.name}
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Update advocate credentials, profile picture, bar council registration, and practice details</span>
                        </div>
                        <button
                          type="button"
                          className="btn-text"
                          style={{ fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none' }}
                          onClick={() => { setLawyerToEdit(null); setLawyerEditError(''); }}
                        >
                          ✕
                        </button>
                      </div>

                      {lawyerEditError && (
                        <div className="login-error-alert mb-3" style={{ fontSize: '0.85rem' }}>{lawyerEditError}</div>
                      )}

                      <form onSubmit={handleSaveLawyerEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Profile Picture Upload & Preview */}
                        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '18px', background: 'rgba(255,255,255,0.02)' }}>
                          <Avatar name={editLawyerForm.name} src={editLawyerForm.photo} size={72} />
                          <div style={{ flex: 1 }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
                              Advocate Profile Picture <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 'normal' }}>(JPG, PNG, WEBP — max 2 MB)</span>
                            </label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                type="file"
                                id="lawyerPhotoUpload"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoUpload}
                                style={{ display: 'none' }}
                              />
                              <label htmlFor="lawyerPhotoUpload" className="btn btn-outline" style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '0.82rem', margin: 0 }}>
                                <Upload size={14} style={{ marginRight: '6px' }} /> Upload New Photo
                              </label>
                              {editLawyerForm.photo && (
                                <button
                                  type="button"
                                  className="btn-text"
                                  style={{ color: '#ef4444', fontSize: '0.82rem', padding: '6px 10px', cursor: 'pointer' }}
                                  onClick={() => setEditLawyerForm(prev => ({ ...prev, photo: '' }))}
                                >
                                  Remove Photo (Use Letter Fallback)
                                </button>
                              )}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                              If no photo is provided or fails to load, a colored circular avatar with initial "{editLawyerForm.name ? editLawyerForm.name.charAt(0).toUpperCase() : '?'}" is automatically displayed.
                            </span>
                          </div>
                        </div>

                        {/* Name & Email Row */}
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input
                              type="text"
                              required
                              className="form-control"
                              value={editLawyerForm.name}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, name: e.target.value })}
                              placeholder="Advocate Name"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Email Address *</label>
                            <input
                              type="email"
                              required
                              className="form-control"
                              value={editLawyerForm.email}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, email: e.target.value })}
                              placeholder="advocate@lawzunction.in"
                            />
                          </div>
                        </div>

                        {/* Phone & Bar Council Number Row */}
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Contact Phone</label>
                            <input
                              type="tel"
                              className="form-control"
                              value={editLawyerForm.phone}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, phone: e.target.value })}
                              placeholder="+91 98765 43210"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Bar Council Reg. Number</label>
                            <input
                              type="text"
                              className="form-control font-mono"
                              value={editLawyerForm.barCouncilNumber}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, barCouncilNumber: e.target.value })}
                              placeholder="e.g. MP/1234/2015"
                            />
                          </div>
                        </div>

                        {/* Title, Experience & Status Row */}
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Professional Title</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editLawyerForm.title}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, title: e.target.value })}
                              placeholder="e.g. Senior Partner / Panel Counsel"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Experience (Yrs)</label>
                            <input
                              type="number"
                              min="0"
                              className="form-control"
                              value={editLawyerForm.experience}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, experience: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                              className="form-control"
                              value={editLawyerForm.status}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, status: e.target.value })}
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                              <option value="ON_LEAVE">ON LEAVE</option>
                            </select>
                          </div>
                        </div>

                        {/* Specializations & Languages */}
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Specializations / Practice Areas</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editLawyerForm.specializations}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, specializations: e.target.value })}
                              placeholder="Corporate Law, Criminal Defense, Real Estate"
                            />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Comma-separated</span>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Working Languages</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editLawyerForm.languages}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, languages: e.target.value })}
                              placeholder="English, Hindi"
                            />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Comma-separated</span>
                          </div>
                        </div>

                        {/* Education & LinkedIn */}
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Education / Qualifications</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editLawyerForm.education}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, education: e.target.value })}
                              placeholder="B.B.A. LL.B (Hons), LL.M."
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">LinkedIn Profile URL</label>
                            <input
                              type="url"
                              className="form-control"
                              value={editLawyerForm.linkedin}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, linkedin: e.target.value })}
                              placeholder="https://linkedin.com/in/username"
                            />
                          </div>
                        </div>

                        {/* Professional Bio */}
                        <div className="form-group">
                          <label className="form-label">Professional Bio / Overview</label>
                          <textarea
                            rows="3"
                            className="form-control"
                            value={editLawyerForm.bio}
                            onChange={(e) => setEditLawyerForm({ ...editLawyerForm, bio: e.target.value })}
                            placeholder="Detailed profile summary, court appearances, and litigation focus..."
                          />
                        </div>

                        {/* City, Courts of Practice & Consultation Fee */}
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">City / Jurisdiction</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editLawyerForm.city}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, city: e.target.value })}
                              placeholder="e.g. New Delhi"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Courts of Practice</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editLawyerForm.courts}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, courts: e.target.value })}
                              placeholder="e.g. Delhi HC, Supreme Court"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Consultation Fee</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editLawyerForm.consultationFee}
                              onChange={(e) => setEditLawyerForm({ ...editLawyerForm, consultationFee: e.target.value })}
                              placeholder="e.g. ₹2,500 / session"
                            />
                          </div>
                        </div>

                        {/* Directory Profile Status */}
                        <div className="form-group">
                          <label className="form-label">Directory Profile Status</label>
                          <select
                            className="form-control"
                            value={editLawyerForm.profileStatus}
                            onChange={(e) => setEditLawyerForm({ ...editLawyerForm, profileStatus: e.target.value })}
                          >
                            <option value="incomplete">INCOMPLETE (Drafting Profile)</option>
                            <option value="pending_review">PENDING REVIEW (Awaiting Approval)</option>
                            <option value="published">PUBLISHED (Live on Public Directory)</option>
                            <option value="rejected">REJECTED (Needs Correction)</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => { setLawyerToEdit(null); setLawyerEditError(''); }}
                            disabled={isSavingLawyer}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSavingLawyer}
                          >
                            {isSavingLawyer ? 'Saving Advocate Updates...' : 'Save Advocate Details'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* DELETE ADVOCATE CONFIRMATION MODAL */}
                {lawyerToDelete && (() => {
                  const assignedCases = (adminCases || []).filter(c =>
                    c.lawyerId === lawyerToDelete.lawyerProfileId ||
                    c.lawyerId === lawyerToDelete.id ||
                    c.lawyerId === lawyerToDelete._id
                  );
                  const activeCount = Math.max(lawyerToDelete.casesCount || 0, assignedCases.length);
                  const hasAssignedCases = activeCount > 0;

                  return (
                    <div className="modal-backdrop animate-fade-in" style={{ zIndex: 2100 }}>
                      <div className="user-manage-modal-card animate-fade-in" style={{ borderColor: hasAssignedCases ? 'rgba(234, 179, 8, 0.4)' : 'rgba(239, 68, 68, 0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                          <div style={{ background: hasAssignedCases ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '50%', color: hasAssignedCases ? '#eab308' : '#ef4444' }}>
                            <AlertTriangle size={24} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, color: '#ffffff' }}>
                              {hasAssignedCases ? 'Advocate Deletion Blocked' : 'Confirm Advocate Removal'}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Lawyer Account & Profile Deletion</span>
                          </div>
                        </div>

                        {lawyerDeleteError && (
                          <div className="login-error-alert mb-3" style={{ fontSize: '0.85rem' }}>{lawyerDeleteError}</div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', margin: '14px 0' }}>
                          <Avatar name={lawyerToDelete.name} src={lawyerToDelete.photo} size={48} />
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '1rem' }}>{lawyerToDelete.name}</div>
                            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{lawyerToDelete.email} • {lawyerToDelete.title || 'Advocate'}</div>
                            {lawyerToDelete.barCouncilNumber && (
                              <div style={{ fontSize: '0.75rem', color: '#c5a880', marginTop: '2px' }}>Bar Reg: {lawyerToDelete.barCouncilNumber}</div>
                            )}
                          </div>
                        </div>

                        {hasAssignedCases ? (
                          <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', padding: '14px', margin: '14px 0' }}>
                            <p style={{ color: '#fef08a', fontSize: '0.88rem', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                              ⚠️ Cannot delete advocate with active case assignments:
                            </p>
                            <p style={{ color: '#e2e8f0', fontSize: '0.84rem', margin: 0, lineHeight: '1.5' }}>
                              Advocate <strong>{lawyerToDelete.name}</strong> is currently assigned to <strong>{activeCount} active matter(s)</strong>.
                              To maintain client record integrity and prevent orphaned legal cases, you must reassign these matters to another counsel in <strong>Case Allocations</strong> before deleting this account.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5', margin: '14px 0' }}>
                              Are you sure you want to permanently delete <strong>{lawyerToDelete.name}</strong>?
                            </p>
                            <p style={{ color: '#f87171', fontSize: '0.82rem', margin: '0 0 20px 0', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                              ⚠️ This cannot be undone. The advocate's login credentials, profile, bio, and bar records will be permanently removed.
                            </p>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => { setLawyerToDelete(null); setLawyerDeleteError(''); }}
                            disabled={isDeletingLawyer}
                          >
                            Cancel
                          </button>
                          {hasAssignedCases ? (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                setLawyerToDelete(null);
                                setAdminTab('cases');
                              }}
                            >
                              Go to Case Allocations
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
                              onClick={handleConfirmDeleteLawyer}
                              disabled={isDeletingLawyer}
                            >
                              {isDeletingLawyer ? 'Deleting...' : 'Confirm Permanent Deletion'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* REJECT ADVOCATE MODAL */}
                {lawyerToReject && (
                  <div className="modal-backdrop animate-fade-in" style={{ zIndex: 2150 }}>
                    <div className="user-manage-modal-card animate-fade-in" style={{ maxWidth: '520px', width: '92%', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '50%', color: '#ef4444' }}>
                          <XCircle size={24} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: '#ffffff' }}>Reject Advocate Profile</h4>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Advocate: {lawyerToReject.name}</span>
                        </div>
                      </div>

                      {rejectModalError && (
                        <div className="login-error-alert mb-3" style={{ fontSize: '0.85rem' }}>{rejectModalError}</div>
                      )}

                      <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5', margin: '10px 0' }}>
                        Please provide a mandatory, clear reason explaining why this profile was rejected. This feedback will be sent via email to <strong>{lawyerToReject.email}</strong> so the advocate can correct it and resubmit.
                      </p>

                      <form onSubmit={handleConfirmRejectLawyer}>
                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <label className="form-label" style={{ color: '#f87171' }}>Rejection Reason (Mandatory)*</label>
                          <textarea
                            rows="4"
                            className="form-control"
                            required
                            placeholder="e.g. Please provide a clear professional headshot and verify your Bar Council registration number..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => { setLawyerToReject(null); setRejectReason(''); setRejectModalError(''); }}
                            disabled={isSubmittingReject}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-danger"
                            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
                            disabled={isSubmittingReject || !rejectReason.trim()}
                          >
                            {isSubmittingReject ? 'Sending Rejection...' : 'Confirm Rejection & Email Lawyer'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* ADVOCATE STATUS FILTER TABS */}
                {(() => {
                  const allCount = combinedLawyers.length;
                  const incompleteCount = combinedLawyers.filter(l => (l.profileStatus || 'incomplete') === 'incomplete').length;
                  const pendingCount = combinedLawyers.filter(l => l.profileStatus === 'pending_review').length;
                  const publishedCount = combinedLawyers.filter(l => l.profileStatus === 'published').length;
                  const rejectedCount = combinedLawyers.filter(l => l.profileStatus === 'rejected').length;

                  return (
                    <div className="lawyer-filter-tabs-row" style={{ marginTop: '1.25rem', marginBottom: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'all', label: 'All', count: allCount },
                        { id: 'incomplete', label: 'Incomplete', count: incompleteCount },
                        { id: 'pending_review', label: 'Pending Review', count: pendingCount, isPending: true },
                        { id: 'published', label: 'Published', count: publishedCount },
                        { id: 'rejected', label: 'Rejected', count: rejectedCount }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          className={`btn ${lawyerStatusFilter === tab.id ? 'btn-primary' : 'btn-outline'}`}
                          style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => setLawyerStatusFilter(tab.id)}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={tab.isPending && tab.count > 0 ? 'pending-count-pill' : ''}
                            style={!tab.isPending || tab.count === 0 ? { opacity: 0.8, fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '10px' } : {}}
                          >
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* ADVOCATE ROSTER TABLE */}
                <div className="custom-table-container mt-3">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Advocate</th>
                        <th>Contact & City</th>
                        <th>Title & Experience</th>
                        <th>Specializations</th>
                        <th>Directory Status</th>
                        <th>Active Cases</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const displayedLawyers = combinedLawyers.filter(lawyer => {
                          if (lawyerStatusFilter === 'all') return true;
                          const status = lawyer.profileStatus || 'incomplete';
                          return status === lawyerStatusFilter;
                        });

                        if (displayedLawyers.length === 0) {
                          return (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                No advocates found matching filter "{lawyerStatusFilter.toUpperCase()}".
                              </td>
                            </tr>
                          );
                        }

                        return displayedLawyers.map(lawyer => {
                          const specs = Array.isArray(lawyer.specializations)
                            ? lawyer.specializations
                            : (typeof lawyer.specializations === 'string' && lawyer.specializations ? lawyer.specializations.split(',') : []);

                          const pStatus = lawyer.profileStatus || 'incomplete';
                          let badgeStyle = { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' };
                          let label = 'INCOMPLETE';
                          let icon = null;

                          if (pStatus === 'published') {
                            badgeStyle = { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' };
                            label = 'PUBLISHED';
                            icon = <Check size={12} style={{ marginRight: '3px' }} />;
                          } else if (pStatus === 'pending_review') {
                            badgeStyle = { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' };
                            label = 'PENDING REVIEW';
                            icon = <Clock size={12} style={{ marginRight: '3px' }} />;
                          } else if (pStatus === 'rejected') {
                            badgeStyle = { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
                            label = 'REJECTED';
                            icon = <X size={12} style={{ marginRight: '3px' }} />;
                          }

                          return (
                            <tr key={lawyer.id || lawyer.userId}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <Avatar name={lawyer.name} src={lawyer.photo} size={40} />
                                  <div>
                                    <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>{lawyer.name}</strong>
                                    {lawyer.barCouncilNumber && (
                                      <div style={{ fontSize: '0.74rem', color: '#c5a880', marginTop: '2px' }}>
                                        Bar: {lawyer.barCouncilNumber}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.85rem' }}>{lawyer.email}</div>
                                {lawyer.phone && (
                                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                                    {lawyer.phone}
                                  </div>
                                )}
                                {lawyer.city && (
                                  <div style={{ fontSize: '0.76rem', color: '#38bdf8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <MapPin size={10} /> {lawyer.city}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ fontWeight: '500' }}>{lawyer.title || 'Advocate'}</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                                  {lawyer.experience ? `${lawyer.experience} yrs experience` : 'Experience not listed'}
                                </div>
                                {lawyer.courts && (
                                  <div style={{ fontSize: '0.74rem', color: '#c5a880', marginTop: '2px' }}>
                                    Courts: {lawyer.courts}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                                  {specs.length > 0 ? (
                                    specs.slice(0, 3).map((s, idx) => (
                                      <span
                                        key={idx}
                                        style={{
                                          fontSize: '0.72rem',
                                          background: 'rgba(197, 168, 128, 0.12)',
                                          color: '#c5a880',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          border: '1px solid rgba(197, 168, 128, 0.25)'
                                        }}
                                      >
                                        {s.trim()}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>General Legal Counsel</span>
                                  )}
                                  {specs.length > 3 && (
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>+{specs.length - 3}</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div>
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      color: badgeStyle.color,
                                      background: badgeStyle.bg,
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      border: `1px solid ${badgeStyle.border}`,
                                      display: 'inline-flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {icon} {label}
                                  </span>
                                  {pStatus === 'rejected' && lawyer.rejectionReason && (
                                    <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '4px', maxWidth: '180px', lineHeight: '1.2' }} title={lawyer.rejectionReason}>
                                      Reason: {lawyer.rejectionReason.length > 35 ? lawyer.rejectionReason.slice(0, 35) + '...' : lawyer.rejectionReason}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    color: (lawyer.casesCount || 0) > 0 ? '#ffd700' : '#94a3b8',
                                    background: (lawyer.casesCount || 0) > 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    border: `1px solid ${(lawyer.casesCount || 0) > 0 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                                    display: 'inline-block'
                                  }}
                                >
                                  {lawyer.casesCount || 0} {(lawyer.casesCount || 0) === 1 ? 'case' : 'cases'}
                                </span>
                              </td>
                              <td>
                                <div className="user-action-buttons" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {/* APPROVAL WORKFLOW BUTTONS */}
                                  {pStatus === 'pending_review' && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ fontSize: '0.72rem', padding: '3px 8px', backgroundColor: '#15803d', borderColor: '#16a34a', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                        onClick={() => handleApproveLawyer(lawyer)}
                                        title="Approve and Publish to Directory"
                                      >
                                        <CheckCircle size={11} /> Approve
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-danger"
                                        style={{ fontSize: '0.72rem', padding: '3px 8px', backgroundColor: '#dc2626', borderColor: '#ef4444', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                        onClick={() => { setLawyerToReject(lawyer); setRejectReason(''); setRejectModalError(''); }}
                                        title="Reject with mandatory feedback"
                                      >
                                        <XCircle size={11} /> Reject
                                      </button>
                                    </>
                                  )}

                                  {pStatus === 'published' && (
                                    <>
                                      <a
                                        href={`#/lawyers/${lawyer.slug || lawyer.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-action-edit"
                                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#38bdf8' }}
                                        title="View Public Profile"
                                      >
                                        <ExternalLink size={11} /> Live
                                      </a>
                                      <button
                                        type="button"
                                        className="btn-action-delete"
                                        style={{ color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
                                        onClick={() => handleUnpublishLawyer(lawyer)}
                                        title="Unpublish from Public Directory"
                                      >
                                        Unpublish
                                      </button>
                                    </>
                                  )}

                                  {(pStatus === 'incomplete' || pStatus === 'rejected') && (
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      style={{ fontSize: '0.72rem', padding: '3px 8px', backgroundColor: '#15803d', borderColor: '#16a34a', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                      onClick={() => handleApproveLawyer(lawyer)}
                                      title="Directly publish to directory"
                                    >
                                      <CheckCircle size={11} /> Publish
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="btn-action-edit"
                                    onClick={() => handleStartEditLawyer(lawyer)}
                                    title="Edit Advocate Profile"
                                  >
                                    <Edit3 size={11} /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-action-delete"
                                    onClick={() => handleStartDeleteLawyer(lawyer)}
                                    title="Delete Advocate"
                                  >
                                    <Trash2 size={11} /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CASE ALLOCATION & MASTER FILE MANAGER */}
            {adminTab === 'cases' && (
              <div className="portal-docs-tab animate-fade-in">
                <h3 className="workspace-title">Firm Master Case Registry</h3>
                <p className="workspace-desc">Complete administrative overview of active firm litigation matters, client assignments, progress metrics, and lawyer allocations.</p>

                {caseActionFeedback && (
                  <div className={caseActionFeedback.type === 'success' ? 'portal-success-badge animate-fade-in' : 'login-error-alert animate-fade-in'} style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                    {caseActionFeedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{caseActionFeedback.text}</span>
                  </div>
                )}

                {selectedCaseForAssign && (
                  <div className="glass-card mb-4 mt-3" style={{ padding: '20px', borderLeft: '4px solid var(--gold-primary)' }}>
                    <h4>Assign Advocate for: "{selectedCaseForAssign.title}"</h4>
                    <form onSubmit={handleCaseAllocationSubmit} style={{ marginTop: '15px' }}>
                      <div className="form-group">
                        <label className="form-label">Select Active Advocate Profile</label>
                        <select required className="form-control" value={assignedLawyerIdInput} onChange={(e) => setAssignedLawyerIdInput(e.target.value)}>
                          <option value="">Select Counsel Match</option>
                          {combinedLawyers.map(lawyer => (
                            <option key={lawyer.lawyerProfileId || lawyer.id} value={lawyer.lawyerProfileId || lawyer.id}>
                              {lawyer.name} ({lawyer.title || 'Advocate'}{lawyer.role === 'ADMIN' ? ' - Admin' : ''})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button type="submit" className="btn btn-primary" disabled={isAssigningLawyer}>
                          {isAssigningLawyer ? 'Assigning...' : 'Assign Counsel'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => setSelectedCaseForAssign(null)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* EDIT CASE MODAL */}
                {selectedCaseForEdit && (
                  <div className="modal-backdrop animate-fade-in" style={{ zIndex: 2100 }}>
                    <div className="edit-case-modal-card animate-fade-in" style={{ maxWidth: '650px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Edit Case: {selectedCaseForEdit.caseNumber || selectedCaseForEdit.title}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Update matter details, counsel allocation, and progress metrics</span>
                        </div>
                        <button
                          type="button"
                          className="btn-text"
                          style={{ fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none' }}
                          onClick={() => {
                            setSelectedCaseForEdit(null);
                            setCaseActionFeedback(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {caseActionFeedback && (
                        <div className={caseActionFeedback.type === 'success' ? 'portal-success-badge mb-3' : 'login-error-alert mb-3'}>
                          {caseActionFeedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                          <span>{caseActionFeedback.text}</span>
                        </div>
                      )}

                      <form onSubmit={handleCaseEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Case Title *</label>
                          <input
                            type="text"
                            required
                            className="form-control"
                            value={editCaseForm.title}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, title: e.target.value })}
                            placeholder="e.g. Acme Corp Acquisition Due Diligence"
                          />
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Case Number</label>
                            <input
                              type="text"
                              className="form-control font-mono"
                              value={editCaseForm.caseNumber}
                              onChange={(e) => setEditCaseForm({ ...editCaseForm, caseNumber: e.target.value })}
                              placeholder="LAW-2026-CASE"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Practice Area / Type</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editCaseForm.caseType}
                              onChange={(e) => setEditCaseForm({ ...editCaseForm, caseType: e.target.value })}
                              placeholder="Litigation, Corporate, IP, etc."
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Assigned Advocate / Lawyer</label>
                          <select
                            className="form-control"
                            value={editCaseForm.lawyerProfileId}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, lawyerProfileId: e.target.value })}
                          >
                            <option value="">-- Unallocated (No Lawyer Assigned) --</option>
                            {combinedLawyers.map(lawyer => (
                              <option key={lawyer.lawyerProfileId || lawyer.id} value={lawyer.lawyerProfileId || lawyer.id}>
                                {lawyer.name} ({lawyer.title || 'Advocate'}{lawyer.role === 'ADMIN' ? ' - Admin' : ''})
                              </option>
                            ))}
                          </select>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                            ✉️ If a new lawyer is assigned, an official allotment email notification will be dispatched automatically.
                          </span>
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                              className="form-control"
                              value={editCaseForm.status}
                              onChange={(e) => setEditCaseForm({ ...editCaseForm, status: e.target.value })}
                            >
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="HEARING_SCHEDULED">HEARING_SCHEDULED</option>
                              <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Completion Progress ({editCaseForm.progress}%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="form-control"
                              value={editCaseForm.progress}
                              onChange={(e) => setEditCaseForm({ ...editCaseForm, progress: Number(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Next Hearing Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={editCaseForm.hearingDate}
                              onChange={(e) => setEditCaseForm({ ...editCaseForm, hearingDate: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Filing Deadline</label>
                            <input
                              type="date"
                              className="form-control"
                              value={editCaseForm.deadline}
                              onChange={(e) => setEditCaseForm({ ...editCaseForm, deadline: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Case Summary / Background</label>
                          <textarea
                            rows="3"
                            className="form-control"
                            value={editCaseForm.description}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, description: e.target.value })}
                            placeholder="Brief description of matter, parties involved, or claims..."
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Latest Status Remarks</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editCaseForm.lastUpdate}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, lastUpdate: e.target.value })}
                            placeholder="e.g. Rejoinder filed in High Court; awaiting listing"
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                              setSelectedCaseForEdit(null);
                              setCaseActionFeedback(null);
                            }}
                            disabled={isUpdatingCase}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isUpdatingCase}
                          >
                            {isUpdatingCase ? 'Saving Updates...' : 'Save Case Updates'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="custom-table-container mt-3">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Case Number</th>
                        <th>Case Title</th>
                        <th>Client Details</th>
                        <th>Assigned Advocate</th>
                        <th>Status & Progress</th>
                        <th>Latest Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(adminCases.length > 0 ? adminCases : adminUsers.filter(u => u.role === 'CLIENT').flatMap(c => (c.profileDetails?.cases || []))).map(cs => {
                        const clientName = cs.client?.user?.name || cs.clientName || 'Private Client';
                        const clientEmail = cs.client?.user?.email || '';
                        const clientPhone = cs.client?.user?.phone || '';

                        const lawyerName = cs.lawyer?.user?.name || cs.lawyer?.title || (cs.lawyerId ? adminUsers.find(u => u.profileDetails?.id === cs.lawyerId)?.name : null);
                        const caseId = cs.id || cs._id;

                        return (
                          <tr key={caseId}>
                            <td className="font-mono" style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>{cs.caseNumber || 'LAW-2026-CASE'}</td>
                            <td>
                              <strong>{cs.title}</strong>
                              {cs.caseType && (
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                  {cs.caseType}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Avatar name={clientName} size={28} />
                                <div>
                                  <strong>{clientName}</strong>
                                  {clientEmail && <div style={{ fontSize: '0.78rem', color: '#a0a0a0' }}>{clientEmail}</div>}
                                  {clientPhone && <div style={{ fontSize: '0.78rem', color: '#a0a0a0' }}>{clientPhone}</div>}
                                </div>
                              </div>
                            </td>
                            <td>
                              {lawyerName ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Avatar name={lawyerName} size={28} />
                                  <strong style={{ color: '#c5a880' }}>{lawyerName}</strong>
                                </div>
                              ) : (
                                <span className="red-text" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Unallocated</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge-inline ${cs.status === 'CLOSED' ? 'paid' : 'unpaid'}`} style={{ fontSize: '0.75rem' }}>
                                {cs.status || 'IN_PROGRESS'}
                              </span>
                              <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#a0a0a0' }}>
                                Completion: <strong>{cs.progress || 0}%</strong>
                              </div>
                            </td>
                            <td>
                              <div style={{ maxWidth: '220px', fontSize: '0.8rem', color: '#d1d5db' }}>
                                {cs.lastUpdate || 'No status remarks logged yet.'}
                              </div>
                            </td>
                            <td>
                              <div className="user-action-buttons">
                                <button
                                  type="button"
                                  className="btn-action-edit"
                                  onClick={() => handleStartEditCase(cs)}
                                  title="Edit Case & Assign Lawyer"
                                >
                                  <Edit3 size={12} /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-action-delete"
                                  onClick={() => handleDeleteCase(cs)}
                                  disabled={isDeletingCaseId === caseId}
                                  title="Permanently Delete Case"
                                >
                                  <Trash2 size={12} /> {isDeletingCaseId === caseId ? '...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {adminCases.length === 0 && adminUsers.filter(u => u.role === 'CLIENT').every(c => !c.profileDetails?.cases?.length) && (
                        <tr>
                          <td colSpan="7" className="text-center" style={{ padding: '30px' }}>
                            No active case files found in firm database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LEGAL ENQUIRIES */}
            {adminTab === 'enquiries' && (
              <div className="portal-docs-tab animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '1rem' }}>
                  <div>
                    <h3 className="workspace-title" style={{ margin: 0 }}>Visitor Intake Enquiries</h3>
                    <p className="workspace-desc" style={{ margin: '4px 0 0 0' }}>Review submitted legal consult queries ({adminEnquiries.length} total).</p>
                  </div>
                  {adminEnquiries.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{
                        borderColor: '#dc2626',
                        color: '#f87171',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={handleDeleteAllEnquiries}
                      disabled={isDeletingAllEnquiries}
                    >
                      <Trash2 size={14} /> {isDeletingAllEnquiries ? 'Deleting All...' : `Delete All Visitor Intake Enquiries (${adminEnquiries.length})`}
                    </button>
                  )}
                </div>

                {enquiryActionFeedback && (
                  <div className={enquiryActionFeedback.type === 'success' ? 'portal-success-badge animate-fade-in' : 'login-error-alert animate-fade-in'} style={{ marginBottom: '1rem' }}>
                    {enquiryActionFeedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{enquiryActionFeedback.text}</span>
                  </div>
                )}

                <div className="custom-table-container mt-3">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Sender Details</th>
                        <th>Subject Details</th>
                        <th>Enquiry Query Message</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminEnquiries.map(eq => {
                        const eqId = eq.id || eq._id;
                        return (
                          <tr key={eqId}>
                            <td>
                              <strong>{eq.name}</strong> <br />
                              <a href={`mailto:${eq.email}`} style={{ fontSize: '0.85rem' }}>{eq.email}</a> <br />
                              <span style={{ fontSize: '0.8rem', color: '#c5a880' }}>{eq.phone || 'No Phone'}</span>
                            </td>
                            <td>
                              <strong>Subject:</strong> {eq.subject || 'General Enquiry'} <br />
                              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Practice Group: {eq.practiceArea || 'Unassigned'}</span>
                            </td>
                            <td><div style={{ maxWidth: '300px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{eq.message}</div></td>
                            <td>
                              <span className={`status-badge-inline ${eq.status.toLowerCase()}`}>
                                {eq.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {eq.status === 'NEW' ? (
                                  <button className="btn btn-primary btn-pay-small" onClick={() => updateEnquiryStatus(eqId, 'RESOLVED')}>
                                    Resolve
                                  </button>
                                ) : (
                                  <span className="green-text" style={{ fontSize: '0.8rem' }}>Settled</span>
                                )}
                                <button
                                  type="button"
                                  className="btn-action-delete"
                                  onClick={() => handleDeleteEnquiry(eq)}
                                  disabled={isDeletingEnquiryId === eqId}
                                  title="Delete Enquiry Record"
                                >
                                  <Trash2 size={12} /> {isDeletingEnquiryId === eqId ? '...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {adminEnquiries.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center" style={{ padding: '30px', color: '#94a3b8' }}>
                            No visitor intake enquiries present in the database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CAREER APPLICATIONS TAB */}
            {adminTab === 'careers' && (
              <div className="portal-docs-tab animate-fade-in">
                <h3 className="workspace-title">Recruitment & Job Applications</h3>
                <p className="workspace-desc">Review advocate resumes, partner applications, and associate candidate details submitted via the Careers section.</p>

                <div className="custom-table-container mt-3">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Target Position</th>
                        <th>Candidate Info</th>
                        <th>Cover Note & Pitch</th>
                        <th>Resume</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(adminJobApplications || []).map(app => (
                        <tr key={app._id || app.id}>
                          <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td><strong className="gold-text">{app.jobTitle}</strong></td>
                          <td>
                            <strong>{app.name}</strong><br />
                            <a href={`mailto:${app.email}`} style={{ fontSize: '0.85rem' }}>{app.email}</a><br />
                            <a href={`tel:${app.phone}`} style={{ fontSize: '0.85rem', color: '#c5a880' }}>{app.phone}</a>
                          </td>
                          <td><div style={{ maxWidth: '280px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{app.coverLetter || 'No cover note provided.'}</div></td>
                          <td>
                            {app.hasResume || app.fileName ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', wordBreak: 'break-all' }}>
                                  {app.fileName || 'Resume Document'}
                                </span>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => handleViewResume(app)}
                                    title="View Resume in New Tab"
                                  >
                                    <Eye size={12} /> View Resume
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => handleDownloadResume(app)}
                                    title="Download Resume Document"
                                  >
                                    <Download size={12} /> Download
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#888', fontSize: '0.8rem', fontStyle: 'italic' }}>No Resume</span>
                            )}
                          </td>
                          <td>
                            <span className="status-badge-inline new">
                              SUBMITTED
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() => handleDeleteCareerApplication(app.id || app._id, app.name)}
                              title="Delete Career Application"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!adminJobApplications || adminJobApplications.length === 0) && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                            No career applications submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ADMIN DUAL-ROLE: MY LAWYER SELF-SERVICE PROFILE */}
            {adminTab === 'my-lawyer-profile' && renderLawyerSelfProfile()}

            {/* ADMIN DUAL-ROLE: MY CASES */}
            {adminTab === 'my-cases' && renderLawyerCasesView()}

            {/* ADMIN PROFILE & SECURITY */}
            {adminTab === 'profile' && renderProfileSection(
              'Administrator Profile & Security Credentials',
              'Review your firm administrative account and update your password.'
            )}
          </div>
        </section>

        {renderProfileModal()}
      </div>
    );
  }


  // Fallback loading state (safely renders empty container)
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <h3>Workspace is connecting to system server...</h3>
    </div>
  );
}
