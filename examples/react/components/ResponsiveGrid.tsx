/**
 * ResponsiveGrid Component
 * React component demonstrating ProteusJS container queries and adaptive grid
 */

import React, { useRef, useEffect } from 'react';
import { useContainerBreakpoints, useProteus } from '../ProteusProvider';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  minColumnWidth?: number;
  maxColumns?: number;
  gap?: number;
  className?: string;
  onBreakpointChange?: (breakpoint: string, columns: number) => void;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minColumnWidth = 250,
  maxColumns = 4,
  gap = 16,
  className = '',
  onBreakpointChange
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const { isInitialized } = useProteus();

  // Define breakpoints based on container width
  const breakpoints = {
    xs: `${minColumnWidth}px`,
    sm: `${minColumnWidth * 2 + gap}px`,
    md: `${minColumnWidth * 3 + gap * 2}px`,
    lg: `${minColumnWidth * 4 + gap * 3}px`
  };

  // Use container breakpoints hook
  const currentBreakpoint = useContainerBreakpoints(
    gridRef,
    breakpoints,
    (breakpoint, data) => {
      if (gridRef.current) {
        updateGridLayout(breakpoint, data.width);
      }
      
      if (onBreakpointChange) {
        const columns = calculateColumns(data.width);
        onBreakpointChange(breakpoint, columns);
      }
    }
  );

  // Calculate number of columns based on container width
  const calculateColumns = (width: number): number => {
    const availableWidth = width - gap;
    const columnsFromWidth = Math.floor(availableWidth / (minColumnWidth + gap));
    return Math.min(Math.max(1, columnsFromWidth), maxColumns);
  };

  // Update grid layout based on breakpoint
  const updateGridLayout = (breakpoint: string, width: number) => {
    if (!gridRef.current) return;

    const columns = calculateColumns(width);
    const grid = gridRef.current;

    // Apply CSS Grid properties
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    grid.style.gap = `${gap}px`;
    grid.style.width = '100%';

    // Add breakpoint class for styling
    grid.className = grid.className.replace(/proteus-\w+/g, '');
    grid.classList.add(`proteus-${breakpoint}`);

    // Add custom CSS properties for advanced styling
    grid.style.setProperty('--proteus-columns', columns.toString());
    grid.style.setProperty('--proteus-gap', `${gap}px`);
    grid.style.setProperty('--proteus-breakpoint', breakpoint);
  };

  // Initialize grid layout
  useEffect(() => {
    if (isInitialized && gridRef.current) {
      const width = gridRef.current.getBoundingClientRect().width;
      updateGridLayout(currentBreakpoint || 'xs', width);
    }
  }, [isInitialized, currentBreakpoint]);

  return (
    <div
      ref={gridRef}
      className={`proteus-responsive-grid ${className}`}
      data-proteus-component="responsive-grid"
      data-proteus-breakpoint={currentBreakpoint}
      style={{
        display: 'grid',
        gap: `${gap}px`,
        width: '100%'
      }}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveGridItem Component
 * Individual grid item with responsive behavior
 */
export interface ResponsiveGridItemProps {
  children: React.ReactNode;
  span?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  className?: string;
}

export const ResponsiveGridItem: React.FC<ResponsiveGridItemProps> = ({
  children,
  span = 1,
  className = ''
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!itemRef.current) return;

    const item = itemRef.current;
    
    // Handle responsive span
    if (typeof span === 'object') {
      // Set CSS custom properties for responsive spans
      Object.entries(span).forEach(([breakpoint, spanValue]) => {
        item.style.setProperty(`--proteus-span-${breakpoint}`, spanValue?.toString() || '1');
      });
      
      // Add CSS for responsive behavior
      item.style.gridColumn = 'span var(--proteus-span-xs, 1)';
    } else {
      item.style.gridColumn = `span ${span}`;
    }
  }, [span]);

  return (
    <div
      ref={itemRef}
      className={`proteus-grid-item ${className}`}
      data-proteus-component="grid-item"
    >
      {children}
    </div>
  );
};

/**
 * Example usage component
 */
export const ResponsiveGridExample: React.FC = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState('');
  const [columnCount, setColumnCount] = React.useState(1);

  const handleBreakpointChange = (breakpoint: string, columns: number) => {
    setCurrentBreakpoint(breakpoint);
    setColumnCount(columns);
  };

  const products = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: `$${(i + 1) * 10}`,
    image: `https://picsum.photos/300/200?random=${i + 1}`
  }));

  return (
    <div className="responsive-grid-example">
      <div className="grid-info" style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Responsive Grid Demo</h3>
        <p>Current Breakpoint: <strong>{currentBreakpoint}</strong></p>
        <p>Columns: <strong>{columnCount}</strong></p>
        <p>Resize the container to see the grid adapt!</p>
      </div>

      <ResponsiveGrid
        minColumnWidth={200}
        maxColumns={4}
        gap={16}
        onBreakpointChange={handleBreakpointChange}
        className="product-grid"
      >
        {products.map((product) => (
          <ResponsiveGridItem key={product.id} className="product-card">
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              background: 'white',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  marginBottom: '0.5rem'
                }}
              />
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                {product.name}
              </h4>
              <p style={{ 
                margin: '0',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#007bff',
                marginTop: 'auto'
              }}>
                {product.price}
              </p>
            </div>
          </ResponsiveGridItem>
        ))}
      </ResponsiveGrid>

      <style jsx>{`
        .product-grid {
          container-type: inline-size;
        }

        .product-card {
          transition: transform 0.2s ease;
        }

        .product-card:hover {
          transform: translateY(-2px);
        }

        /* Responsive spans using CSS custom properties */
        @container (min-width: 400px) {
          .product-card:nth-child(1) {
            grid-column: span 2;
          }
        }

        @container (min-width: 600px) {
          .product-card:nth-child(1) {
            grid-column: span 1;
          }
          .product-card:nth-child(3n) {
            grid-column: span 2;
          }
        }
      `}</style>
    </div>
  );
};

export default ResponsiveGrid;
