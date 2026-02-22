import React, { useState } from 'react';
import { XMarkIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

interface PublishEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsuleId: string;
  capsuleTitle: string;
}

export default function PublishEmbedModal({ isOpen, onClose, capsuleId, capsuleTitle }: PublishEmbedModalProps) {
  const [activeTab, setActiveTab] = useState<'iframe' | 'link' | 'lti'>('iframe');
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  // Generate the embed codes with real URLs
  const embedUrl = process.env.NEXT_PUBLIC_EMBED_URL || 'http://localhost:3002'; // Embed app port
  const capsuleEmbedUrl = `${embedUrl}?widgetId=${capsuleId}`;
  
  const iframeCode = `<iframe 
  src="${capsuleEmbedUrl}${showPoweredBy ? '' : '&hide_branding=true'}" 
  width="100%" 
  height="600" 
  frameborder="0"
  allow="clipboard-write"
  title="${capsuleTitle} - Devcapsules">
</iframe>`;

  const ltiConfig = `<?xml version="1.0" encoding="UTF-8"?>
<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0"
    xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
    xmlns:lticm="http://www.imsglobal.org/xsd/imslticm_v1p0"
    xmlns:lticp="http://www.imsglobal.org/xsd/imslticp_v1p0">
  <blti:title>${capsuleTitle}</blti:title>
  <blti:description>Interactive coding exercise: ${capsuleTitle}</blti:description>
  <blti:launch_url>${capsuleEmbedUrl}</blti:launch_url>
  <blti:secure_launch_url>${capsuleEmbedUrl}</blti:secure_launch_url>
</cartridge_basiclti_link>`;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const CopyButton = ({ text, copyKey, label }: { text: string; copyKey: string; label: string }) => {
    const isCopied = copiedStates[copyKey];
    
    return (
      <button
        onClick={() => copyToClipboard(text, copyKey)}
        className="flex items-center space-x-2 text-[#04040a] px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        style={{ background: '#00ff87' }}
        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#00e87a'}
        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#00ff87'}
      >
        {isCopied ? (
          <>
            <CheckIcon className="w-4 h-4" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <ClipboardIcon className="w-4 h-4" />
            <span>{label}</span>
          </>
        )}
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ background: 'rgba(4,4,10,0.85)' }}>
      <div className="rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="text-xl font-bold text-white">Publish & Embed</h2>
            <p className="text-slate-400 text-sm mt-1">{capsuleTitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=''}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => setActiveTab('iframe')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'iframe' 
                ? ''
                : 'text-slate-400 hover:text-white'
            }`}
            style={activeTab === 'iframe' ? { color: '#00ff87', borderBottom: '2px solid #00ff87', background: 'rgba(0,255,135,0.03)' } : { }}
            onMouseEnter={e=>{ if (activeTab !== 'iframe') (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
            onMouseLeave={e=>{ if (activeTab !== 'iframe') (e.currentTarget as HTMLElement).style.background=''; }}
          >
            &lt;iframe&gt; Embed
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'link' 
                ? ''
                : 'text-slate-400 hover:text-white'
            }`}
            style={activeTab === 'link' ? { color: '#00ff87', borderBottom: '2px solid #00ff87', background: 'rgba(0,255,135,0.03)' } : { }}
            onMouseEnter={e=>{ if (activeTab !== 'link') (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
            onMouseLeave={e=>{ if (activeTab !== 'link') (e.currentTarget as HTMLElement).style.background=''; }}
          >
            Direct Link
          </button>
          <button
            onClick={() => setActiveTab('lti')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'lti' 
                ? ''
                : 'text-slate-400 hover:text-white'
            }`}
            style={activeTab === 'lti' ? { color: '#00ff87', borderBottom: '2px solid #00ff87', background: 'rgba(0,255,135,0.03)' } : { }}
            onMouseEnter={e=>{ if (activeTab !== 'lti') (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
            onMouseLeave={e=>{ if (activeTab !== 'lti') (e.currentTarget as HTMLElement).style.background=''; }}
          >
            LMS (LTI)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'iframe' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">HTML Embed Code</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Copy this code and paste it into your website, blog, or learning platform.
                </p>
              </div>

              {/* Branding Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <h4 className="font-medium text-white">Show "Powered by Devcapsules"</h4>
                  <p className="text-sm text-slate-400">Help us grow by showing our branding (free plan requirement)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showPoweredBy}
                    onChange={(e) => setShowPoweredBy(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ background: showPoweredBy ? '#00ff87' : 'rgba(255,255,255,0.1)' }}></div>
                </label>
              </div>

              {/* Code Block */}
              <div className="relative">
                <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <pre className="text-sm text-green-400 overflow-x-auto">
                    <code>{iframeCode}</code>
                  </pre>
                </div>
                <div className="absolute top-3 right-3">
                  <CopyButton text={iframeCode} copyKey="iframe" label="Copy Code" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Direct Link</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Share this URL directly or use it in emails, social media, etc.
                </p>
              </div>

              {/* URL */}
              <div className="relative">
                <div className="rounded-lg p-4 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <code className="text-sm flex-1 pr-4" style={{ color: '#00ff87' }}>{capsuleEmbedUrl}</code>
                  <CopyButton text={capsuleEmbedUrl} copyKey="link" label="Copy Link" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lti' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">LMS Integration (LTI)</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Integration with Canvas, Moodle, Blackboard, and other Learning Management Systems.
                </p>
              </div>

              {/* Coming Soon Message */}
              <div className="rounded-lg p-8 text-center" style={{ background: 'rgba(0,255,135,0.03)', border: '1px solid rgba(0,255,135,0.15)' }}>
                <h4 className="font-medium text-lg mb-2" style={{ color: '#00ff87' }}>In Development</h4>
                <p className="text-slate-400 text-sm mb-4">
                  LTI integration is currently in development. We're building seamless integration 
                  with popular Learning Management Systems.
                </p>
                <p className="text-slate-300 text-sm">
                  In the meantime, you can use the <strong>Direct Link</strong> or <strong>HTML Embed</strong> 
                  options to share your capsules.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Your capsule is ready to share. Track engagement in Analytics.
            </div>
            <button 
              onClick={onClose}
              className="text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.1)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}