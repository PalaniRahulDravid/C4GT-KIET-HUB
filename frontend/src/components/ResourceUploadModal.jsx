import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Link as LinkIcon,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Code2,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function ResourceUploadModal({ isOpen, onClose, onResourceUploaded, apiBaseUrl, token }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'link'
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('Full-Stack Web Dev');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('General');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState('dsa_problem'); // 'dsa_problem' | 'git_repo' | 'link'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const topicsList = [
    'Full-Stack Web Dev',
    'Data Structures & Algorithms',
    'Machine Learning & AI',
    'Security & Cloud',
    'Database & Backend',
    'UI/UX & Design Systems',
    'General Guidelines',
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        setError('File is too large. Maximum allowed size is 30 MB.');
        return;
      }
      setSelectedFile(file);
      setError(null);
      if (!title) {
        // Auto-fill title from filename (remove extension)
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setError('Please provide a title for the resource.');
      return;
    }
    if (!topic.trim()) {
      setError('Please select or specify a topic/domain.');
      return;
    }

    setIsUploading(true);

    try {
      const baseUrl = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      if (activeTab === 'file') {
        if (!selectedFile) {
          setError('Please select a file to upload to Cloudinary.');
          setIsUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title.trim());
        formData.append('topic', topic.trim());
        formData.append('description', description.trim());
        formData.append('difficulty', difficulty);

        const res = await fetch(`${baseUrl}/resources/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'File upload failed');
        }

        setSuccessMsg('Resource file uploaded successfully to Cloudinary!');
        setTimeout(() => {
          if (onResourceUploaded) onResourceUploaded(data.resource);
          handleClose();
        }, 1200);
      } else {
        // Link submission
        if (!linkUrl.trim()) {
          setError('Please enter a valid URL.');
          setIsUploading(false);
          return;
        }

        const res = await fetch(`${baseUrl}/resources/link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            url: linkUrl.trim(),
            type: linkType,
            topic: topic.trim(),
            description: description.trim(),
            difficulty,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to save resource link');
        }

        setSuccessMsg('Resource link added successfully!');
        setTimeout(() => {
          if (onResourceUploaded) onResourceUploaded(data.resource);
          handleClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Resource upload error:', err);
      setError(err.message || 'Failed to upload resource');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setLinkUrl('');
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E0DDD0] pb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#66645E]">
              Resource Repository
            </span>
            <h3 className="text-xl font-bold text-[#1C1B1A] tracking-tight mt-0.5">
              Upload Learning Resource
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

        {/* Tab Switcher: File vs Link */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F2EFE6] rounded-xl border border-[#E0DDD0]">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white text-[#1C1B1A] shadow-xs'
                : 'text-[#66645E] hover:text-[#1C1B1A]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Cloudinary File (Doc, PDF, XL, Photo)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white text-[#1C1B1A] shadow-xs'
                : 'text-[#66645E] hover:text-[#1C1B1A]'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Git Repo / DSA / Web Link</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#1C1B1A]">
                Select File (PDF, DOCX, XLSX, Images)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D5D0C2] hover:border-[#1C1B1A] bg-[#FAF8F2] hover:bg-white rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.svg"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-xl bg-white shadow-2xs border border-[#E0DDD0] flex items-center justify-center text-[#1C1B1A] group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-[#1C1B1A] truncate max-w-sm mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-[#66645E]">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for Cloudinary
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-[#1C1B1A]">
                      Click to choose file or drag and drop
                    </p>
                    <p className="text-[11px] text-[#66645E]">
                      PDF, Word, Excel sheets, diagrams or photos (up to 30MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LINK SUBMISSION */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1B1A] mb-1.5">
                  Link Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLinkType('dsa_problem')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      linkType === 'dsa_problem'
                        ? 'bg-[#1C1B1A] text-white border-[#1C1B1A]'
                        : 'bg-white border-[#E0DDD0] text-[#66645E] hover:text-[#1C1B1A]'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>DSA Problem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLinkType('git_repo')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      linkType === 'git_repo'
                        ? 'bg-[#1C1B1A] text-white border-[#1C1B1A]'
                        : 'bg-white border-[#E0DDD0] text-[#66645E] hover:text-[#1C1B1A]'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Git Repo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLinkType('link')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      linkType === 'link'
                        ? 'bg-[#1C1B1A] text-white border-[#1C1B1A]'
                        : 'bg-white border-[#E0DDD0] text-[#66645E] hover:text-[#1C1B1A]'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Web / Doc</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                  Destination URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder={
                    linkType === 'dsa_problem'
                      ? 'https://leetcode.com/problems/...'
                      : linkType === 'git_repo'
                      ? 'https://github.com/org/repo'
                      : 'https://...'
                  }
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E0DDD0] text-xs focus:ring-2 focus:ring-[#1C1B1A] outline-none"
                />
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
              Resource Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dynamic Programming Subarray Notes or Two Sum LeetCode"
              required
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E0DDD0] text-xs focus:ring-2 focus:ring-[#1C1B1A] outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                Domain / Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E0DDD0] text-xs focus:ring-2 focus:ring-[#1C1B1A] outline-none"
              >
                {topicsList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E0DDD0] text-xs focus:ring-2 focus:ring-[#1C1B1A] outline-none"
              >
                <option value="General">General Reference</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
              Brief Instructions / Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe what students will learn or practice with this resource..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E0DDD0] text-xs focus:ring-2 focus:ring-[#1C1B1A] outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E0DDD0]">
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1C1B1A] text-white hover:bg-black transition-colors shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Save Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
