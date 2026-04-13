import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PACKAGES = [
  { name: 'Seedling', amount: 80 },
  { name: 'Sprout', amount: 150 },
  { name: 'Sapling', amount: 300 },
  { name: 'Budding', amount: 500 },
  { name: 'Blossoming', amount: 800 },
  { name: 'Growing', amount: 1200 },
  { name: 'Thriving', amount: 2000 },
  { name: 'Flourishing', amount: 3000 },
  { name: 'Abundant', amount: 4500 },
  { name: 'Prosperous', amount: 6000 },
  { name: 'Wealthy', amount: 8000 },
  { name: 'Elite', amount: 10000 },
  { name: 'Premium', amount: 12000 },
];

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [popFile, setPopFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=select, 2=upload
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/investments/packages')
      .then((res) => setPackages(res.data))
      .catch(() => {
        // Fallback calculation
        setPackages(PACKAGES.map((p) => ({
          ...p,
          dailyProfit: (p.amount * 0.05).toFixed(2),
          totalProfit: (p.amount * 0.05 * 60).toFixed(2),
          durationDays: 60,
          dailyRate: '5%',
        })));
      });
  }, []);

  const handleSelect = (pkg) => {
    setSelected(pkg);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPopFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!popFile) return toast.error('Please upload your proof of payment');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('packageName', selected.name);
      formData.append('pop', popFile);
      await api.post('/api/investments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Investment submitted! Awaiting admin approval.');
      navigate('/investments');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit investment');
    } finally {
      setLoading(false);
    }
  };

  const popularIndex = 6; // Thriving (R2000)

  return (
    <div>
      {step === 1 && (
        <>
          <div className="section-title">Investment Packages</div>
          <p className="section-subtitle">
            Choose a package that suits your budget. Earn 5% daily for 60 days.
          </p>

          {/* Earnings explainer */}
          <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff5f5, #f0fff4)', border: '2px solid var(--tomato-light)' }}>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'var(--tomato-red)', marginBottom: '0.5rem' }}>💡 How It Works</h3>
                <p style={{ color: 'var(--gray-700)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  Invest in any package and earn <strong>5% daily</strong> on your initial investment 
                  for <strong>60 days</strong>. Upload your proof of payment and our admin will 
                  activate your investment within 24 hours.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--tomato-red)' }}>5%</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Daily Rate</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green)' }}>60</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Days</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>300%</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Total Return</div>
                </div>
              </div>
            </div>
          </div>

          <div className="packages-grid">
            {packages.map((pkg, i) => (
              <div
                key={pkg.name}
                className={`package-card ${i === popularIndex ? 'popular' : ''}`}
                onClick={() => handleSelect(pkg)}
              >
                <div className="package-amount">R{pkg.amount.toLocaleString()}</div>
                <div className="package-name">🍅 {pkg.name} Package</div>
                <div className="package-detail">
                  <span className="label">Daily Profit</span>
                  <span className="value text-green">+R{parseFloat(pkg.dailyProfit).toFixed(2)}</span>
                </div>
                <div className="package-detail">
                  <span className="label">Duration</span>
                  <span className="value">60 Days</span>
                </div>
                <div className="package-detail">
                  <span className="label">Total Profit</span>
                  <span className="value text-red">R{parseFloat(pkg.totalProfit).toFixed(2)}</span>
                </div>
                <div className="package-detail">
                  <span className="label">Total Return</span>
                  <span className="value">R{(pkg.amount + parseFloat(pkg.totalProfit)).toFixed(2)}</span>
                </div>
                <button className="btn btn-primary btn-block btn-sm" style={{ marginTop: '1rem' }}>
                  Invest Now →
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && selected && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setStep(1); setPopFile(null); }}>
              ← Back to Packages
            </button>
          </div>

          <div className="section-title">Confirm Investment</div>
          <p className="section-subtitle">Upload your proof of payment to activate this investment</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Summary */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: '1.25rem' }}>Investment Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#fff5f5', borderRadius: 8 }}>
                  <span className="text-gray">Package</span>
                  <strong>🍅 {selected.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 8 }}>
                  <span className="text-gray">Investment Amount</span>
                  <strong>R{selected.amount.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--green-light)', borderRadius: 8 }}>
                  <span className="text-gray">Daily Profit</span>
                  <strong className="text-green">+R{parseFloat(selected.dailyProfit).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 8 }}>
                  <span className="text-gray">Duration</span>
                  <strong>60 Days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#fff5f5', borderRadius: 8 }}>
                  <span className="text-gray">Total Profit</span>
                  <strong className="text-red">R{parseFloat(selected.totalProfit).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'linear-gradient(135deg, var(--tomato-red), var(--tomato-dark))', borderRadius: 8, color: 'white' }}>
                  <span>Total Return</span>
                  <strong style={{ fontSize: '1.1rem' }}>R{(selected.amount + parseFloat(selected.totalProfit)).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Upload POP */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: '0.5rem' }}>Upload Proof of Payment</div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Please transfer <strong>R{selected.amount.toLocaleString()}</strong> to our account and upload the proof below.
              </p>

              <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
                📢 Bank Details: <strong>FNB Business · Account: 62123456789 · Branch: 250655</strong>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Proof of Payment (Image or PDF)</label>
                  <label className={`upload-area ${popFile ? 'dragover' : ''}`} htmlFor="pop-upload">
                    {popFile ? (
                      <div>
                        <div className="upload-icon">✅</div>
                        <p className="font-semibold">{popFile.name}</p>
                        <p className="text-sm text-gray">{(popFile.size / 1024).toFixed(1)} KB</p>
                        <p className="text-sm text-red" style={{ marginTop: '0.5rem' }}>Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <div className="upload-icon">📎</div>
                        <p className="font-semibold">Click to upload</p>
                        <p className="text-sm text-gray">JPG, PNG, PDF (max 5MB)</p>
                      </div>
                    )}
                  </label>
                  <input
                    id="pop-upload"
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading || !popFile}>
                  {loading ? '⏳ Submitting...' : '🚀 Submit Investment'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Packages;
