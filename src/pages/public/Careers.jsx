import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { FileUp, Search, Briefcase, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './Careers.css';

export default function Careers() {
  const { jobListings, addJobApplication } = useContext(AppContext);

  // Job search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoc, setSelectedLoc] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Application states
  const [targetJob, setTargetJob] = useState('');
  const [appName, setAppName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appCover, setAppCover] = useState('');
  
  // File upload simulator states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [appSuccess, setAppSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const locations = ['All', 'Indore (M.G. Road)', 'Timarni (M.P)', 'Indore (Galaxy Homes)'];
  const departments = ['All', 'Corporate Law', 'Intellectual Property', 'Dispute Resolution', 'Taxation'];

  const filteredJobs = jobListings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLoc = selectedLoc === 'All' || !selectedLoc ? true : job.location === selectedLoc;
    const matchesDept = selectedDept === 'All' || !selectedDept ? true : job.department === selectedDept;
    
    return matchesSearch && matchesLoc && matchesDept;
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!['.pdf', '.doc', '.docx'].includes(ext)) {
        setFormError('Invalid file type. Only PDF, DOC, and DOCX documents are allowed.');
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Resume file size exceeds the 5 MB limit. Please select a smaller document.');
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      setFormError('');
      setSelectedFile(file);
    }
  };

  const isValidEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(val).trim());
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!appName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!appEmail.trim()) {
      setFormError('Email address is required.');
      return;
    }

    if (!isValidEmail(appEmail)) {
      setFormError('Please enter a valid email address (e.g. yourname@example.com).');
      return;
    }

    if (!appPhone.trim()) {
      setFormError('Please enter your contact phone number.');
      return;
    }

    if (!selectedFile) {
      setFormError('Please select and upload your resume (PDF, DOC, or DOCX up to 5 MB) to complete the application.');
      return;
    }

    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.doc', '.docx'].includes(ext)) {
      setFormError('Invalid file type. Only PDF, DOC, and DOCX documents are accepted.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFormError('Resume file size exceeds the 5 MB limit. Please upload a smaller document.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      const cleanName = appName.trim();
      const cleanEmail = appEmail.trim();
      const cleanPhone = appPhone.trim();
      const cleanJob = targetJob.trim() || 'General Application';
      const cleanCover = appCover.trim();

      // Append text fields first (RFC 7578 multipart standard) with redundant aliases
      formData.append('name', cleanName);
      formData.append('fullName', cleanName);
      formData.append('appName', cleanName);
      formData.append('applicantName', cleanName);
      formData.append('email', cleanEmail);
      formData.append('appEmail', cleanEmail);
      formData.append('phone', cleanPhone);
      formData.append('appPhone', cleanPhone);
      formData.append('phoneNumber', cleanPhone);
      formData.append('jobId', cleanJob);
      formData.append('jobTitle', cleanJob);
      formData.append('position', cleanJob);
      formData.append('coverLetter', cleanCover);
      formData.append('coverNote', cleanCover);
      formData.append('message', cleanCover);

      // Append file after text fields
      if (selectedFile) {
        formData.append('resume', selectedFile);
        formData.append('file', selectedFile);
      }

      setUploadProgress(65);
      const res = await addJobApplication(formData);
      setUploadProgress(100);

      if (res && res.success) {
        setAppSuccess(true);
        setFormError('');
        setAppName('');
        setAppEmail('');
        setAppPhone('');
        setAppCover('');
        setSelectedFile(null);
        setTargetJob('');
      } else {
        setFormError(res?.message || 'Failed to submit application. Please verify details and try again.');
      }
    } catch (err) {
      console.error('Application submit error:', err);
      setFormError(err.message || 'An unexpected error occurred while uploading your application.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="careers-page animate-fade-in">
      {/* Banner */}
      <section className="careers-hero">
        <div className="container text-center">
          <span className="section-tag">CAREERS AT LAWZUNCTION</span>
          <h1 className="careers-hero-title">Join Our Partnership</h1>
          <p className="careers-hero-subtitle">Cultivating advocate ethics, legal scholarship, and courtroom excellence</p>
        </div>
      </section>

      {/* Culture & Life */}
      <section className="section culture-section">
        <div className="container grid-2 align-center">
          <div className="culture-left-content">
            <h2 className="section-title">Why Join Lawzunction?</h2>
            <p className="story-para">
              We believe in mentoring advocates to think like partners early in their careers. Lawzunction provides active training workshops, litigation simulations, and regulatory updates briefings, allowing associates to build deep expertise.
            </p>
            <p className="story-para">
              We offer structured work hours, meritocratic review protocols, competitive equity tracks, and an inclusive work environment. We actively support research contributions and academic papers published in law reviews.
            </p>
            
            <div className="culture-highlights grid-2">
              <div className="culture-highlight-card glass-card">
                <span className="gold-text highlight-big">1:1</span>
                <h6>Partner Mentorship</h6>
                <p>Work directly alongside Senior Partners on major complex matters.</p>
              </div>
              <div className="culture-highlight-card glass-card">
                <span className="gold-text highlight-big">100%</span>
                <h6>Continuing Education</h6>
                <p>Fully funded state bar enrollment and international seminar credits.</p>
              </div>
            </div>
          </div>

          {/* Form container */}
          <div className="culture-right-form-panel">
            <div className="glass-card careers-application-form-card">
              <h3 className="form-title">Submit Application</h3>
              <p className="form-desc">Submit your resume directly to our HR committee for lateral positions or internships.</p>
              
              {appSuccess ? (
                <div className="application-success text-center animate-fade-in">
                  <CheckCircle className="success-icon" />
                  <h4>Application Logged</h4>
                  <p>Our recruitment team has recorded your details. You can track application status in the Client Portal if you possess portal credentials.</p>
                  <button className="btn btn-secondary mt-3" onClick={() => setAppSuccess(false)}>
                    Submit Another Application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="application-form">
                  {formError && (
                    <div className="form-error-alert animate-fade-in" style={{
                      padding: '10px 14px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#ef4444',
                      fontSize: '0.88rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="career-position">Position Desired</label>
                    <select
                      id="career-position"
                      name="position"
                      required
                      className="form-control"
                      value={targetJob}
                      onChange={(e) => {
                        setTargetJob(e.target.value);
                        if (formError) setFormError('');
                      }}
                    >
                      <option value="">Select Target Position</option>
                      <option value="General Application">General Lateral Hire</option>
                      <option value="Legal Intern">Legal Intern</option>
                      {jobListings.map(job => (
                        <option key={job.id} value={job.title}>{job.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="career-appName">Full Name</label>
                    <input
                      id="career-appName"
                      name="name"
                      type="text"
                      required
                      placeholder="Your Name"
                      className="form-control"
                      value={appName}
                      onChange={(e) => {
                        setAppName(e.target.value);
                        if (formError) setFormError('');
                      }}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="career-appEmail">Email Address</label>
                      <input
                        id="career-appEmail"
                        name="email"
                        type="email"
                        required
                        placeholder="email@example.com"
                        className="form-control"
                        value={appEmail}
                        onChange={(e) => {
                          setAppEmail(e.target.value);
                          if (formError) setFormError('');
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="career-appPhone">Phone Number</label>
                      <input
                        id="career-appPhone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="+91 XXXXX XXXXX"
                        className="form-control"
                        value={appPhone}
                        onChange={(e) => {
                          setAppPhone(e.target.value);
                          if (formError) setFormError('');
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="career-appCover">Brief Cover Note</label>
                    <textarea
                      id="career-appCover"
                      name="coverLetter"
                      rows="2"
                      placeholder="Why do you wish to join Lawzunction?"
                      className="form-control"
                      value={appCover}
                      onChange={(e) => setAppCover(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Resume Uploader */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="resume-file">Upload Resume (PDF, DOC, DOCX — max 5MB)</label>
                    <div className="resume-drop-zone">
                      <input
                        type="file"
                        name="resume"
                        accept=".pdf,.doc,.docx"
                        id="resume-file"
                        className="hidden-file-input"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="resume-file" className="drop-zone-label">
                        <FileUp size={24} className="gold-text" />
                        <span>{selectedFile ? `Selected: ${selectedFile.name}` : 'Click or Drag Resume (PDF, DOC, DOCX)'}</span>
                      </label>
                    </div>
                  </div>

                  {isUploading ? (
                    <div className="upload-progress-box animate-fade-in">
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <p>Uploading Resume... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <button type="submit" className="btn btn-primary btn-block">
                      Submit Profile
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Job Board List */}
      <section className="section job-board-section">
        <div className="container">
          <div className="text-center">
            <span className="section-tag">OPEN OPPORTUNITIES</span>
            <h2 className="section-title">Lawzunction Job Board</h2>
            <p className="section-subtitle">Browse open lateral hires, advisory roles, and internships across our metro locations.</p>
          </div>

          {/* Job Search Ribbon */}
          <div className="job-filters-ribbon glass-card">
            <div className="filter-input-group search">
              <Search size={16} className="gold-text" />
              <input
                type="text"
                placeholder="Search job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input-field"
              />
            </div>
            <div className="filter-input-group">
              <MapPin size={14} className="gold-text" />
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="filter-dropdown"
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="filter-input-group">
              <Briefcase size={14} className="gold-text" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="filter-dropdown"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Jobs List Grid */}
          <div className="jobs-list-container">
            {filteredJobs.length === 0 ? (
              <p className="text-center text-muted py-5">No open positions matching your filter criteria. Submit a general lateral application above.</p>
            ) : (
              <div className="jobs-board-vertical-list">
                {filteredJobs.map(job => (
                  <div key={job.id} className="glass-card job-board-item-card">
                    <div className="job-item-header">
                      <div>
                        <h4>{job.title}</h4>
                        <div className="job-meta-labels">
                          <span><MapPin size={12} /> {job.location}</span>
                          <span><Briefcase size={12} /> {job.department}</span>
                          <span><Clock size={12} /> {job.type} • Experience: {job.experience}</span>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setTargetJob(job.title);
                          window.scrollTo({ top: document.querySelector('.culture-right-form-panel').offsetTop - 100, behavior: 'smooth' });
                        }}
                      >
                        Apply Now
                      </button>
                    </div>
                    <p className="job-item-desc">{job.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      
    </div>
  );
}
