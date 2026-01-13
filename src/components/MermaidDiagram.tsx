import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Initialize mermaid with configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#4f46e5',
    primaryTextColor: '#1f2937',
    primaryBorderColor: '#6366f1',
    lineColor: '#6b7280',
    secondaryColor: '#f3f4f6',
    tertiaryColor: '#e5e7eb',
    background: '#ffffff',
    mainBkg: '#f9fafb',
    nodeBorder: '#6366f1',
    clusterBkg: '#f3f4f6',
    clusterBorder: '#d1d5db',
    titleColor: '#1f2937',
    edgeLabelBackground: '#ffffff',
    nodeTextColor: '#1f2937',
  },
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 14,
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 15,
  },
  sequence: {
    diagramMarginX: 10,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
  },
  er: {
    entityPadding: 15,
    fontSize: 12,
    useMaxWidth: true,
  },
});

export const MermaidDiagram = ({ chart, className = '' }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        setError(null);
        setIsRendered(false);
        
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        // Generate unique ID for each render
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, chart);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          setIsRendered(true);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className={`bg-destructive/10 border border-destructive/20 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-destructive font-medium">Diagram Error</p>
        <p className="text-xs text-destructive/80 mt-1">{error}</p>
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer">View source</summary>
          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-x-auto">{chart}</pre>
        </details>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`mermaid-diagram overflow-x-auto ${className} ${!isRendered ? 'min-h-[100px] flex items-center justify-center' : ''}`}
    >
      {!isRendered && (
        <div className="text-sm text-muted-foreground animate-pulse">Loading diagram...</div>
      )}
    </div>
  );
};

export default MermaidDiagram;
