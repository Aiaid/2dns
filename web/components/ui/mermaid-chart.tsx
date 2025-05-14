'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const Mermaid = dynamic(() => import('react-mermaid2'), { ssr: false });

interface MermaidChartProps {
  chart: string;
}

export const MermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
  return (
    <div className="w-full">
      <Mermaid chart={chart} />
    </div>
  );
};
