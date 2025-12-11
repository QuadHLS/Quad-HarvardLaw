import * as React from 'react';

/**
 * Native React Slot component - replacement for @radix-ui/react-slot
 * 
 * Merges props and refs from parent to child component.
 * This is a lightweight alternative that doesn't require Radix UI.
 */
const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & {
    asChild?: boolean;
  }
>((props, ref) => {
  const { asChild, children, ...slotProps } = props;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...slotProps,
      ...(children.props as any),
      ref: (node: HTMLElement) => {
        // Merge refs
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
        
        // Call child's ref if it exists
        const childRef = (children as any).ref;
        if (typeof childRef === 'function') {
          childRef(node);
        } else if (childRef) {
          childRef.current = node;
        }
      },
    } as any);
  }

  return React.createElement('div', { ...slotProps, ref }, children);
});

Slot.displayName = 'Slot';

export { Slot };
