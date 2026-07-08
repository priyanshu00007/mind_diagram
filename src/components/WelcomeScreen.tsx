import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  SearchIcon,
  PlusIcon,
  FileTextIcon,
  ClockIcon,
  Trash2Icon,
  SparklesIcon,
  ArrowRightIcon,
  LayoutDashboardIcon,
  Code2Icon,
  FolderIcon,
  ChevronRightIcon,
  FolderPlusIcon,
  XIcon,
  HomeIcon,
  BookOpenIcon,
  UsersIcon,
  FileIcon,
  PencilIcon,
  CopyIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  MenuIcon,
  PanelLeftCloseIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Diagram } from '../types';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

type NavSection = 'home' | 'workspace' | 'templates' | 'about';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const { diagrams, folders, addDiagram, addFolder, setActiveDiagram, deleteDiagram, deleteFolder, renameFolder, seed } = useStore();
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingDiagramId, setRenamingDiagramId] = useState<string | null>(null);
  const [isDiagramSidebarOpen, setIsDiagramSidebarOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);

  useEffect(() => { seed(); }, [seed]);

  const handleCreateDiagram = (folderId?: string | null) => {
    addDiagram('Untitled Diagram', folderId ?? activeFolder);
    navigate('/editor');
  };

  const handleOpenDiagram = (id: string) => {
    setActiveDiagram(id);
    navigate('/editor');
  };

  const filtered = diagrams.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  const rootDiagrams = filtered.filter((d) => !d.folderId);
  const folderDiagrams = activeFolder ? filtered.filter((d) => d.folderId === activeFolder) : [];
  const activeFolderObj = folders.find((f) => f.id === activeFolder);
  const sorted = [...(activeFolder ? folderDiagrams : rootDiagrams)].sort((a, b) => b.updatedAt - a.updatedAt);

  const filteredDiagrams = diagrams.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedFolders(next);
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: typeof folders[0]) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Open', icon: FolderIcon, onClick: () => setActiveFolder(folder.id) },
        { label: 'New Diagram', icon: FileIcon, onClick: () => handleCreateDiagram(folder.id) },
        { divider: true, label: '', icon: FolderIcon, onClick: () => {} },
        { label: 'Rename', icon: PencilIcon, onClick: () => setRenamingFolderId(folder.id) },
        { label: 'Copy Name', icon: CopyIcon, onClick: () => navigator.clipboard.writeText(folder.name) },
        { divider: true, label: '', icon: FolderIcon, onClick: () => {} },
        { label: 'Delete', icon: Trash2Icon, onClick: () => { if (confirm(`Delete "${folder.name}"?`)) deleteFolder(folder.id); }, danger: true },
      ],
    });
  };

  const handleDiagramContextMenu = (e: React.MouseEvent, diagram: Diagram) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Open', icon: ExternalLinkIcon, onClick: () => handleOpenDiagram(diagram.id) },
        { label: 'Rename', icon: PencilIcon, onClick: () => setRenamingDiagramId(diagram.id) },
        { label: 'Copy Name', icon: CopyIcon, onClick: () => navigator.clipboard.writeText(diagram.name) },
        { divider: true, label: '', icon: FileIcon, onClick: () => {} },
        { label: 'Delete', icon: Trash2Icon, onClick: () => { if (confirm(`Delete "${diagram.name}"?`)) deleteDiagram(diagram.id); }, danger: true },
      ],
    });
  };

  const navItems: { id: NavSection; label: string; icon: typeof HomeIcon }[] = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'workspace', label: 'Workspace', icon: LayoutDashboardIcon },
    { id: 'templates', label: 'Templates', icon: BookOpenIcon },
    { id: 'about', label: 'About', icon: UsersIcon },
  ];

  const switchNav = (nav: NavSection) => {
    setActiveNav(nav);
    setActiveFolder(null);
    setIsNavSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-white">
      {/* Mobile Nav Sidebar */}
      <AnimatePresence>
        {isNavSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsNavSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden"
            >
              <div className="h-full bg-brand-sidebar border-r border-brand-border flex flex-col overflow-hidden">
                {/* Logo + Close */}
                <div className="p-4 border-b border-brand-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-xs shadow-lg shadow-brand-accent/20">AS</div>
                    <span className="text-sm font-bold tracking-tight flex-1">Studio</span>
                    <button onClick={() => setIsNavSidebarOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                      <PanelLeftCloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Nav Items */}
                <div className="p-3 space-y-0.5">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => switchNav(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                        activeNav === item.id && !activeFolder ? 'bg-brand-accent/20 text-brand-accent font-semibold' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="px-3 pt-2 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-3 mb-2">Actions</p>
                  <button onClick={() => { handleCreateDiagram(); setIsNavSidebarOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
                    <PlusIcon className="w-4 h-4" />
                    New Diagram
                  </button>
                  <button onClick={() => { setShowNewFolderInput(true); setIsNavSidebarOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
                    <FolderPlusIcon className="w-4 h-4" />
                    New Folder
                  </button>
                </div>

                {/* Recent Diagrams */}
                <div className="flex-1 overflow-y-auto p-3 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-3 mb-2">Recent</p>
                  <div className="space-y-0.5">
                    {diagrams.slice(0, 8).map((diagram) => (
                      <button
                        key={diagram.id}
                        onClick={() => handleOpenDiagram(diagram.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/80 hover:bg-white/5 transition-all truncate"
                      >
                        <FileIcon className="w-3 h-3 shrink-0 opacity-50" />
                        <span className="truncate">{diagram.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-2 border-t border-brand-border text-[10px] text-white/20">
                  {diagrams.length} diagrams saved locally
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Diagram Sidebar */}
      <AnimatePresence mode="wait">
        {isDiagramSidebarOpen && (
          <motion.div
            key="diagram-sidebar"
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            className="fixed left-0 top-0 bottom-0 z-40 lg:relative lg:z-auto hidden lg:block"
          >
            <div className="relative z-10 h-full">
              <div className="w-64 bg-brand-sidebar border-r border-brand-border h-full flex flex-col overflow-hidden">
                {/* Logo */}
                <div className="p-4 border-b border-brand-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-xs shadow-lg shadow-brand-accent/20">AS</div>
                    <span className="text-sm font-bold tracking-tight flex-1">Studio</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleCreateDiagram()} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/30 rounded-lg text-[11px] font-bold transition-all">
                      <PlusIcon className="w-3.5 h-3.5" />New
                    </button>
                    <button onClick={() => setShowNewFolderInput(true)} className="flex items-center justify-center p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors border border-white/10" title="New Folder">
                      <FolderIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Nav Items (desktop sidebar) */}
                <div className="px-3 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-2 mb-2">Navigation</p>
                  <div className="space-y-0.5">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveNav(item.id); setActiveFolder(null); }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                          activeNav === item.id && !activeFolder ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="px-3 pt-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text-dim" />
                    <input
                      type="text"
                      placeholder="Search diagrams..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-8 py-1.5 text-[11px] focus:outline-none focus:border-brand-accent/50 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Diagrams Tree */}
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Diagrams</span>
                      <span className="text-[10px] text-white/20 font-mono">{diagrams.length}</span>
                    </div>

                    {folders.map((folder) => (
                      <div key={folder.id} className="space-y-1">
                        <div
                          className="flex items-center gap-1 px-2 py-1.5 hover:bg-white/5 rounded-lg group cursor-pointer"
                          onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                        >
                          <button onClick={() => toggleFolder(folder.id)} className="flex items-center gap-2 flex-1 text-left text-xs text-brand-text-dim">
                            {expandedFolders.has(folder.id) ? <ChevronDownIcon className="w-3.5 h-3.5 shrink-0" /> : <ChevronRightIcon className="w-3.5 h-3.5 shrink-0" />}
                            <FolderIcon className="w-3.5 h-3.5 text-white/20 shrink-0" />
                            {renamingFolderId === folder.id ? (
                              <input autoFocus className="bg-brand-bg border border-brand-accent/50 rounded px-1 w-full text-white outline-none text-xs" defaultValue={folder.name}
                                onBlur={(e) => { renameFolder(folder.id, e.target.value); setRenamingFolderId(null); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { renameFolder(folder.id, e.currentTarget.value); setRenamingFolderId(null); } if (e.key === 'Escape') setRenamingFolderId(null); }}
                              />
                            ) : (
                              <span className="flex-1 truncate">{folder.name}</span>
                            )}
                          </button>
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => { handleCreateDiagram(folder.id); if (!expandedFolders.has(folder.id)) toggleFolder(folder.id); }} className="p-1 hover:text-brand-accent text-white/30" title="Add Diagram">
                              <FileIcon className="w-3 h-3" />
                            </button>
                            <button onClick={() => setRenamingFolderId(folder.id)} className="p-1 hover:text-white text-white/30" title="Rename">
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button onClick={() => { if (confirm(`Delete "${folder.name}"?`)) deleteFolder(folder.id); }} className="p-1 hover:text-rose-400 text-white/30" title="Delete">
                              <Trash2Icon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedFolders.has(folder.id) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-3 pl-3 border-l border-white/5 space-y-0.5 overflow-hidden">
                              {filteredDiagrams.filter((d) => d.folderId === folder.id).map((diagram) => (
                                <div key={diagram.id} className="flex items-center group px-2 py-1 hover:bg-white/5 rounded-lg transition-colors" onContextMenu={(e) => handleDiagramContextMenu(e, diagram)}>
                                  <button onClick={() => handleOpenDiagram(diagram.id)} className={`flex-1 flex items-center gap-2 text-left text-xs ${activeNav === 'workspace' ? 'text-brand-accent font-medium' : 'text-white/40 hover:text-white'}`}>
                                    <FileIcon className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                    {renamingDiagramId === diagram.id ? (
                                      <input autoFocus className="bg-brand-bg border border-brand-accent/50 rounded px-1 w-full text-white outline-none text-xs" defaultValue={diagram.name}
                                        onBlur={(e) => { useStore.getState().updateDiagram(diagram.id, { name: e.target.value }); setRenamingDiagramId(null); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { useStore.getState().updateDiagram(diagram.id, { name: e.currentTarget.value }); setRenamingDiagramId(null); } if (e.key === 'Escape') setRenamingDiagramId(null); }}
                                        onClick={(ev) => ev.stopPropagation()}
                                      />
                                    ) : (
                                      <span className="flex-1 truncate">{diagram.name}</span>
                                    )}
                                  </button>
                                  <div className="flex items-center gap-0.5">
                                    <button onClick={() => setRenamingDiagramId(diagram.id)} className="p-1 hover:text-white text-white/30" title="Rename"><PencilIcon className="w-3 h-3" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteDiagram(diagram.id); }} className="p-1 hover:text-rose-400 text-white/30" title="Delete"><Trash2Icon className="w-3 h-3" /></button>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {filteredDiagrams.filter((d) => !d.folderId).map((diagram) => (
                      <div key={diagram.id} className="flex items-center group px-2 py-1 hover:bg-white/5 rounded-lg transition-colors" onContextMenu={(e) => handleDiagramContextMenu(e, diagram)}>
                        <button onClick={() => handleOpenDiagram(diagram.id)} className="flex-1 flex items-center gap-2 text-left text-xs text-white/40 hover:text-white">
                          <FileIcon className="w-3.5 h-3.5 opacity-60 shrink-0" />
                          {renamingDiagramId === diagram.id ? (
                            <input autoFocus className="bg-brand-bg border border-brand-accent/50 rounded px-1 w-full text-white outline-none text-xs" defaultValue={diagram.name}
                              onBlur={(e) => { useStore.getState().updateDiagram(diagram.id, { name: e.target.value }); setRenamingDiagramId(null); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { useStore.getState().updateDiagram(diagram.id, { name: e.currentTarget.value }); setRenamingDiagramId(null); } if (e.key === 'Escape') setRenamingDiagramId(null); }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="flex-1 truncate">{diagram.name}</span>
                          )}
                        </button>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => setRenamingDiagramId(diagram.id)} className="p-1 hover:text-white text-white/30" title="Rename"><PencilIcon className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteDiagram(diagram.id); }} className="p-1 hover:text-rose-400 text-white/30" title="Delete"><Trash2Icon className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-2 border-t border-brand-border text-[10px] text-white/20">
                  {diagrams.length} {diagrams.length === 1 ? 'diagram' : 'diagrams'} saved locally
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Toolbar */}
        <div className="h-12 sm:h-14 border-b border-white/10 bg-brand-bg/80 backdrop-blur-md flex items-center px-2 sm:px-4 lg:px-6 gap-2 relative z-10 shrink-0">
          {/* Mobile: hamburger for nav sidebar */}
          <button
            onClick={() => setIsNavSidebarOpen(true)}
            className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/5 text-white/40 lg:hidden"
            title="Menu"
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          {/* Desktop: toggle diagram sidebar */}
          <button
            onClick={() => setIsDiagramSidebarOpen(!isDiagramSidebarOpen)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors shrink-0 hidden lg:block ${isDiagramSidebarOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/40'}`}
            title={isDiagramSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            <PanelLeftCloseIcon className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/10 hidden lg:block" />

          {/* Breadcrumb / Page Title */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs sm:text-sm font-semibold tracking-tight text-white truncate">
              {activeNav === 'home' && 'Home'}
              {activeNav === 'workspace' && (activeFolder ? activeFolderObj?.name || 'Workspace' : 'Workspace')}
              {activeNav === 'templates' && 'Templates'}
              {activeNav === 'about' && 'About'}
            </span>
            {activeFolder && (
              <button onClick={() => setActiveFolder(null)} className="text-[10px] text-white/30 hover:text-white/60 transition-colors hidden sm:inline">
                / All
              </button>
            )}
          </div>

          <div className="flex-1" />

          {/* Editor Button */}
          <button onClick={() => navigate('/editor')} className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-lg sm:rounded-xl text-xs font-semibold transition-all">
            <Code2Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Editor</span>
            <span className="sm:hidden">Editor</span>
          </button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {/* HOME */}
          {activeNav === 'home' && !activeFolder && (
            <>
              <div className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/5 via-transparent to-transparent" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-accent/10 blur-[120px] rounded-full" />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/60 mb-6">
                      <SparklesIcon className="w-3 h-3 text-brand-accent" />AI-Powered Diagram Editor
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
                      Build diagrams<br /><span className="text-brand-accent">with ease</span>
                    </h1>
                    <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
                      Create, edit, and share beautiful diagrams powered by Mermaid syntax and AI assistance.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button onClick={() => handleCreateDiagram()} className="flex items-center gap-2 px-6 py-3 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-accent/20 active:scale-95">
                        <PlusIcon className="w-4 h-4" />Start Creating<ArrowRightIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => switchNav('workspace')} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-xl font-semibold text-sm transition-all">
                        View Workspace
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: Code2Icon, title: 'Mermaid Code', desc: 'Write diagrams in familiar Mermaid syntax with live preview' },
                      { icon: SparklesIcon, title: 'AI Generation', desc: 'Describe your architecture and let AI generate the diagram' },
                      { icon: LayoutDashboardIcon, title: 'Export Anywhere', desc: 'Export as PNG, SVG, or PDF with one click' },
                    ].map((f, i) => (
                      <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center shrink-0"><f.icon className="w-4 h-4 text-brand-accent" /></div>
                        <div><p className="text-xs font-semibold mb-0.5">{f.title}</p><p className="text-[11px] text-white/40 leading-relaxed">{f.desc}</p></div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: 'Total Diagrams', value: diagrams.length },
                    { label: 'Folders', value: folders.length },
                    { label: 'This Week', value: diagrams.filter((d) => Date.now() - d.createdAt < 7 * 86400000).length },
                    { label: 'Saved Locally', value: diagrams.length },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                      <p className="text-xl sm:text-2xl font-bold text-brand-accent">{s.value}</p>
                      <p className="text-[10px] sm:text-[11px] text-white/40 mt-1">{s.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* WORKSPACE */}
          {(activeNav === 'workspace' || activeFolder) && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  {activeFolder ? (
                    <button onClick={() => setActiveFolder(null)} className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-medium transition-colors">
                      <span>All</span><ChevronRightIcon className="w-3 h-3" /><span className="text-white">{activeFolderObj?.name}</span>
                    </button>
                  ) : (
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">Workspace</h2>
                  )}
                </div>
                <div className="relative w-48 sm:w-64">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white/[0.04] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/50 transition-all" />
                </div>
              </div>

              <AnimatePresence>
                {showNewFolderInput && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                    <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                      <FolderIcon className="w-4 h-4 text-brand-accent shrink-0" />
                      <input autoFocus placeholder="Folder name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewFolderInput(false); setNewFolderName(''); } }}
                        className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none" />
                      <button onClick={handleCreateFolder} className="px-3 py-1 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-[11px] font-semibold transition-all">Create</button>
                      <button onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }} className="p-1 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-colors"><XIcon className="w-3.5 h-3.5" /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!activeFolder && folders.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">Folders</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                    {folders.map((folder) => {
                      const count = diagrams.filter((d) => d.folderId === folder.id).length;
                      return (
                        <motion.div key={folder.id} layout whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className="group relative p-3 sm:p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 cursor-pointer transition-all"
                          onClick={() => setActiveFolder(folder.id)} onContextMenu={(e) => handleFolderContextMenu(e, folder)}>
                          <div className="flex items-center justify-between mb-2">
                            <FolderIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400/60" />
                            <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-rose-400 transition-all"><Trash2Icon className="w-3 h-3" /></button>
                          </div>
                          {renamingFolderId === folder.id ? (
                            <input autoFocus defaultValue={folder.name} onBlur={(e) => { renameFolder(folder.id, e.target.value); setRenamingFolderId(null); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { renameFolder(folder.id, e.currentTarget.value); setRenamingFolderId(null); } if (e.key === 'Escape') setRenamingFolderId(null); }}
                              onClick={(e) => e.stopPropagation()} className="bg-brand-bg border border-brand-accent/50 rounded px-1 w-full text-xs text-white outline-none" />
                          ) : (
                            <p className="text-xs font-medium text-white/70 truncate">{folder.name}</p>
                          )}
                          <p className="text-[10px] text-white/30 mt-0.5">{count} {count === 1 ? 'file' : 'files'}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">{activeFolder ? activeFolderObj?.name : 'All Diagrams'}</p>
                {sorted.length === 0 && !search ? (
                  <div className="flex flex-col items-center justify-center text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4"><FileTextIcon className="w-7 h-7 text-white/20" /></div>
                    <h3 className="text-sm font-semibold mb-1">No diagrams here</h3>
                    <p className="text-white/40 text-xs mb-5">Create your first diagram to get started</p>
                    <button onClick={() => handleCreateDiagram()} className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-accent/20 text-xs">
                      <PlusIcon className="w-3.5 h-3.5" />New Diagram
                    </button>
                  </div>
                ) : sorted.length === 0 && search ? (
                  <div className="flex flex-col items-center justify-center text-center py-16"><p className="text-white/40 text-sm">No diagrams match "{search}"</p></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    <motion.button onClick={() => handleCreateDiagram()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-accent/50 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-brand-accent transition-all bg-white/[0.02] hover:bg-white/[0.04]">
                      <PlusIcon className="w-8 h-8" /><span className="text-xs font-medium">New Diagram</span>
                    </motion.button>
                    {sorted.map((diagram) => (
                      <DiagramCard key={diagram.id} diagram={diagram} onOpen={() => handleOpenDiagram(diagram.id)} onDelete={() => deleteDiagram(diagram.id)}
                        onContextMenu={(e) => handleDiagramContextMenu(e, diagram)} renaming={renamingDiagramId === diagram.id}
                        onRenameSubmit={(name) => { useStore.getState().updateDiagram(diagram.id, { name }); setRenamingDiagramId(null); }} onRenameCancel={() => setRenamingDiagramId(null)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TEMPLATES */}
          {activeNav === 'templates' && !activeFolder && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-2">Templates</h2>
              <p className="text-white/40 text-xs sm:text-sm mb-8">Start with a pre-built diagram template</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Flowchart', desc: 'Basic flowchart with decision nodes', code: 'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[OK]\n  B -->|No| D[Cancel]' },
                  { name: 'Sequence Diagram', desc: 'Show interactions between actors', code: 'sequenceDiagram\n  Alice->>Bob: Hello\n  Bob-->>Alice: Hi' },
                  { name: 'Class Diagram', desc: 'Object-oriented class structure', code: 'classDiagram\n  Animal <|-- Dog\n  Animal <|-- Cat\n  Animal : +String name\n  Dog : +bark()' },
                  { name: 'Architecture', desc: 'Microservice architecture overview', code: 'graph LR\n  Client --> API Gateway\n  API Gateway --> Auth\n  API Gateway --> Users' },
                  { name: 'Mind Map', desc: 'Brainstorm and organize ideas', code: 'mindmap\n  root((Central Idea))\n    Branch A\n      Leaf 1\n    Branch B\n      Leaf 2' },
                  { name: 'Git Graph', desc: 'Visualize branch workflows', code: 'gitGraph\n  commit\n  commit\n  branch develop\n  checkout develop\n  commit' },
                ].map((t, i) => (
                  <motion.button key={t.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    onClick={() => { const id = addDiagram(t.name); useStore.getState().updateDiagram(id, { mermaidCode: t.code }); navigate('/editor'); }}
                    className="text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><LayoutDashboardIcon className="w-5 h-5 text-brand-accent" /></div>
                    <p className="text-xs font-semibold mb-1">{t.name}</p>
                    <p className="text-[11px] text-white/40 leading-relaxed">{t.desc}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* ABOUT */}
          {activeNav === 'about' && !activeFolder && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-2">About Studio</h2>
              <p className="text-white/40 text-xs sm:text-sm mb-8">A lightweight diagram editor built for developers</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                {[{ label: 'Version', value: '1.0.0' }, { label: 'Built With', value: 'React + Mermaid' }, { label: 'Storage', value: 'Local Browser' }, { label: 'Auth', value: 'None (Offline First)' }].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-white/40">{item.label}</span>
                    <span className="text-xs font-medium text-white/70">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />}
    </div>
  );
}

function DiagramCard({ diagram, onOpen, onDelete, onContextMenu, renaming, onRenameSubmit, onRenameCancel }: {
  diagram: Diagram; onOpen: () => void; onDelete: () => void; onContextMenu: (e: React.MouseEvent) => void;
  renaming: boolean; onRenameSubmit: (name: string) => void; onRenameCancel: () => void;
}) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="group aspect-[4/3] rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all flex flex-col overflow-hidden cursor-pointer relative"
      onClick={onOpen} onContextMenu={onContextMenu}>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
          <LayoutDashboardIcon className="w-6 h-6 text-white/15 group-hover:text-white/25 transition-colors" />
        </div>
      </div>
      <div className="px-3 pb-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input autoFocus defaultValue={diagram.name} onBlur={(e) => onRenameSubmit(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onRenameSubmit(e.currentTarget.value); if (e.key === 'Escape') onRenameCancel(); }}
              onClick={(e) => e.stopPropagation()} className="bg-brand-bg border border-brand-accent/50 rounded px-1 w-full text-xs text-white outline-none" />
          ) : (
            <p className="text-xs font-medium text-white/80 truncate">{diagram.name}</p>
          )}
          <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
            <ClockIcon className="w-3 h-3" />{new Date(diagram.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-rose-400 transition-all">
          <Trash2Icon className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
