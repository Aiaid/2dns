import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import RootLayout, { generateMetadata, generateStaticParams } from '../layout'

// 模拟模块
jest.mock('../dictionaries', () => ({
  getDictionary: jest.fn().mockImplementation((locale) => 
    Promise.resolve({
      metadata: {
        title: `${locale} title`,
        description: `${locale} description`
      }
    })
  )
}))

// 模拟 next/font
jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-font' })
}))

// 模拟 ThemeProvider 组件
jest.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>
}))

describe('Layout Component', () => {
  test('should generate correct static params', async () => {
    const params = await generateStaticParams();
    expect(params).toEqual([
      { lang: 'en' },
      { lang: 'zh' }
    ]);
  });

  test('should generate correct metadata for en', async () => {
    const metadata = await generateMetadata({ params: { lang: 'en' } });
    expect(metadata).toEqual({
      title: 'en title',
      description: 'en description',
      metadataBase: expect.any(URL)
    });
  });

  test('should generate correct metadata for zh', async () => {
    const metadata = await generateMetadata({ params: { lang: 'zh' } });
    expect(metadata).toEqual({
      title: 'zh title',
      description: 'zh description',
      metadataBase: expect.any(URL)
    });
  });

  test('should provide fallback metadata when error occurs', async () => {
    const { getDictionary } = require('../dictionaries');
    getDictionary.mockImplementationOnce(() => Promise.reject(new Error('Dictionary error')));
    
    const metadata = await generateMetadata({ params: { lang: 'en' } });
    expect(metadata).toEqual({
      title: '2DNS',
      description: '2DNS Application'
    });
  });

  test('should render layout component without crashing', () => {
    const { container } = render(
      <RootLayout params={{ lang: 'zh' }}>
        <div>测试内容</div>
      </RootLayout>
    );
    
    // 检查渲染是否成功
    expect(container).toBeDefined();
  });
}); 