import React, { useState } from 'react';
import { XMarkIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

interface PublishEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsuleId: string;
  capsuleTitle: string;
}

export default function PublishEmbedModal({ isOpen, onClose, capsuleId, capsuleTitle }: PublishEmbedModalProps) {
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Direct Link */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Direct Link</label>
            <div className="mt-2 rounded-lg p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <code className="text-sm flex-1 truncate" style={{ color: '#00ff87' }}>{capsuleEmbedUrl}</code>
              <CopyButton text={capsuleEmbedUrl} copyKey="link" label="Copy" />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Share via email, social media, or messaging apps.</p>
          </div>

          {/* Branding Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <h4 className="font-medium text-white text-sm">Show "Powered by Devcapsules"</h4>
              <p className="text-xs text-slate-500 mt-0.5">Free plan requirement</p>
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

          {/* Embed Code */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">HTML Embed Code</label>
            <div className="relative mt-2">
              <div className="rounded-lg p-4 pr-28" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <pre className="text-sm text-green-400 overflow-x-auto">
                  <code>{iframeCode}</code>
                </pre>
              </div>
              <div className="absolute top-3 right-3">
                <CopyButton text={iframeCode} copyKey="iframe" label="Copy" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Paste into your website, blog, or documentation.</p>
          </div>
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