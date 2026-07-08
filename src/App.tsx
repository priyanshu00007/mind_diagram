import { useStore } from './store/useStore';
import { WelcomeScreen } from './components/WelcomeScreen';
import DiagramEditorView from './components/DiagramEditorView';

export default function App() {
  const activeDiagramId = useStore((s) => s.activeDiagramId);
  const diagrams = useStore((s) => s.diagrams);
  const hasActive = activeDiagramId && diagrams.some((d) => d.id === activeDiagramId);

  if (hasActive) {
    return <DiagramEditorView />;
  }

  return <WelcomeScreen />;
}
