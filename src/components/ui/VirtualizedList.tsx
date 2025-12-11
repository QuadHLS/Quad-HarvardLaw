import React from 'react';
import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  itemHeight?: number;
  height?: number;
  width?: string | number;
  overscanCount?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * VirtualizedList - Renders only visible items for performance
 * 
 * Use this for long lists (messages, posts, outlines) to improve performance
 * Only renders items that are currently visible in the viewport
 * 
 * Uses react-window v2 API with List component
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 100,
  height = 400,
  width = '100%',
  overscanCount = 5,
  className,
  style: customStyle,
}: VirtualizedListProps<T>) {
  // Row component receives items and renderItem via rowProps
  const Row = ({ index, style, items: rowItems, renderItem: rowRenderItem }: RowComponentProps<{ items: T[]; renderItem: (item: T, index: number) => React.ReactElement }>) => {
    const item = rowItems[index];
    if (!item) {
      return <div style={style} />;
    }

    return (
      <div style={style}>
        {rowRenderItem(item, index)}
      </div>
    );
  };

  return (
    <List
      defaultHeight={height}
      rowCount={items.length}
      rowHeight={itemHeight}
      rowComponent={Row}
      rowProps={{ items, renderItem }}
      overscanCount={overscanCount}
      className={className}
      style={{
        width: typeof width === 'string' ? width : (typeof width === 'number' ? `${width}px` : '100%'),
        ...customStyle,
      }}
    />
  );
}

