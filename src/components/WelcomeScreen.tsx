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
  XIcon,
  HomeIcon,
  BookOpenIcon,
  UsersIcon,
  FileIcon,
  PencilIcon,
  ExternalLinkIcon,
  MenuIcon,
  FolderPlusIcon,
  MoreVerticalIcon,
  GridIcon,
  ListIcon,
  CalendarIcon,
  ArrowUpDownIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Diagram } from '../types';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

type NavSection = 'home' | 'workspace' | 'templates' | 'about';
type SortOption = 'updated' | 'created' | 'alphabetical';
type TemplateCategory = 'all' | 'flow' | 'uml' | 'architecture' | 'ideas';
type ViewMode = 'grid' | 'list';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const {
    diagrams,
    folders,
    addDiagram,
    addFolder,
    setActiveDiagram,
    deleteDiagram,
    deleteFolder,
    renameFolder,
    moveDiagramToFolder,
    seed,
  } = useStore();

  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingDiagramId, setRenamingDiagramId] = useState<string | null>(null);
  
  // Layout & UI States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Drag and Drop States
  const [draggedDiagramId, setDraggedDiagramId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isDraggingOverRootZone, setIsDraggingOverRootZone] = useState(false);

  useEffect(() => {
    seed();
  }, [seed]);

  const handleCreateDiagram = (folderId?: string | null) => {
    const newId = addDiagram('Untitled Diagram', folderId ?? activeFolder);
    setActiveDiagram(newId);
    navigate('/editor');
  };

  const handleOpenDiagram = (id: string) => {
    setActiveDiagram(id);
    navigate('/editor');
  };

  const handleDragStart = (e: React.DragEvent, diagramId: string) => {
    e.dataTransfer.setData('text/plain', diagramId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedDiagramId(diagramId);
  };

  const handleDragEnd = () => {
    setDraggedDiagramId(null);
    setDragOverFolderId(null);
    setIsDraggingOverRootZone(false);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleFolderDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const diagramId = e.dataTransfer.getData('text/plain');
    if (diagramId) {
      moveDiagramToFolder(diagramId, folderId);
    }
    setDraggedDiagramId(null);
    setDragOverFolderId(null);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const diagramId = e.dataTransfer.getData('text/plain');
    if (diagramId) {
      moveDiagramToFolder(diagramId, null);
    }
    setDraggedDiagramId(null);
    setDragOverFolderId(null);
    setIsDraggingOverRootZone(false);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  // Filter & Sort Logic
  const filteredDiagrams = diagrams.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const currentDiagrams = activeFolder
    ? filteredDiagrams.filter((d) => d.folderId === activeFolder)
    : filteredDiagrams.filter((d) => !d.folderId);

  const sortedDiagrams = [...currentDiagrams].sort((a, b) => {
    if (sortBy === 'updated') return b.updatedAt - a.updatedAt;
    if (sortBy === 'created') return b.createdAt - a.createdAt;
    if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
    return 0;
  });

  const activeFolderObj = folders.find((f) => f.id === activeFolder);

  // Unified Action list generator for Context Menus
  const getFolderActions = (folder: typeof folders[0]): ContextMenuItem[] => [
    { label: 'Open Folder', icon: FolderIcon, onClick: () => { setActiveFolder(folder.id); setActiveNav('workspace'); } },
    { label: 'New Diagram Here', icon: PlusIcon, onClick: () => handleCreateDiagram(folder.id) },
    { divider: true, label: '', icon: FolderIcon, onClick: () => {} },
    { label: 'Rename Folder', icon: PencilIcon, onClick: () => setRenamingFolderId(folder.id) },
    { label: 'Copy Folder Name', icon: FolderIcon, onClick: () => navigator.clipboard.writeText(folder.name) },
    { divider: true, label: '', icon: FolderIcon, onClick: () => {} },
    { label: 'Delete Folder', icon: Trash2Icon, onClick: () => { if (confirm(`Delete folder "${folder.name}"? Diagrams inside will be moved to workspace root.`)) deleteFolder(folder.id); }, danger: true },
  ];

  const getDiagramActions = (diagram: Diagram): ContextMenuItem[] => [
    { label: 'Open in Editor', icon: ExternalLinkIcon, onClick: () => handleOpenDiagram(diagram.id) },
    { label: 'Rename', icon: PencilIcon, onClick: () => setRenamingDiagramId(diagram.id) },
    { label: 'Copy Name', icon: FileIcon, onClick: () => navigator.clipboard.writeText(diagram.name) },
    { divider: true, label: '', icon: FileIcon, onClick: () => {} },
    { label: 'Delete', icon: Trash2Icon, onClick: () => { if (confirm(`Are you sure you want to delete "${diagram.name}"?`)) deleteDiagram(diagram.id); }, danger: true },
  ];

  const handleFolderContextMenu = (e: React.MouseEvent, folder: typeof folders[0]) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, items: getFolderActions(folder) });
  };

  const handleDiagramContextMenu = (e: React.MouseEvent, diagram: Diagram) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, items: getDiagramActions(diagram) });
  };

  const navItems: { id: NavSection; label: string; icon: typeof HomeIcon }[] = [
    { id: 'home', label: 'Home Feed', icon: HomeIcon },
    { id: 'workspace', label: 'My Workspace', icon: LayoutDashboardIcon },
    { id: 'templates', label: 'Templates Library', icon: BookOpenIcon },
    { id: 'about', label: 'About Studio', icon: UsersIcon },
  ];

  const switchNav = (nav: NavSection) => {
    setActiveNav(nav);
    setActiveFolder(null);
    setIsMobileSidebarOpen(false);
  };

  const templates = [
    { name: 'Flowchart', category: 'flow', desc: 'Standard business flow with decision blocks', code: 'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[OK]\n  B -->|No| D[Cancel]' },
    { name: 'Sequence Diagram', category: 'uml', desc: 'Actor relationships & chronological messages', code: 'sequenceDiagram\n  Alice->>Bob: Hello\n  Bob-->>Alice: Hi' },
    { name: 'Class Diagram', category: 'uml', desc: 'Object-oriented application structures', code: 'classDiagram\n  Animal <|-- Dog\n  Animal <|-- Cat\n  Animal : +String name\n  Dog : +bark()' },
    { name: 'Architecture Blueprint', category: 'architecture', desc: 'Microservice load distribution layout', code: 'graph LR\n  Client --> API_Gateway[API Gateway]\n  API_Gateway --> AuthService\n  API_Gateway --> ProductService' },
    { name: 'Concept Map', category: 'ideas', desc: 'Brainstorm and map visual system entities', code: 'mindmap\n  root((Visual Studio))\n    Architecture\n      Services\n    Documentation\n      Code' },
    { name: 'Git Workflow Graph', category: 'architecture', desc: 'Visualize Git branch actions & merges', code: 'gitGraph\n  commit\n  branch develop\n  checkout develop\n  commit\n  checkout main\n  merge develop' },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'flow': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'uml': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'architecture': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'ideas': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const filteredTemplates = templates.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-white">
      
      {/* Background Ambient Aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.06),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* MOBILE-ONLY SIDEBAR DRAWER */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 lg:hidden"
            >
              <div className="h-full bg-[#0a0a0c] border-r border-white/[0.04] flex flex-col overflow-hidden">
                {/* Logo & Close Button */}
                <div className="p-5 pb-4 border-b border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-accent to-brand-accent-hover rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-brand-accent/25 text-white">AS</div>
                    <div>
                      <span className="text-sm font-bold tracking-tight text-white block leading-tight">Studio Suite</span>
                      <span className="text-[10px] text-white/30 font-medium">Browser Workspace</span>
                    </div>
                  </div>
                  <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-colors">
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Specific Search (Within the Sidebar) */}
                <div className="p-4 pb-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input type="text" placeholder="Search diagrams & files..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/25 focus:outline-none focus:border-brand-accent/30 transition-all" />
                  </div>
                </div>
                
                {/* Nav Items */}
                <div className="px-3 py-2 space-y-0.5">
                  {navItems.map((item) => (
                    <button key={item.id} onClick={() => switchNav(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs transition-all ${
                        activeNav === item.id && !activeFolder 
                          ? 'bg-brand-accent/10 text-brand-accent font-semibold' 
                          : 'text-white/50 hover:text-white/85 hover:bg-white/[0.03]'
                      }`}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Quick actions inside Drawer */}
                <div className="px-3 py-2 border-t border-white/[0.04] mt-2 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/20 px-3.5 mb-2">Workspace</p>
                  <button onClick={() => { handleCreateDiagram(); setIsMobileSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/[0.03] transition-all">
                    <div className="w-7 h-7 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                      <PlusIcon className="w-3.5 h-3.5 text-brand-accent" />
                    </div>
                    New Diagram
                  </button>
                  <button onClick={() => { setShowNewFolderInput(true); switchNav('workspace'); setIsMobileSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/[0.03] transition-all">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center">
                      <FolderPlusIcon className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    New Folder
                  </button>
                </div>

                {/* Recents List inside Drawer */}
                <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-white/[0.04]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/20 px-3.5 mb-2">Recent Files</p>
                  <div className="space-y-0.5">
                    {diagrams.slice(0, 8).map((diagram) => (
                      <button key={diagram.id} onClick={() => handleOpenDiagram(diagram.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-white/40 hover:text-white/80 hover:bg-white/[0.03] transition-all text-left truncate">
                        <FileIcon className="w-3.5 h-3.5 shrink-0 text-white/20" />
                        <span className="truncate flex-1">{diagram.name}</span>
                      </button>
                    ))}
                    {diagrams.length === 0 && (
                      <p className="text-[11px] text-white/20 py-4 text-center italic">No diagrams stored yet</p>
                    )}
                  </div>
                </div>
                
                {/* Footer in Drawer */}
                <div className="p-4 border-t border-white/[0.04] bg-white/[0.01]">
                  <div className="flex items-center justify-between text-[10px] text-white/20">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Client Cache Online
                    </span>
                    <span className="bg-white/[0.04] px-2 py-0.5 rounded-md font-mono">{diagrams.length} files</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TOP HEADER & LAPTOP HORIZONTAL NAVBAR */}
      <header className="h-16 border-b border-white/[0.05] bg-[#0a0a0c]/80 backdrop-blur-xl shrink-0 relative z-30 flex items-center px-4 sm:px-6 lg:px-10 justify-between gap-4">
        
        {/* Left Area: Logo & Mobile Hamburger */}
        <div className="flex items-center gap-3.5">
          <button onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-colors lg:hidden" title="Open Menu">
            <MenuIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => switchNav('home')}>
            <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent-hover rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-brand-accent/20 text-white">AS</div>
            <span className="hidden sm:inline text-sm font-bold tracking-tight text-white">Studio</span>
          </div>
        </div>

        {/* Center Area: Laptop Horizontal Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isSelected = activeNav === item.id && !activeFolder;
            return (
              <button key={item.id} onClick={() => switchNav(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                  isSelected ? 'bg-brand-accent/10 text-brand-accent' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                <item.icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-accent' : 'text-white/45'}`} />
                <span>{item.label}</span>
                {isSelected && (
                  <motion.div layoutId="navTabUnderline" className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-accent rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Area: Search (Laptop screen) & Action Button */}
        <div className="flex items-center gap-4.5">
          {/* Laptop view search bar */}
          <div className="hidden lg:block relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" placeholder="Search diagrams..." value={search} onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-white/[0.03] border border-white/[0.05] hover:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-white/35 focus:outline-none focus:border-brand-accent/40 focus:bg-white/[0.05] transition-all" />
          </div>

          <button onClick={() => navigate('/editor')}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-accent/15 active:scale-[0.98] shrink-0">
            <Code2Icon className="w-4 h-4" />
            <span className="hidden sm:inline">Open Editor</span>
            <span className="sm:hidden">Editor</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT LAYOUT */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-brand-bg">
        
        {/* SCROLLABLE VIEWPORT CONTENT */}
        <div className="flex-1 overflow-y-auto">
          
          {/* TAB VIEW: HOME FEED */}
          {activeNav === 'home' && !activeFolder && (
            <div className="pb-16">
              
              {/* Graphic Hero Section */}
              <div className="relative overflow-hidden border-b border-white/[0.04] py-20 sm:py-28 bg-[#0a0a0c]/40">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-brand-accent/10 blur-[130px] rounded-full pointer-events-none" />
                <div className="max-w-6xl mx-auto px-6 lg:px-10 relative">
                  <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-xs font-semibold text-brand-accent mb-6">
                      <SparklesIcon className="w-3.5 h-3.5 text-brand-accent" /> Offline Architecture Sandbox
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] text-white">
                      Build diagram workflows <br />
                      <span className="bg-gradient-to-r from-brand-accent via-indigo-400 to-indigo-300 bg-clip-text text-transparent">with zero configurations.</span>
                    </h1>
                    <p className="text-white/40 text-sm sm:text-base max-w-xl mb-10 leading-relaxed">
                      Render high-fidelity software architecture designs, network routing topologies, database schema maps, and sequence timelines instantly on a local-first workbench.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                      <button onClick={() => handleCreateDiagram()} className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-accent/20 hover:scale-[1.01] active:scale-95">
                        <PlusIcon className="w-4 h-4" /> Start Designing <ArrowRightIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => switchNav('workspace')} className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-xl font-bold text-sm transition-all">
                        Browse My Workspace
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="max-w-6xl mx-auto px-6 lg:px-10 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: Code2Icon, title: 'Mermaid Syntax Engine', desc: 'Code diagram sequences, class maps, entity relations, and charts dynamically using clear markdown structures.' },
                    { icon: SparklesIcon, title: 'Slick Interactive Workbench', desc: 'Manage local directories, search content seamlessly, and run immediate full-screen renders offline.' },
                    { icon: LayoutDashboardIcon, title: 'Clean Export Capabilities', desc: 'Convert structured designs into SVG elements, raw text files, or production blueprint layouts.' },
                  ].map((feat, idx) => (
                    <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}
                      className="p-6 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                        <feat.icon className="w-5 h-5 text-brand-accent" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>
                      <p className="text-xs text-white/40 leading-relaxed">{feat.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Clean Metric Displays */}
              <div className="max-w-6xl mx-auto px-6 lg:px-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Drafts', value: diagrams.length },
                    { label: 'Saved Directories', value: folders.length },
                    { label: 'Edits This Week', value: diagrams.filter((d) => Date.now() - d.createdAt < 7 * 86400000).length },
                    { label: 'Database Status', value: 'Local SQLite Active' },
                  ].map((stat, idx) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * idx }}
                      className="p-5 rounded-2xl bg-[#0f0f12]/40 border border-white/[0.04] flex flex-col justify-between min-h-[110px]">
                      <p className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</p>
                      <p className="text-[10px] text-white/30 font-semibold uppercase mt-2 tracking-wider">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB VIEW: WORKSPACE */}
          {(activeNav === 'workspace' || activeFolder) && (
            <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
              
              {/* Layout view-modes & Workspace Header Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/[0.05] pb-6">
                <div>
                  {activeFolder ? (
                    <button onClick={() => setActiveFolder(null)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                      <span className="text-xs font-bold uppercase tracking-wider">All Folders</span>
                      <ChevronRightIcon className="w-4 h-4 text-white/20" />
                      <FolderIcon className="w-4.5 h-4.5 text-amber-400" />
                      <span className="text-sm font-bold text-white group-hover:underline">{activeFolderObj?.name}</span>
                    </button>
                  ) : (
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Personal Workspace</h2>
                      <p className="text-xs text-white/40 mt-1">Structure, edit, and categorize locally cached diagram builds.</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                  
                  {/* Grid / List Layout toggle */}
                  <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/5 text-white shadow-sm' : 'text-white/40 hover:text-white'}`} title="Grid View">
                      <GridIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/5 text-white shadow-sm' : 'text-white/40 hover:text-white'}`} title="List View">
                      <ListIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                    <ArrowUpDownIcon className="w-3.5 h-3.5 text-white/40" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-transparent text-xs text-white/70 outline-none cursor-pointer focus:text-white">
                      <option value="updated" className="bg-[#0f0f12]">Recent Edits</option>
                      <option value="created" className="bg-[#0f0f12]">Date Added</option>
                      <option value="alphabetical" className="bg-[#0f0f12]">Alphabetical</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <button onClick={() => setShowNewFolderInput(true)} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-white/80 border border-white/10 transition-all">
                    <FolderPlusIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Add Folder</span>
                  </button>
                  <button onClick={() => handleCreateDiagram()} className="flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-xs font-bold rounded-xl text-white transition-all shadow-md">
                    <PlusIcon className="w-4 h-4" />
                    <span>New Design</span>
                  </button>
                </div>
              </div>

              {/* Folder Creation Input */}
              <AnimatePresence>
                {showNewFolderInput && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-6">
                    <div className="p-4 bg-brand-accent/5 border border-brand-accent/15 rounded-2xl flex items-center gap-4">
                      <FolderIcon className="w-5 h-5 text-amber-400 shrink-0" />
                      <input autoFocus placeholder="Enter directory path name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateFolder();
                          if (e.key === 'Escape') { setShowNewFolderInput(false); setNewFolderName(''); }
                        }}
                        className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none" />
                      <button onClick={handleCreateFolder} className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl text-xs font-bold transition-all">
                        Initialize
                      </button>
                      <button onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }} className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-colors">
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FOLDER BLUEPRINT TILES */}
              {!activeFolder && folders.length > 0 && (
                <div className="mb-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/20 mb-4 flex items-center gap-2">
                    <span>Active Folders</span>
                    <span className="h-px bg-white/[0.04] flex-1" />
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {folders.map((folder) => {
                      const count = diagrams.filter((d) => d.folderId === folder.id).length;
                      const isDragOver = dragOverFolderId === folder.id;
                      return (
                        <motion.div key={folder.id} layout whileHover={{ scale: 1.01 }}
                          className={`group relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between min-h-[120px] ${
                            isDragOver
                              ? 'border-brand-accent bg-brand-accent/10 shadow-lg shadow-brand-accent/5'
                              : 'border-white/5 bg-[#0f0f12]/30 hover:bg-[#0f0f12]/60 hover:border-white/10'
                          }`}
                          onClick={() => setActiveFolder(folder.id)}
                          onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                          onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                          onDragLeave={handleFolderDragLeave}
                          onDrop={(e) => handleFolderDrop(e, folder.id)}>
                          
                          <div className="flex items-start justify-between">
                            <FolderIcon className="w-7 h-7 text-amber-400/80 group-hover:scale-105 transition-transform" />
                            
                            <button onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, items: getFolderActions(folder) }); }}
                              className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                              <MoreVerticalIcon className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-4">
                            {renamingFolderId === folder.id ? (
                              <input autoFocus defaultValue={folder.name} onBlur={(e) => { renameFolder(folder.id, e.target.value); setRenamingFolderId(null); }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { renameFolder(folder.id, e.currentTarget.value); setRenamingFolderId(null); }
                                  if (e.key === 'Escape') setRenamingFolderId(null);
                                }}
                                onClick={(e) => e.stopPropagation()} className="bg-brand-bg border border-brand-accent/50 rounded px-2 py-1 w-full text-xs text-white outline-none" />
                            ) : (
                              <h4 className="text-xs font-bold text-white/80 group-hover:text-white truncate">{folder.name}</h4>
                            )}
                            <p className="text-[10px] text-white/30 mt-1 font-medium">{count} {count === 1 ? 'Diagram' : 'Diagrams'}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BLUEPRINT GRIDS & LIST SECTIONS */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={handleRootDrop}
                className="relative min-h-[400px]">

                {/* Root dropping overlay block */}
                {draggedDiagramId && activeFolder && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOverRootZone(true); }}
                    onDragLeave={() => setIsDraggingOverRootZone(false)}
                    onDrop={handleRootDrop}
                    className={`mb-6 p-6 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${
                      isDraggingOverRootZone
                        ? 'bg-brand-accent/10 border-brand-accent text-white scale-[1.01]'
                        : 'bg-white/[0.01] border-white/10 text-white/40'
                    }`}>
                    <ArrowUpDownIcon className="w-5 h-5 text-brand-accent animate-bounce" />
                    <span className="text-xs font-bold">Drop here to move this design file back to Workspace Root</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/20 flex items-center gap-2 flex-1">
                    <span>{activeFolder ? activeFolderObj?.name : 'Root Canvas Files'}</span>
                    <span className="h-px bg-white/[0.04] flex-1" />
                  </p>
                </div>

                {sortedDiagrams.length === 0 && !search ? (
                  <div className="flex flex-col items-center justify-center text-center py-24 bg-[#0a0a0c]/20 rounded-2xl border border-dashed border-white/[0.05]">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center mb-5">
                      <FileTextIcon className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">Workspace empty</h3>
                    <p className="text-white/40 text-xs mb-6 max-w-xs">Start creating diagram blueprints to visualize software configurations.</p>
                    <button onClick={() => handleCreateDiagram()} className="bg-brand-accent hover:bg-brand-accent-hover text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-xs">
                      <PlusIcon className="w-4 h-4" /> Create Design File
                    </button>
                  </div>
                ) : sortedDiagrams.length === 0 && search ? (
                  <div className="flex flex-col items-center justify-center text-center py-20">
                    <p className="text-white/40 text-xs">No active files found matching search query "{search}"</p>
                  </div>
                ) : (
                  <>
                    {viewMode === 'grid' ? (
                      /* GRID RENDERING MODE */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        
                        <motion.button onClick={() => handleCreateDiagram()} whileHover={{ scale: 1.01 }}
                          className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/5 hover:border-brand-accent/50 flex flex-col items-center justify-center gap-3 text-white/30 hover:text-brand-accent transition-all bg-[#0a0a0c]/10 hover:bg-[#0a0a0c]/30">
                          <PlusIcon className="w-7 h-7" />
                          <span className="text-xs font-bold">New Design File</span>
                        </motion.button>

                        {sortedDiagrams.map((diagram) => (
                          <DiagramCard key={diagram.id} diagram={diagram} onOpen={() => handleOpenDiagram(diagram.id)} onDelete={() => { if (confirm(`Delete "${diagram.name}"?`)) deleteDiagram(diagram.id); }}
                            onContextMenu={(e) => handleDiagramContextMenu(e, diagram)}
                            onShowActionsMenu={(x, y) => setContextMenu({ x, y, items: getDiagramActions(diagram) })}
                            renaming={renamingDiagramId === diagram.id}
                            onRenameSubmit={(name) => { useStore.getState().updateDiagram(diagram.id, { name }); setRenamingDiagramId(null); }}
                            onRenameCancel={() => setRenamingDiagramId(null)}
                            onDragStart={(e) => handleDragStart(e, diagram.id)}
                            onDragEnd={handleDragEnd}
                            isDragging={draggedDiagramId === diagram.id} />
                        ))}
                      </div>
                    ) : (
                      /* LIST RENDERING MODE */
                      <div className="border border-white/[0.05] rounded-2xl overflow-hidden bg-[#0f0f12]/10 backdrop-blur-md">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-white/[0.05] text-[10px] font-bold uppercase tracking-wider text-white/30">
                          <div className="col-span-6 sm:col-span-7 flex items-center">Design Path Name</div>
                          <div className="col-span-3 sm:col-span-3">Last Modified</div>
                          <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                          {sortedDiagrams.map((diagram) => {
                            const isItemDragging = draggedDiagramId === diagram.id;
                            return (
                              <div key={diagram.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, diagram.id)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleOpenDiagram(diagram.id)}
                                onContextMenu={(e) => handleDiagramContextMenu(e, diagram)}
                                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all cursor-grab active:cursor-grabbing hover:bg-white/[0.02] ${
                                  isItemDragging ? 'opacity-40 bg-brand-accent/5' : ''
                                }`}>
                                <div className="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0">
                                  <FileTextIcon className="w-4 h-4 text-brand-accent/70 shrink-0" />
                                  {renamingDiagramId === diagram.id ? (
                                    <input autoFocus defaultValue={diagram.name}
                                      onBlur={(e) => { useStore.getState().updateDiagram(diagram.id, { name: e.target.value }); setRenamingDiagramId(null); }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') { useStore.getState().updateDiagram(diagram.id, { name: e.currentTarget.value }); setRenamingDiagramId(null); }
                                        if (e.key === 'Escape') setRenamingDiagramId(null);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="bg-brand-bg border border-brand-accent/50 rounded px-2 py-0.5 text-xs text-white outline-none min-w-0 flex-1" />
                                  ) : (
                                    <span className="text-xs font-semibold text-white/80 hover:text-white truncate">{diagram.name}</span>
                                  )}
                                </div>
                                <div className="col-span-3 sm:col-span-3 text-xs text-white/40 flex items-center gap-1.5">
                                  <CalendarIcon className="w-3.5 h-3.5 text-white/20" />
                                  {new Date(diagram.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => handleOpenDiagram(diagram.id)} className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all" title="Open in Editor">
                                    <ExternalLinkIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={(e) => setContextMenu({ x: e.clientX, y: e.clientY, items: getDiagramActions(diagram) })} className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all" title="More Options">
                                    <MoreVerticalIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB VIEW: TEMPLATES */}
          {activeNav === 'templates' && !activeFolder && (
            <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white tracking-tight">Structured Templates</h2>
                <p className="text-xs text-white/40 mt-1">Skip manually configuring architecture designs by instantiating core layouts.</p>
              </div>

              {/* Category selector tags */}
              <div className="flex flex-wrap items-center gap-1.5 mb-8 border-b border-white/[0.05] pb-5">
                {[
                  { id: 'all', label: 'All Layouts' },
                  { id: 'flow', label: 'Flowcharts' },
                  { id: 'uml', label: 'UML Models' },
                  { id: 'architecture', label: 'Systems & Cloud' },
                  { id: 'ideas', label: 'Mindmaps & Concepts' },
                ].map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id as TemplateCategory)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedCategory === cat.id 
                        ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/25' 
                        : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Active list of blueprint elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((t, idx) => (
                  <motion.button key={t.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}
                    onClick={() => {
                      const id = addDiagram(t.name);
                      useStore.getState().updateDiagram(id, { mermaidCode: t.code });
                      setActiveDiagram(id);
                      navigate('/editor');
                    }}
                    className="text-left p-6 rounded-2xl border border-white/5 bg-[#0f0f12]/30 hover:bg-[#0f0f12]/60 hover:border-brand-accent/30 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[190px]">
                    
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <GridIcon className="w-4.5 h-4.5 text-brand-accent" />
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(t.category)}`}>
                          {t.category}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white mb-2">{t.name}</h3>
                      <p className="text-[11px] text-white/40 leading-relaxed">{t.desc}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.03] flex items-center justify-between text-[11px] text-brand-accent font-bold group-hover:text-white transition-colors">
                      <span>Create from Template</span>
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* TAB VIEW: ABOUT */}
          {activeNav === 'about' && !activeFolder && (
            <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
              <div className="mb-10">
                <h2 className="text-xl font-bold text-white tracking-tight">System Specification</h2>
                <p className="text-xs text-white/40 mt-1">An offline browser-cached design tool optimized for engineering workflows.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-2xl bg-[#0f0f12]/30 border border-white/[0.05] flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">Client Storage Schema</h3>
                    <p className="text-xs text-white/40 leading-relaxed mb-6">
                      Architecture Studio leverages sandbox databases directly in your client browser cache structure. Design assets are not processed by centralized cloud networks, offering visual safety and offline capability.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {['Zero tracking metrics', 'Completely offline capable sandbox', 'Instant file serialization'].map((check) => (
                      <div key={check} className="flex items-center gap-2 text-xs text-white/60">
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Core Version', value: 'v1.4.2' },
                    { label: 'Render Framework', value: 'Mermaid v10' },
                    { label: 'Storage Driver', value: 'Indexed LocalStore' },
                    { label: 'Runtime Environment', value: 'Browser Client Sandbox' }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                      <span className="text-xs text-white/40">{item.label}</span>
                      <span className="text-xs font-bold text-white/80">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RENDER CONTEXT MENU */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
}

interface DiagramCardProps {
  diagram: Diagram;
  onOpen: () => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onShowActionsMenu: (x: number, y: number) => void;
  renaming: boolean;
  onRenameSubmit: (name: string) => void;
  onRenameCancel: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function DiagramCard({
  diagram,
  onOpen,
  onContextMenu,
  onShowActionsMenu,
  renaming,
  onRenameSubmit,
  onRenameCancel,
  onDragStart,
  onDragEnd,
  isDragging,
}: DiagramCardProps) {
  const codeLines = diagram.mermaidCode?.split('\n').length || 0;

  return (
    <div
      className={`group aspect-[4/3] rounded-2xl border transition-all duration-250 flex flex-col justify-between p-5 cursor-grab active:cursor-grabbing relative overflow-hidden ${
        isDragging
          ? 'border-brand-accent/50 bg-brand-accent/5 opacity-40 scale-[0.98]'
          : 'border-white/5 bg-[#0f0f12]/30 hover:bg-[#0f0f12]/60 hover:border-white/10 hover:shadow-lg hover:shadow-black/20'
      }`}
      onClick={onOpen} onContextMenu={onContextMenu}
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
      
      {/* Accent gradients on card hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
          <FileTextIcon className="w-5 h-5 text-brand-accent/80" />
        </div>

        {/* Desktop context trigger */}
        <button onClick={(e) => { e.stopPropagation(); onShowActionsMenu(e.clientX, e.clientY); }}
          className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
          <MoreVerticalIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="relative z-10 mt-auto">
        {renaming ? (
          <input autoFocus defaultValue={diagram.name} onBlur={(e) => onRenameSubmit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameSubmit(e.currentTarget.value);
              if (e.key === 'Escape') onRenameCancel();
            }}
            onClick={(e) => e.stopPropagation()} className="bg-brand-bg border border-brand-accent/50 rounded px-2 py-1 w-full text-xs text-white outline-none" />
        ) : (
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white/85 group-hover:text-white truncate">{diagram.name}</h4>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-medium">
            <ClockIcon className="w-3.5 h-3.5 text-white/20" />
            <span>{new Date(diagram.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
          {codeLines > 1 && (
            <span className="text-[9px] font-mono text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-1.5 py-0.5 rounded">
              {codeLines} lines
            </span>
          )}
        </div>
      </div>
    </div>
  );
}