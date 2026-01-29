import { useEffect, useRef, useState, useCallback } from 'react';
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
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);

  // Cleanup function to safely remove any DOM nodes Mermaid may have created
  const cleanupMermaidNodes = useCallback(() => {
    // Mermaid creates temporary elements in the document body with specific IDs
    // Clean them up to prevent memory leaks and DOM conflicts
    const tempElements = document.querySelectorAll('[id^="dmermaid-"], [id^="mermaid-"]');
    tempElements.forEach(el => {
      // Only remove if it's a direct child of body (temp render elements)
      if (el.parentElement === document.body) {
        try {
          el.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!chart) return;

      try {
        setError(null);
        setIsRendering(true);
        
        // Generate unique ID for each render
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram - this returns SVG as a string
        const { svg } = await mermaid.render(id, chart);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setSvgContent(svg);
          setIsRendering(false);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setIsRendering(false);
        }
      }
    };

    renderDiagram();

    // Cleanup function
    return () => {
      isMounted = false;
      cleanupMermaidNodes();
    };
  }, [chart, cleanupMermaidNodes]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMermaidNodes();
    };
  }, [cleanupMermaidNodes]);

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
      className={`mermaid-diagram overflow-x-auto print:overflow-visible print:break-inside-avoid ${className} ${isRendering ? 'min-h-[100px] flex items-center justify-center print:min-h-0' : ''}`}
    >
      {isRendering ? (
        <div className="text-sm text-muted-foreground animate-pulse print:hidden">Loading diagram...</div>
      ) : svgContent ? (
        // Use dangerouslySetInnerHTML with React's control instead of direct DOM manipulation
        <div 
          className="mermaid-svg-container print:block print:!visible print:!opacity-100"
          dangerouslySetInnerHTML={{ __html: svgContent }} 
        />
      ) : null}
    </div>
  );
};

export default MermaidDiagram;
