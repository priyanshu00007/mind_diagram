export interface DiagramVersion {
  id: string;
  code: string;
  timestamp: number;
  message?: string;
}

export interface Diagram {
  id: string;
  name: string;
  type: 'mermaid';
  description: string;
  folderId: string | null;
  mermaidCode: string;
  mermaidTheme: 'default' | 'forest' | 'dark' | 'neutral' | 'base';
  previewUrl: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  versions: DiagramVersion[];
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  projectId: string | null;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export type ViewMode = 'editor' | 'preview';
