import React, { useState } from 'react';

interface SoftLoginModalProps {
  onSubmit: (name: string, phone: string) => void;
  onClose: () => void;
}

export default function SoftLoginModal({ onSubmit, onClose }: SoftLoginModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }
    onSubmit(trimmedName, trimmedPhone);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: '#0c0c18', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}
          >
            <svg className="w-6 h-6" style={{ color: '#00ff87' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Ready to Solve?</h3>
          <p className="text-sm text-slate-400 mt-1">Enter your details to start coding</p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="soft-name" className="block text-xs font-medium text-slate-400 mb-1.5">
              Your Name
            </label>
            <input
              id="soft-name"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Aarav Sharma"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-colors"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div>
            <label htmlFor="soft-phone" className="block text-xs font-medium text-slate-400 mb-1.5">
              Phone Number
            </label>
            <input
              id="soft-phone"
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); }}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-colors"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,135,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{ background: '#00ff87', color: '#04040a' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#00e87a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#00ff87')}
          >
            Start Solving
          </button>
        </form>

        <p className="text-[10px] text-slate-600 text-center mt-4">
          We only use this to track your progress. No spam.
        </p>
      </div>
    </div>
  );
}
