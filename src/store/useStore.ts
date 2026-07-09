import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { v4 as uuidv4 } from 'uuid';
import { Diagram, Folder, Project } from '../types';

interface DiagramState {
  projects: Project[];
  folders: Folder[];
  diagrams: Diagram[];
  activeDiagramId: string | null;
  isSyncing: boolean;
  user: any | null;
  
  // Actions
  setUser: (user: any | null) => void;
  addProject: (name: string) => void;
  addFolder: (name: string, parentId?: string | null) => void;
  addDiagram: (name: string, folderId?: string | null) => string;
  updateDiagram: (id: string, updates: Partial<Diagram>) => void;
  deleteDiagram: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveDiagramToFolder: (diagramId: string, folderId: string | null) => void;
  setActiveDiagram: (id: string | null) => void;
  formatActiveDiagram: () => void;
  saveVersion: (id: string, message?: string) => void;
  restoreVersion: (diagramId: string, versionId: string) => void;
  
  // Initial seeding if empty
  seed: () => void;
}

export const useStore = create<DiagramState>()(
  temporal(
    persist(
      (set, get) => ({
        projects: [],
        folders: [],
        diagrams: [],
        activeDiagramId: null,
        isSyncing: false,
        user: null,

        setUser: (user) => set({ user }),

        addProject: (name) => set((state) => ({
          projects: [...state.projects, { id: uuidv4(), name, createdAt: Date.now() }]
        })),

        addFolder: (name, parentId = null) => set((state) => ({
          folders: [...state.folders, { id: uuidv4(), name, parentId, projectId: null }]
        })),

        addDiagram: (name, folderId = null) => {
          const id = uuidv4();
          const newDiagram: Diagram = {
            id,
            name,
            type: 'mermaid',
            description: '',
            folderId,
            mermaidCode: 'graph TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|One| D[Result 1]\n  C -->|Two| E[Result 2]',
            mermaidTheme: 'dark',
            previewUrl: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: [],
            versions: []
          };
          set((state) => ({
            diagrams: [...state.diagrams, newDiagram],
            activeDiagramId: id
          }));
          return id;
        },

        updateDiagram: (id, updates) => set((state) => ({
          diagrams: state.diagrams.map((d) => 
            d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
          )
        })),

        deleteDiagram: (id) => set((state) => ({
          diagrams: state.diagrams.filter((d) => d.id !== id),
          activeDiagramId: state.activeDiagramId === id ? null : state.activeDiagramId
        })),

        renameFolder: (id, name) => set((state) => ({
          folders: state.folders.map(f => f.id === id ? { ...f, name } : f)
        })),

        deleteFolder: (id) => set((state) => ({
          folders: state.folders.filter(f => f.id !== id),
          diagrams: state.diagrams.filter(d => d.folderId !== id)
        })),

        moveDiagramToFolder: (diagramId, folderId) => set((state) => ({
          diagrams: state.diagrams.map(d => d.id === diagramId ? { ...d, folderId, updatedAt: Date.now() } : d)
        })),

        setActiveDiagram: (id) => set({ activeDiagramId: id }),

        saveVersion: (id, message) => set((state) => ({
          diagrams: state.diagrams.map((d) => 
            d.id === id ? { 
              ...d, 
              versions: [
                ...(d.versions || []), 
                { id: uuidv4(), code: d.mermaidCode, timestamp: Date.now(), message }
              ] 
            } : d
          )
        })),

        restoreVersion: (diagramId, versionId) => set((state) => {
          const diagram = state.diagrams.find(d => d.id === diagramId);
          const version = diagram?.versions.find(v => v.id === versionId);
          if (!diagram || !version) return state;

          return {
            diagrams: state.diagrams.map((d) => 
              d.id === diagramId ? { ...d, mermaidCode: version.code, updatedAt: Date.now() } : d
            )
          };
        }),

        formatActiveDiagram: () => {
          const { activeDiagramId, diagrams, updateDiagram } = get();
          const activeDiagram = diagrams.find(d => d.id === activeDiagramId);
          if (!activeDiagram) return;

          const lines = activeDiagram.mermaidCode.split('\n');
          let indent = 0;
          const formatted = lines
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
              // Basic indentation logic
              if (line.includes('}') || line.includes('end')) indent = Math.max(0, indent - 2);
              const currentLine = ' '.repeat(indent) + line;
              if (line.includes('{') || line.includes('subgraph')) indent += 2;
              return currentLine;
            })
            .join('\n');

          updateDiagram(activeDiagramId!, { mermaidCode: formatted });
        },

        seed: () => {
          const { diagrams } = get();
          if (diagrams.length === 0) {
            const folderId = uuidv4();
            const id = uuidv4();
            set({
              folders: [{ id: folderId, name: 'Getting Started', parentId: null, projectId: null }],
              diagrams: [{
                id,
                name: 'Sample Architecture',
                type: 'mermaid',
                description: '',
                folderId,
                mermaidCode: 'graph TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|One| D[Result 1]\n  C -->|Two| E[Result 2]',
                mermaidTheme: 'dark',
                previewUrl: '',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tags: [],
                versions: []
              }],
            });
          }
        }
      }),
      {
        name: 'ai-diagram-studio-storage',
        partialize: (state) => ({
          projects: state.projects,
          folders: state.folders,
          diagrams: state.diagrams,
          user: state.user,
        }),
      }
    )
  )
);
