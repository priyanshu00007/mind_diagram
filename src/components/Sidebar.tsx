import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderIcon,
  FileIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Trash2Icon,
  SearchIcon,
  PencilIcon,
  PanelRightCloseIcon,
  FilePlusIcon,
  FolderPlusIcon,
  CopyIcon,
  ExternalLinkIcon,
  HomeIcon,
  SparklesIcon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { ViewMode } from '../types';

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    folders,
    diagrams,
    activeDiagramId,
    setActiveDiagram,
    addDiagram,
    addFolder,
    deleteDiagram,
    deleteFolder,
    updateDiagram,
    renameFolder,
    moveDiagramToFolder,
  } = useStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingDiagramId, setEditingDiagramId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedFolders(next);
  };

  const filteredDiagrams = diagrams.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFolderContextMenu = (e: React.MouseEvent, folder: typeof folders[0]) => {
    e.preventDefault();
    e.stopPropagation();
    const count = diagrams.filter((d) => d.folderId === folder.id).length;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'New Diagram', icon: FilePlusIcon, onClick: () => { addDiagram('New Diagram', folder.id); if (!expandedFolders.has(folder.id)) toggleFolder(folder.id); } },
        { label: 'New Folder', icon: FolderPlusIcon, onClick: () => addFolder('New Folder', folder.id) },
        { divider: true, label: '', icon: FolderIcon, onClick: () => {} },
        { label: 'Rename', icon: PencilIcon, onClick: () => setEditingFolderId(folder.id) },
        { label: 'Copy Name', icon: CopyIcon, onClick: () => navigator.clipboard.writeText(folder.name) },
        { divider: true, label: '', icon: FolderIcon, onClick: () => {} },
        { label: `Delete${count > 0 ? ` (${count} files)` : ''}`, icon: Trash2Icon, onClick: () => { if (confirm(`Delete folder "${folder.name}"?`)) deleteFolder(folder.id); }, danger: true },
      ],
    });
  };

  const handleDiagramContextMenu = (e: React.MouseEvent, diagram: typeof diagrams[0]) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Open', icon: ExternalLinkIcon, onClick: () => { setActiveDiagram(diagram.id); navigate('/editor'); } },
        { label: 'Rename', icon: PencilIcon, onClick: () => setEditingDiagramId(diagram.id) },
        { label: 'Copy Name', icon: CopyIcon, onClick: () => navigator.clipboard.writeText(diagram.name) },
        { divider: true, label: '', icon: FileIcon, onClick: () => {} },
        { label: 'Delete', icon: Trash2Icon, onClick: () => { if (confirm(`Delete "${diagram.name}"?`)) deleteDiagram(diagram.id); }, danger: true },
      ],
    });
  };

  const handleBgContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-bg-menu]')) return;
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'New Diagram', icon: FilePlusIcon, onClick: () => addDiagram('Untitled Diagram') },
        { label: 'New Folder', icon: FolderPlusIcon, onClick: () => addFolder('New Folder') },
      ],
    });
  };

  const handleDragStart = (e: React.DragEvent, diagramId: string) => {
    e.dataTransfer.setData('text/plain', diagramId);
    e.dataTransfer.effectAllowed = 'move';
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
    setDragOverFolderId(null);
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const diagramId = e.dataTransfer.getData('text/plain');
    if (diagramId) {
      moveDiagramToFolder(diagramId, null);
    }
    setDragOverFolderId(null);
  };

  return (
    <div className="w-64 bg-[#0f0f12] border-r border-white/[0.06] h-full flex flex-col overflow-hidden" onContextMenu={handleBgContextMenu}>
      {/* Logo & Home */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 flex-1 hover:opacity-80 transition-opacity group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent-hover rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-brand-accent/25 group-hover:shadow-brand-accent/40 transition-shadow">
              AS
            </div>
            <div className="text-left">
              <span className="text-sm font-bold tracking-tight text-white block leading-tight">Studio</span>
              <span className="text-[10px] text-white/30 font-medium">Diagram Editor</span>
            </div>
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-colors lg:hidden">
              <PanelRightCloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2" data-no-bg-menu>
          <button
            onClick={() => addDiagram('Untitled Diagram')}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-brand-accent/20 hover:shadow-brand-accent/30 active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4" />
            New Diagram
          </button>
          <button
            onClick={() => addFolder('New Folder')}
            className="flex items-center justify-center p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors border border-white/[0.08] hover:border-white/15"
            title="New Folder"
          >
            <FolderPlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-3" data-no-bg-menu>
        <div className="relative group">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 group-focus-within:text-brand-accent transition-colors" />
          <input
            type="text"
            placeholder="Search files..."
            className="w-full bg-white/[0.04] border border-white/[0.06] group-focus-within:border-brand-accent/30 group-focus-within:bg-white/[0.06] rounded-xl px-9 py-2 text-xs text-white placeholder-white/25 focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-md text-white/30 hover:text-white transition-colors">
              <span className="text-[10px]">Esc</span>
            </button>
          )}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="space-y-0.5">
          {/* Section Header */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">Files</span>
            <span className="text-[10px] text-white/15 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded">{diagrams.length}</span>
          </div>

          {/* Folders */}
          {filteredFolders.map((folder) => {
            const count = diagrams.filter((d) => d.folderId === folder.id).length;
            const isExpanded = expandedFolders.has(folder.id);
            const isDragOver = dragOverFolderId === folder.id;

            return (
              <div key={folder.id} className="group/folder">
                <div
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${
                    isDragOver
                      ? 'bg-brand-accent/10 border border-brand-accent/30'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                  onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                  onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                  data-no-bg-menu
                >
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-2 flex-1 text-left text-xs"
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-white/25"
                    >
                      <ChevronRightIcon className="w-3 h-3" />
                    </motion.div>
                    <FolderIcon className={`w-4 h-4 shrink-0 ${isDragOver ? 'text-amber-400' : 'text-amber-400/60'}`} />
                    {editingFolderId === folder.id ? (
                      <input
                        autoFocus
                        className="bg-brand-bg border border-brand-accent/50 rounded px-1.5 py-0.5 w-full text-white outline-none text-xs"
                        defaultValue={folder.name}
                        onBlur={(e) => { renameFolder(folder.id, e.target.value); setEditingFolderId(null); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { renameFolder(folder.id, e.currentTarget.value); setEditingFolderId(null); }
                          if (e.key === 'Escape') setEditingFolderId(null);
                        }}
                      />
                    ) : (
                      <>
                        <span className="flex-1 truncate text-white/60 group-hover/folder:text-white/90 transition-colors">{folder.name}</span>
                        <span className="text-[10px] text-white/20 font-mono">{count}</span>
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity" data-no-bg-menu>
                    <button
                      onClick={() => { addDiagram('New Diagram', folder.id); if (!expandedFolders.has(folder.id)) toggleFolder(folder.id); }}
                      className="p-1 hover:text-brand-accent text-white/30 rounded-md hover:bg-white/5 transition-colors"
                      title="Add Diagram"
                    >
                      <FilePlusIcon className="w-3 h-3" />
                    </button>
                    <button onClick={() => setEditingFolderId(folder.id)} className="p-1 hover:text-white text-white/30 rounded-md hover:bg-white/5 transition-colors" title="Rename">
                      <PencilIcon className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteFolder(folder.id)} className="p-1 hover:text-rose-400 text-white/30 rounded-md hover:bg-white/5 transition-colors" title="Delete">
                      <Trash2Icon className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Folder Contents */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="ml-4 pl-3 border-l border-white/[0.04] space-y-0.5 overflow-hidden"
                    >
                      {filteredDiagrams.filter((d) => d.folderId === folder.id).map((diagram) => (
                        <DiagramItem
                          key={diagram.id}
                          diagram={diagram}
                          isActive={activeDiagramId === diagram.id}
                          isEditing={editingDiagramId === diagram.id}
                          onOpen={() => { setActiveDiagram(diagram.id); navigate('/editor'); }}
                          onStartEdit={() => setEditingDiagramId(diagram.id)}
                          onFinishEdit={(name) => { updateDiagram(diagram.id, { name }); setEditingDiagramId(null); }}
                          onCancelEdit={() => setEditingDiagramId(null)}
                          onContextMenu={(e) => handleDiagramContextMenu(e, diagram)}
                          onDragStart={(e) => handleDragStart(e, diagram.id)}
                        />
                      ))}
                      {filteredDiagrams.filter((d) => d.folderId === folder.id).length === 0 && (
                        <p className="text-[10px] text-white/20 py-2 px-2 italic">Empty folder</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Root Diagrams */}
          {filteredDiagrams.filter((d) => !d.folderId).map((diagram) => (
            <DiagramItem
              key={diagram.id}
              diagram={diagram}
              isActive={activeDiagramId === diagram.id}
              isEditing={editingDiagramId === diagram.id}
              onOpen={() => { setActiveDiagram(diagram.id); navigate('/editor'); }}
              onStartEdit={() => setEditingDiagramId(diagram.id)}
              onFinishEdit={(name) => { updateDiagram(diagram.id, { name }); setEditingDiagramId(null); }}
              onCancelEdit={() => setEditingDiagramId(null)}
              onContextMenu={(e) => handleDiagramContextMenu(e, diagram)}
              onDragStart={(e) => handleDragStart(e, diagram.id)}
            />
          ))}

          {/* Empty State */}
          {filteredDiagrams.length === 0 && filteredFolders.length === 0 && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <FileIcon className="w-5 h-5 text-white/15" />
              </div>
              <p className="text-xs text-white/30 mb-1">No files found</p>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-[10px] text-brand-accent hover:text-brand-accent-hover transition-colors">
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <div
          className={`mt-3 mx-1 p-3 rounded-xl border border-dashed text-center text-[10px] transition-all ${
            dragOverFolderId === 'root'
              ? 'border-brand-accent/50 bg-brand-accent/5 text-brand-accent'
              : 'border-white/[0.06] text-white/20 hover:border-white/10 hover:text-white/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOverFolderId('root'); }}
          onDragLeave={() => setDragOverFolderId(null)}
          onDrop={handleRootDrop}
        >
          {dragOverFolderId === 'root' ? 'Release to move to root' : 'Drop here for root'}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-[10px] text-white/20">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
            Saved locally
          </span>
          <span className="bg-white/[0.04] px-2 py-0.5 rounded-md font-mono">{diagrams.length} files</span>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
};

/* Diagram Item Component */
function DiagramItem({
  diagram,
  isActive,
  isEditing,
  onOpen,
  onStartEdit,
  onFinishEdit,
  onCancelEdit,
  onContextMenu,
  onDragStart,
}: {
  diagram: { id: string; name: string; updatedAt: number };
  isActive: boolean;
  isEditing: boolean;
  onOpen: () => void;
  onStartEdit: () => void;
  onFinishEdit: (name: string) => void;
  onCancelEdit: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  return (
    <div
      className={`flex items-center group/file px-2 py-1.5 rounded-lg transition-all cursor-grab active:cursor-grabbing ${
        isActive
          ? 'bg-brand-accent/10 border border-brand-accent/20'
          : 'hover:bg-white/[0.04] border border-transparent'
      }`}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={onDragStart}
      data-no-bg-menu
    >
      <button
        onClick={onOpen}
        className="flex-1 flex items-center gap-2 text-left text-xs min-w-0"
      >
        <FileIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-accent' : 'text-white/30'}`} />
        {isEditing ? (
          <input
            autoFocus
            className="bg-brand-bg border border-brand-accent/50 rounded px-1.5 py-0.5 w-full text-white outline-none text-xs"
            defaultValue={diagram.name}
            onBlur={(e) => onFinishEdit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onFinishEdit(e.currentTarget.value);
              if (e.key === 'Escape') onCancelEdit();
            }}
            onClick={(ev) => ev.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 truncate transition-colors ${isActive ? 'text-brand-accent font-medium' : 'text-white/50 group-hover/file:text-white/80'}`}>
            {diagram.name}
          </span>
        )}
      </button>
      <div className="flex items-center gap-0.5 opacity-0 group-hover/file:opacity-100 transition-opacity" data-no-bg-menu>
        <button onClick={(e) => { e.stopPropagation(); onStartEdit(); }} className="p-1 hover:text-white text-white/30 rounded-md hover:bg-white/5 transition-colors" title="Rename">
          <PencilIcon className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this diagram?')) useStore.getState().deleteDiagram(diagram.id); }}
          className="p-1 hover:text-rose-400 text-white/30 rounded-md hover:bg-white/5 transition-colors"
          title="Delete"
        >
          <Trash2Icon className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
