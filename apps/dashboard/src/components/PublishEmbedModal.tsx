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
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Publish & Embed</h2>
            <p className="text-slate-400 text-sm mt-1">{capsuleTitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 flex-shrink-0">
          <button
            onClick={() => setActiveTab('iframe')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'iframe' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            📄 &lt;iframe&gt; Embed
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'link' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            🔗 Direct Link
          </button>
          <button
            onClick={() => setActiveTab('lti')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'lti' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            🎓 LMS (LTI)
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
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
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
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Code Block */}
              <div className="relative">
                <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
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
                <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 flex items-center justify-between">
                  <code className="text-blue-400 text-sm flex-1 pr-4">{capsuleEmbedUrl}</code>
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
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">🚧</div>
                <h4 className="text-blue-400 font-medium text-lg mb-2">We are working on it</h4>
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
        <div className="border-t border-slate-700 px-6 py-4 bg-slate-700/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              🚀 Your capsule is ready to share! Track engagement in Analytics.
            </div>
            <button 
              onClick={onClose}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}