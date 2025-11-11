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
  title="${capsuleTitle} - CodeCapsule">
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
                  <h4 className="font-medium text-white">Show "Powered by CodeCapsule"</h4>
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

              {/* Preview */}
              <div>
                <h4 className="font-medium text-white mb-3">Preview:</h4>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <div className="bg-white rounded-md p-4 text-center text-slate-800">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-300 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-4 bg-slate-300 rounded w-1/2 mx-auto mb-4"></div>
                      <div className="h-20 bg-slate-200 rounded"></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Interactive coding exercise will load here
                    </div>
                    {showPoweredBy && (
                      <div className="text-xs text-blue-600 mt-2 font-medium">
                        Powered by CodeCapsule
                      </div>
                    )}
                  </div>
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

              {/* QR Code (Placeholder) */}
              <div className="bg-slate-700/30 rounded-lg p-6 text-center border border-slate-600/50">
                <h4 className="font-medium text-white mb-4">QR Code</h4>
                <div className="w-32 h-32 bg-white rounded-lg mx-auto flex items-center justify-center">
                  <div className="w-24 h-24 bg-slate-900 rounded grid grid-cols-8 gap-1 p-2">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-full h-full ${Math.random() > 0.5 ? 'bg-white' : 'bg-slate-900'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-4">
                  Students can scan this QR code to access the exercise
                </p>
              </div>

              {/* Social Sharing */}
              <div>
                <h4 className="font-medium text-white mb-3">Share on Social Media</h4>
                <div className="flex space-x-3">
                  <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    <span>📘</span>
                    <span>Facebook</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    <span>🐦</span>
                    <span>Twitter</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    <span>💼</span>
                    <span>LinkedIn</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lti' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">LMS Integration (LTI)</h3>
                <p className="text-slate-400 text-sm mb-4">
                  For Canvas, Moodle, Blackboard, and other LTI-compatible Learning Management Systems.
                </p>
              </div>

              {/* LTI Configuration */}
              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
                <h4 className="text-yellow-400 font-medium mb-2">📋 Setup Instructions</h4>
                <ol className="text-sm text-slate-300 space-y-2">
                  <li>1. In your LMS, go to "External Tools" or "LTI Configuration"</li>
                  <li>2. Create a new external tool</li>
                  <li>3. Use the configuration XML below or enter details manually:</li>
                  <li>4. Launch URL: <code className="text-blue-400">{capsuleEmbedUrl}</code></li>
                  <li>5. Consumer Key: <code className="text-blue-400">codecapsule</code></li>
                  <li>6. Shared Secret: <code className="text-blue-400">[Contact support for key]</code></li>
                </ol>
              </div>

              {/* XML Configuration */}
              <div>
                <h4 className="font-medium text-white mb-3">LTI Configuration XML</h4>
                <div className="relative">
                  <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <pre className="text-sm text-green-400">
                      <code>{ltiConfig}</code>
                    </pre>
                  </div>
                  <div className="absolute top-3 right-3">
                    <CopyButton text={ltiConfig} copyKey="lti" label="Copy XML" />
                  </div>
                </div>
              </div>

              {/* LMS Specific Guides */}
              <div>
                <h4 className="font-medium text-white mb-3">Platform-Specific Guides</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button className="text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 transition-colors">
                    <div className="font-medium text-white text-sm">Canvas Integration</div>
                    <div className="text-xs text-slate-400">Step-by-step guide →</div>
                  </button>
                  <button className="text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 transition-colors">
                    <div className="font-medium text-white text-sm">Moodle Setup</div>
                    <div className="text-xs text-slate-400">Installation guide →</div>
                  </button>
                  <button className="text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 transition-colors">
                    <div className="font-medium text-white text-sm">Blackboard Learn</div>
                    <div className="text-xs text-slate-400">Configuration help →</div>
                  </button>
                  <button className="text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 transition-colors">
                    <div className="font-medium text-white text-sm">Google Classroom</div>
                    <div className="text-xs text-slate-400">Add as assignment →</div>
                  </button>
                </div>
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