
'use client';

import React, { useState, useEffect, useMemo, ReactNode } from 'react';

interface TypewriterProps {
  children: ReactNode;
  speed?: number;
}

const Typewriter: React.FC<TypewriterProps> = ({ children, speed = 20 }) => {
  const fullText = useMemo(() => {
    let text = '';
    React.Children.forEach(children, (child) => {
      if (typeof child === 'string') {
        text += child;
      } else if (React.isValidElement(child)) {
        // A simple way to extract text from elements.
        // This won't be perfect for all cases but works for basic text elements.
        const childText = (child.props.children as ReactNode)?.toString() || '';
        text += childText;
      }
    });
    return text;
  }, [children]);

  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [children]);

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + fullText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, speed, fullText]);

  // A more robust way to render would be to clone children and pass animated text,
  // but for a simple text reveal, this is more straightforward.
  // This approach replaces the original content with a simple animated div.
  // For preserving structure, a more complex recursive approach would be needed.
  
  // To preserve basic structure, we can do this:
  const renderAnimatedChildren = (nodes: ReactNode, text_to_render: string): ReactNode => {
      let char_index = 0;
      
      return React.Children.map(nodes, (node) => {
          if (typeof node === 'string') {
              const part = node.substring(0, text_to_render.length - char_index);
              char_index += node.length;
              return part;
          }

          if (React.isValidElement(node)) {
              // @ts-ignore
              const children = node.props.children;
              const sub_text_to_render = text_to_render.substring(char_index);
              let rendered_children;
              
              if (children) {
                rendered_children = renderAnimatedChildren(children, sub_text_to_render);
                // @ts-ignore
                const child_text_length = (React.Children.toArray(children).join('')).length;
                char_index += child_text_length;
              } else {
                rendered_children = null;
              }
              
              const text_of_node = (React.Children.toArray(children).join('') || '').length;
              if (text_to_render.length > char_index - text_of_node) {
                 return React.cloneElement(node as React.ReactElement, {}, rendered_children);
              }
          }
          return null;
      });
  };

  return <>{renderAnimatedChildren(children, displayedText)}</>;
};

export default Typewriter;
