import React from 'react';
import { 
  FolderIcon, 
  FileIcon, 
  PlusIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  Trash2Icon,
  SearchIcon,
  LayoutDashboardIcon,
  PencilIcon,
  XIcon,
  SparklesIcon,
  PanelRightCloseIcon
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

import { ViewMode } from '../types';

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { 
    folders, 
    diagrams, 
    activeDiagramId, 
    setActiveDiagram, 
    addDiagram, 
    addFolder,
    deleteDiagram,
    updateDiagram,
    renameFolder,
    deleteFolder
  } = useStore();
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set(['root']));
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingFolderId, setEditingFolderId] = React.useState<string | null>(null);
  const [editingDiagramId, setEditingDiagramId] = React.useState<string | null>(null);

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const filteredDiagrams = diagrams.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64 bg-brand-sidebar border-r border-brand-border h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-brand-border">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-sm font-bold flex items-center gap-3 tracking-tight flex-1">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-xs shadow-lg shadow-brand-accent/20">
              AS
            </div>
            <span className="hidden sm:inline">Studio</span>
          </h1>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors lg:hidden">
              <PanelRightCloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => addDiagram('Untitled Diagram')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/30 rounded-lg text-[11px] font-bold transition-all"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            New
          </button>
          <button
            onClick={() => addFolder('New Folder')}
            className="flex items-center justify-center p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors border border-white/10"
            title="New Folder"
          >
            <FolderIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Diagrams</span>
            <span className="text-[10px] text-white/20 font-mono">{diagrams.length}</span>
          </div>

          {folders.map(folder => (
            <div key={folder.id} className="space-y-1 group/folder">
              <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-white/5 rounded-lg group">
                <button 
                  onClick={() => toggleFolder(folder.id)}
                  className="flex items-center gap-2 flex-1 text-left text-xs text-brand-text-dim"
                >
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDownIcon className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronRightIcon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <FolderIcon className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  {editingFolderId === folder.id ? (
                    <input 
                      autoFocus
                      className="bg-brand-bg border border-brand-accent/50 rounded px-1 w-full text-white outline-none"
                      defaultValue={folder.name}
                      onBlur={(e) => {
                        renameFolder(folder.id, e.target.value);
                        setEditingFolderId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameFolder(folder.id, e.currentTarget.value);
                          setEditingFolderId(null);
                        }
                      }}
                    />
                  ) : (
                    <span className="flex-1 truncate">{folder.name}</span>
                  )}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      addDiagram('New Diagram', folder.id);
                      if (!expandedFolders.has(folder.id)) toggleFolder(folder.id);
                    }}
                    className="p-1 hover:text-brand-accent"
                    title="Add Diagram"
                  >
                    <FileIcon className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => setEditingFolderId(folder.id)}
                    className="p-1 hover:text-white"
                    title="Rename Folder"
                  >
                    <PencilIcon className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => deleteFolder(folder.id)}
                    className="p-1 hover:text-rose-400"
                    title="Delete Folder"
                  >
                    <Trash2Icon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedFolders.has(folder.id) && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ml-3 pl-3 border-l border-white/5 space-y-0.5 overflow-hidden"
                  >
                    {filteredDiagrams.filter(d => d.folderId === folder.id).map(diagram => (
                      <div key={diagram.id} className="flex items-center group/file px-2 py-1 hover:bg-white/5 rounded-lg transition-colors">
                        <button 
                          onClick={() => setActiveDiagram(diagram.id)}
                          className={`flex-1 flex items-center gap-2 py-0.5 text-left text-xs transition-all ${
                            activeDiagramId === diagram.id 
                              ? 'text-brand-accent font-medium' 
                              : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <FileIcon className="w-3.5 h-3.5 opacity-60 shrink-0" />
                          {editingDiagramId === diagram.id ? (
                            <input 
                              autoFocus
                              className="bg-brand-bg border border-brand-accent/50 rounded px-1 w-full text-white outline-none"
                              defaultValue={diagram.name}
                              onBlur={(e) => {
                                updateDiagram(diagram.id, { name: e.target.value });
                                setEditingDiagramId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateDiagram(diagram.id, { name: e.currentTarget.value });
                                  setEditingDiagramId(null);
                                }
                                if (e.key === 'Escape') setEditingDiagramId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="flex-1 truncate">{diagram.name}</span>
                          )}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingDiagramId(diagram.id)}
                            className="p-1 hover:text-white text-white/30"
                            title="Rename"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this diagram?')) {
                                deleteDiagram(diagram.id);
                              }
                            }}
                            className="p-1 hover:text-rose-400 text-white/30"
                            title="Delete"
                          >
                            <Trash2Icon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {filteredDiagrams.filter(d => !d.folderId).map(diagram => (
            <div key={diagram.id} className="flex items-center group/file px-2 py-1 hover:bg-white/5 rounded-lg transition-colors">
              <button 
                onClick={() => setActiveDiagram(diagram.id)}
                className={`flex-1 flex items-center gap-2 py-0.5 text-left text-xs transition-all ${
                  activeDiagramId === diagram.id 
                    ? 'text-brand-accent font-medium' 
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <FileIcon className="w-3.5 h-3.5 opacity-60 shrink-0" />
                {editingDiagramId === diagram.id ? (
                  <input 
                    autoFocus
                    className="bg-brand-bg border border-brand-accent/50 rounded px-1 w-full text-white outline-none"
                    defaultValue={diagram.name}
                    onBlur={(e) => {
                      updateDiagram(diagram.id, { name: e.target.value });
                      setEditingDiagramId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateDiagram(diagram.id, { name: e.currentTarget.value });
                        setEditingDiagramId(null);
                      }
                      if (e.key === 'Escape') setEditingDiagramId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 truncate">{diagram.name}</span>
                )}
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingDiagramId(diagram.id)}
                  className="p-1 hover:text-white text-white/30"
                  title="Rename"
                >
                  <PencilIcon className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this diagram?')) {
                      deleteDiagram(diagram.id);
                    }
                  }}
                  className="p-1 hover:text-rose-400 text-white/30"
                  title="Delete"
                >
                  <Trash2Icon className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
