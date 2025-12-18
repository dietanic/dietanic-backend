import React, { useEffect } from 'react';

interface JSONLDProps {
  data: Record<string, any>;
}

/**
 * Injects structured JSON-LD data into the document head.
 * This allows AI engines (Gemini, ChatGPT) to parse our data as "facts" rather than just text.
 */
export const JSONLD: React.FC<JSONLDProps> = ({ data }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Ignore removal errors if node is gone
      }
    };
  }, [data]);

  return null;
};