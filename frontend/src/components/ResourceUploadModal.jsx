import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  UploadCloud,
  Link as LinkIcon,
  Video,
  FileText,
  Code2,
  GitBranch,
  Globe,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  GraduationCap,
  Briefcase,
  FolderPlus,
  Send,
} from 'lucide-react';

export default function ResourceUploadModal({
  isOpen,
  onClose,
  onResourceUploaded,
  apiBaseUrl,
  token: propToken,
}) {
  const { token: authContextToken } = useAuth();
  const token = propToken || authContextToken || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);

  const [destination, setDestination] = useState('library'); // 'library' (saved in repository for tasks) | 'published' (pushed to student feed)
  const [resourceType, setResourceType] = useState('youtube'); // 'youtube' | 'link' | 'pdf' | 'dsa_problem' | 'git_repo'
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetGroup, setTargetGroup] = useState('all'); // 'all' | 'junior_developers' | 'developer_interns'
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const typeOptions = [
    { id: 'youtube', label: 'YouTube Video', icon: Video, color: 'text-rose-600', activeBg: 'bg-rose-50 border-rose-400 text-rose-900' },
    { id: 'pdf', label: 'PDF / Document', icon: FileText, color: 'text-amber-600', activeBg: 'bg-amber-50 border-amber-400 text-amber-900' },
    { id: 'link', label: 'Web Link / Notes', icon: Globe, color: 'text-blue-600', activeBg: 'bg-blue-50 border-blue-400 text-blue-900' },
    { id: 'dsa_problem', label: 'DSA Problem', icon: Code2, color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-400 text-emerald-900' },
    { id: 'git_repo', label: 'Git Repo', icon: GitBranch, color: 'text-neutral-800', activeBg: 'bg-neutral-100 border-neutral-400 text-neutral-900' },
  ];

  const audienceOptions = [
    {
      id: 'all',
      label: 'All Students',
      sub: 'Visible to everyone (Junior Devs & Developer Interns)',
      icon: Users,
    },
    {
      id: 'junior_developers',
      label: 'Junior Developers Only',
      sub: 'Targeted specifically for the Junior Developer track',
      icon: GraduationCap,
    },
    {
      id: 'developer_interns',
      label: 'Developer Interns Only',
      sub: 'Targeted specifically for Developer Interns / Seniors',
      icon: Briefcase,
    },
  ];

  const getPlaceholder = () => {
    switch (resourceType) {
      case 'youtube':
        return 'https://www.youtube.com/watch?v=... or https://youtu.be/...';
      case 'pdf':
        return 'https://... or upload a document file below';
      case 'dsa_problem':
        return 'https://leetcode.com/problems/... or HackerRank link';
      case 'git_repo':
        return 'https://github.com/username/repository';
      default:
        return 'https://...';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 35 * 1024 * 1024) {
        setError('File exceeds 35MB maximum limit.');
        return;
      }
      setSelectedFile(file);
      setError(null);
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle) {
      setError('Please enter a resource title.');
      return;
    }

    if (resourceType === 'pdf' && selectedFile) {
      // Upload local file to Cloudinary
      setIsUploading(true);
      try {
        const baseUrl = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', trimmedTitle);
        formData.append('topic', 'General');
        formData.append('targetGroup', targetGroup);
        formData.append('visibility', destination);

        const res = await fetch(`${baseUrl}/resources/upload`, {
          method: 'POST',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'File upload failed');
        }

        setSuccessMsg(
          destination === 'library'
            ? 'Resource saved to Library! You can attach it when creating tasks.'
            : 'Resource shared with students successfully!'
        );
        setTimeout(() => {
          if (onResourceUploaded) onResourceUploaded(data.resource);
          handleClose();
        }, 800);
      } catch (err) {
        console.error('Resource upload error:', err);
        setError(err.message || 'Failed to upload resource file');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // URL submission
    if (!trimmedUrl) {
      setError(resourceType === 'pdf' ? 'Please enter a URL or select a document file to upload.' : 'Please enter the resource URL.');
      return;
    }

    // Auto-detect YouTube URL if entered under a different type
    let finalType = resourceType;
    if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
      finalType = 'link';
    } else if (resourceType === 'youtube') {
      finalType = 'link';
    }

    setIsUploading(true);
    try {
      const baseUrl = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/resources/link`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: trimmedTitle,
          url: trimmedUrl,
          type: finalType,
          topic: 'General',
          targetGroup: targetGroup,
          visibility: destination,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to share resource');
      }

      setSuccessMsg(
        destination === 'library'
          ? 'Resource saved to Library! You can attach it when creating tasks.'
          : 'Resource shared with students successfully!'
      );
      setTimeout(() => {
        if (onResourceUploaded) onResourceUploaded(data.resource);
        handleClose();
      }, 800);
    } catch (err) {
      console.error('Resource share error:', err);
      setError(err.message || 'Failed to share resource');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setUrl('');
    setSelectedFile(null);
    setTargetGroup('all');
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto custom-scroll">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E0DDD0] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#66645E]">
                Resource Sharing
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#1C1B1A] tracking-tight mt-0.5">
              Share Resource
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-[#66645E] hover:text-[#1C1B1A] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. RESOURCE TYPE */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1B1A] mb-1.5">
              Resource Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = resourceType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setResourceType(opt.id);
                      if (opt.id !== 'pdf') {
                        setSelectedFile(null);
                      }
                    }}
                    className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                      isSelected
                        ? opt.activeBg + ' shadow-2xs'
                        : 'bg-white border-[#E0DDD0] text-[#66645E] hover:text-[#1C1B1A] hover:bg-[#FAF8F2]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${opt.color}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. RESOURCE DESTINATION & PURPOSE */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1B1A] mb-1.5">
              Resource Destination & Purpose <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDestination('library')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  destination === 'library'
                    ? 'border-[#1C1B1A] bg-[#FAF8F2] shadow-2xs ring-1 ring-[#1C1B1A]/20'
                    : 'border-[#E0DDD0] bg-white hover:bg-[#FAF8F2]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${destination === 'library' ? 'bg-[#1C1B1A] text-white shadow-2xs' : 'bg-[#F2EFE6] text-[#66645E]'}`}>
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1C1B1A]">Save to Resource Library</span>
                  </div>
                  <p className="text-[11px] text-[#66645E] mt-0.5 leading-snug">
                    Save in repository to attach when creating tasks & milestones.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDestination('published')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  destination === 'published'
                    ? 'border-[#1C1B1A] bg-[#FAF8F2] shadow-2xs ring-1 ring-[#1C1B1A]/20'
                    : 'border-[#E0DDD0] bg-white hover:bg-[#FAF8F2]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${destination === 'published' ? 'bg-[#1C1B1A] text-white shadow-2xs' : 'bg-[#F2EFE6] text-[#66645E]'}`}>
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1C1B1A]">Publish to Student Feed</span>
                  </div>
                  <p className="text-[11px] text-[#66645E] mt-0.5 leading-snug">
                    Instantly visible in students' dashboard resources tab.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. SHARE WITH (AUDIENCE) - ONLY WHEN PUBLISHING DIRECTLY TO STUDENTS */}
          {destination === 'published' ? (
            <div>
              <label className="block text-xs font-semibold text-[#1C1B1A] mb-1.5">
                Share With <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col gap-2">
                {audienceOptions.map((aud) => {
                  const Icon = aud.icon;
                  const isSelected = targetGroup === aud.id;
                  return (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setTargetGroup(aud.id)}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1C1B1A] bg-[#FAF8F2] shadow-2xs ring-1 ring-[#1C1B1A]/20'
                          : 'border-[#E0DDD0] bg-white hover:bg-[#FAF8F2] hover:border-[#1C1B1A]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#1C1B1A] text-white shadow-2xs'
                              : 'bg-[#F2EFE6] text-[#66645E]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1C1B1A] leading-snug">
                            {aud.label}
                          </p>
                          <p className="text-[11px] text-[#66645E] leading-snug truncate">
                            {aud.sub}
                          </p>
                        </div>
                      </div>

                      {/* Radio indicator */}
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-all ${
                          isSelected
                            ? 'border-[#1C1B1A] bg-[#1C1B1A]'
                            : 'border-[#C8C4B7] bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#FAF8F2] border border-[#E0DDD0] rounded-xl text-xs text-[#66645E] flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[#1C1B1A] shrink-0" />
              <span>
                <strong>Saved to Library:</strong> This resource will be kept in your dashboard repository. You can attach it to any task milestone with 1 click during task creation.
              </span>
            </div>
          )}

          {/* 3. RESOURCE TITLE */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1B1A] mb-1.5">
              Resource Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React 19 Full Tutorial or LeetCode Top 50 Problems"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E0DDD0] text-sm text-[#1C1B1A] placeholder:text-[#9E9B90] focus:ring-2 focus:ring-[#1C1B1A] focus:border-transparent outline-none transition"
            />
          </div>

          {/* 4. URL OR FILE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#1C1B1A]">
                Resource URL <span className="text-rose-500">*</span>
              </label>
              {resourceType === 'pdf' && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer"
                >
                  {selectedFile ? 'Change File' : '+ Or Upload PDF/Doc File'}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  const val = e.target.value;
                  setUrl(val);
                  if (val.includes('youtube.com') || val.includes('youtu.be')) {
                    setResourceType('youtube');
                  }
                }}
                disabled={Boolean(selectedFile)}
                placeholder={getPlaceholder()}
                required={!selectedFile}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-[#E0DDD0] text-sm text-[#1C1B1A] placeholder:text-[#9E9B90] focus:ring-2 focus:ring-[#1C1B1A] focus:border-transparent outline-none transition disabled:bg-neutral-100 disabled:text-neutral-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <LinkIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Hidden file input for PDF/Document */}
            {resourceType === 'pdf' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                  className="hidden"
                />
                {selectedFile && (
                  <div className="mt-2 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-semibold truncate">{selectedFile.name}</span>
                      <span className="text-[11px] text-amber-700 shrink-0">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer font-bold ml-2"
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E0DDD0]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#66645E] hover:text-[#1C1B1A] hover:bg-black/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1C1B1A] text-white hover:bg-black transition-colors shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{destination === 'library' ? 'Saving to Library...' : 'Publishing...'}</span>
                </>
              ) : destination === 'library' ? (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>Save to Resource Library</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish to Students</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
