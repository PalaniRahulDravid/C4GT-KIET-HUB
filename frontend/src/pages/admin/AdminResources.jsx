import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import ResourceUploadModal from '../../components/ResourceUploadModal';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Code2,
  GitBranch,
  ExternalLink,
  Download,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  CheckSquare,
} from 'lucide-react';
import { Skeleton, SkeletonResourceCard } from '../../components/skeleton';

export default function AdminResources() {
  const { token, apiBaseUrl, loading: authLoading } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchResources = async () => {
    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/resources`, {
        credentials: 'include',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.resources)) {
          setResources(data.resources);
        }
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchResources();
    }
  }, [token, authLoading]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchResources();
    showToast('Resources refreshed');
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will also remove any hosted file from Cloudinary.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/resources/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Resource deleted successfully');
        setResources((prev) => prev.filter((r) => r._id !== id));
      } else {
        showToast(data.message || 'Failed to delete resource', 'error');
      }
    } catch (err) {
      console.error('Delete resource error:', err);
      showToast('Error deleting resource', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Extract unique topics for filter dropdown
  const uniqueTopics = useMemo(() => {
    const set = new Set();
    resources.forEach((r) => {
      if (r.topic) set.add(r.topic);
    });
    return Array.from(set).sort();
  }, [resources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topic?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesTopic = selectedTopic === 'all' || item.topic === selectedTopic;

      return matchesSearch && matchesType && matchesTopic;
    });
  }, [resources, searchQuery, selectedType, selectedTopic]);

  // Statistics
  const stats = useMemo(() => {
    const total = resources.length;
    const files = resources.filter((r) => ['pdf', 'doc', 'excel', 'image'].includes(r.type)).length;
    const links = resources.filter((r) => ['git_repo', 'dsa_problem', 'link'].includes(r.type)).length;
    const totalDownloads = resources.reduce((acc, r) => acc + (r.downloadsCount || 0), 0);
    const totalCompletions = resources.reduce((acc, r) => acc + (r.completedBy?.length || 0), 0);
    return { total, files, links, totalDownloads, totalCompletions };
  }, [resources]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case 'dsa_problem':
        return <Code2 className="w-5 h-5 text-amber-600" />;
      case 'git_repo':
        return <GitBranch className="w-5 h-5 text-slate-800" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'doc':
        return 'Document';
      case 'excel':
        return 'Spreadsheet';
      case 'pdf':
        return 'PDF';
      case 'image':
        return 'Photo / Image';
      case 'dsa_problem':
        return 'DSA Problem';
      case 'git_repo':
        return 'Git Repo';
      default:
        return 'External Link';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full space-y-8 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-[#1C1B1A] text-white border-black/20'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <UploadCloud className="w-3.5 h-3.5" />
            Cloudinary Storage & Links Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1B1A]">
            Learning & Practice Resources
          </h1>
          <p className="text-sm text-[#57564F] mt-1">
            Store documents, spreadsheets, PDFs, diagrams on Cloudinary, along with DSA problem links and GitHub repositories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 rounded-xl border border-[#E2DDD0] bg-white text-[#1C1B1A] text-sm font-medium hover:bg-[#F2EFE9] transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1C1B1A] text-white text-sm font-medium hover:bg-black transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Resource</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E2DDD0] shadow-xs">
          <div className="flex items-center justify-between text-[#57564F] text-xs font-medium uppercase tracking-wider">
            <span>Total Resources</span>
            <BookOpen className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#1C1B1A]">
            {loading ? <Skeleton className="w-12 h-8" /> : stats.total}
          </div>
          <div className="text-xs text-[#57564F] mt-1">Available across all tracks</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2DDD0] shadow-xs">
          <div className="flex items-center justify-between text-[#57564F] text-xs font-medium uppercase tracking-wider">
            <span>Cloudinary Media</span>
            <UploadCloud className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#1C1B1A]">
            {loading ? <Skeleton className="w-12 h-8" /> : stats.files}
          </div>
          <div className="text-xs text-sky-600 font-medium mt-1">Docs, PDFs, Excel & Images</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2DDD0] shadow-xs">
          <div className="flex items-center justify-between text-[#57564F] text-xs font-medium uppercase tracking-wider">
            <span>DSA & Git Links</span>
            <Code2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#1C1B1A]">
            {loading ? <Skeleton className="w-12 h-8" /> : stats.links}
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1">Practice sets & repositories</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2DDD0] shadow-xs">
          <div className="flex items-center justify-between text-[#57564F] text-xs font-medium uppercase tracking-wider">
            <span>Downloads & Checks</span>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#1C1B1A]">
            {loading ? (
              <Skeleton className="w-20 h-8" />
            ) : (
              <>
                {stats.totalDownloads} <span className="text-xs font-normal text-neutral-400">/ {stats.totalCompletions}</span>
              </>
            )}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Downloads / Completed marks</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2DDD0] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by title, topic, or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2DDD0] bg-[#FAF9F5] text-sm text-[#1C1B1A] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#E2DDD0] bg-[#FAF9F5] text-sm text-[#1C1B1A] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition cursor-pointer"
            >
              <option value="all">All Topics</option>
              {uniqueTopics.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'doc', label: 'Documents' },
            { id: 'pdf', label: 'PDFs' },
            { id: 'excel', label: 'Spreadsheets' },
            { id: 'image', label: 'Images' },
            { id: 'dsa_problem', label: 'DSA Questions' },
            { id: 'git_repo', label: 'Git Repos' },
            { id: 'link', label: 'External Links' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedType === type.id
                  ? 'bg-[#1C1B1A] text-white shadow-xs'
                  : 'bg-[#F2EFE9] text-[#57564F] hover:text-[#1C1B1A] hover:bg-[#EAE6DE]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonResourceCard key={idx} />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#E2DDD0] p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-semibold text-[#1C1B1A]">No resources found</h3>
          <p className="text-sm text-[#57564F] max-w-md mx-auto">
            {searchQuery || selectedType !== 'all' || selectedTopic !== 'all'
              ? 'Try changing your search keywords or active filters.'
              : 'Upload docs, PDFs, spreadsheets to Cloudinary or add Git/DSA links.'}
          </p>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C1B1A] text-white text-sm font-medium hover:bg-black transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload First Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((res) => {
            const isFile = ['pdf', 'doc', 'excel', 'image'].includes(res.type);
            const isCloudinary = Boolean(res.cloudinaryPublicId);

            return (
              <div
                key={res._id}
                className="group p-5 rounded-2xl bg-white border border-[#E2DDD0] hover:border-black/30 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#F7F5EE] border border-[#E2DDD0] flex items-center justify-center flex-shrink-0">
                        {getTypeIcon(res.type)}
                      </div>
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#F2EFE9] text-[#57564F] text-[10px] font-semibold uppercase tracking-wider">
                          {getTypeLabel(res.type)}
                        </span>
                        {res.difficulty && (
                          <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                            {res.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCloudinary && (
                        <span
                          className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-medium"
                          title="Hosted securely on Cloudinary"
                        >
                          Cloudinary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(res._id, res.title)}
                        disabled={deletingId === res._id}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer disabled:opacity-40"
                        title="Delete resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-3.5 text-base font-semibold text-[#1C1B1A] leading-snug line-clamp-2">
                    {res.title}
                  </h3>

                  {res.description && (
                    <p className="mt-1.5 text-xs text-[#57564F] line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#F2EFE9] flex items-center justify-between text-xs text-[#57564F]">
                    <span className="font-medium text-[#1C1B1A]/80 truncate max-w-[140px]">
                      {res.topic || 'General'}
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      {res.fileSize && <span>{formatFileSize(res.fileSize)}</span>}
                      {res.fileFormat && (
                        <span className="uppercase font-semibold text-neutral-500">
                          {res.fileFormat}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2DDD0] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[#57564F]">
                    <span title="Number of downloads">
                      ⬇ {res.downloadsCount || 0}
                    </span>
                    <span title="Students completed">
                      ✓ {res.completedBy?.length || 0}
                    </span>
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={isFile}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1B1A] text-white text-xs font-medium hover:bg-black transition shadow-xs"
                  >
                    {isFile ? (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Link</span>
                      </>
                    )}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resource Upload Modal */}
      <ResourceUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onResourceUploaded={() => {
          fetchResources();
          showToast('New resource added successfully!');
        }}
        apiBaseUrl={API_BASE_URL}
        token={token}
      />
    </div>
  );
}
