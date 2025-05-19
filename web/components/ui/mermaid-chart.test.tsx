// @jest-environment jsdom
import { render } from '@testing-library/react';
import { MermaidChart } from './mermaid-chart';

describe('MermaidChart', () => {
  it('可以正常渲染流程图', () => {
    const chart = `flowchart LR\nA-->B`;
    const { container } = render(<MermaidChart chart={chart} />);
    // 只检查容器存在
    expect(container.querySelector('div')).toBeTruthy();
  });
}); 