'use client';

import { useState } from 'react';
import { FileText, Star, Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useCodeStore } from '@/lib/store/code-store';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  featured: boolean;
}

export default function PromptTemplate() {
  const { setCode } = useCodeStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const templates: Template[] = [
    {
      id: '1',
      name: '文字淡入动画',
      description: '经典的文字淡入淡出效果',
      category: '文字动画',
      featured: true,
      code: `export const MyVideo = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1
        style={{
          fontSize: 100,
          color: '#fff',
          opacity,
        }}
      >
        Hello Remotion!
      </h1>
    </AbsoluteFill>
  );
};`,
    },
    {
      id: '2',
      name: '缩放效果',
      description: '元素从小到大的缩放动画',
      category: '基础动画',
      featured: true,
      code: `export const MyVideo = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1e1e1e',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 300,
          height: 300,
          backgroundColor: '#007acc',
          borderRadius: 20,
          transform: \`scale(\${scale})\`,
        }}
      />
    </AbsoluteFill>
  );
};`,
    },
    {
      id: '3',
      name: '多段序列',
      description: '使用 Sequence 创建多段动画',
      category: '高级技巧',
      featured: false,
      code: `export const MyVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Sequence from={0} durationInFrames={60}>
        <Title text="第一段" />
      </Sequence>
      <Sequence from={60} durationInFrames={60}>
        <Title text="第二段" />
      </Sequence>
      <Sequence from={120} durationInFrames={60}>
        <Title text="第三段" />
      </Sequence>
    </AbsoluteFill>
  );
};

const Title = ({ text }: { text: string }) => (
  <AbsoluteFill
    style={{
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <h1 style={{ fontSize: 80, color: '#fff' }}>{text}</h1>
  </AbsoluteFill>
);`,
    },
    {
      id: '4',
      name: '弹簧动画',
      description: '使用 spring 创建自然的弹性效果',
      category: '基础动画',
      featured: true,
      code: `export const MyVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 200,
          height: 200,
          backgroundColor: '#007acc',
          borderRadius: '50%',
          transform: \`scale(\${scale})\`,
        }}
      />
    </AbsoluteFill>
  );
};`,
    },
  ];

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleUseTemplate = (code: string) => {
    setCode(code);
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
      {/* 标题栏 */}
      <div className="flex-shrink-0 h-12 bg-[#2d2d30] border-b border-[#3e3e42] px-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#007acc]" />
        <span className="text-sm font-medium text-[#cccccc]">提示词模板</span>
      </div>

      {/* 分类筛选 */}
      <div className="flex-shrink-0 p-4 border-b border-[#3e3e42]">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'h-8 px-3 rounded text-xs transition-colors',
                selectedCategory === category
                  ? 'bg-[#007acc] text-white'
                  : 'bg-[#2d2d30] text-[#969696] hover:bg-[#37373d] hover:text-[#cccccc]'
              )}
            >
              {category === 'all' ? '全部' : category}
            </button>
          ))}
        </div>
      </div>

      {/* 模板列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="group p-4 bg-[#2d2d30] hover:bg-[#37373d] rounded border border-[#3e3e42] transition-colors"
          >
            {/* 标题和标签 */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[#cccccc]">
                  {template.name}
                </h3>
                {template.featured && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#007acc]/20 rounded text-xs text-[#007acc]">
                    <Star className="w-3 h-3 fill-current" />
                    <span>推荐</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-[#969696] bg-[#1e1e1e] px-2 py-1 rounded">
                {template.category}
              </span>
            </div>

            {/* 描述 */}
            <p className="text-xs text-[#969696] mb-3">
              {template.description}
            </p>

            {/* 代码预览 */}
            <div className="bg-[#1e1e1e] rounded p-3 mb-3">
              <pre className="text-xs text-[#cccccc] font-mono overflow-x-auto">
                <code className="line-clamp-4">{template.code}</code>
              </pre>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={() => handleUseTemplate(template.code)}
                className="flex-1 h-8 flex items-center justify-center gap-2 rounded bg-[#007acc] hover:bg-[#005a9e] text-white text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>使用模板</span>
              </button>
              <button
                onClick={() => handleCopy(template.code, template.id)}
                className="h-8 px-3 flex items-center justify-center gap-1.5 rounded bg-[#3e3e42] hover:bg-[#4e4e52] text-[#cccccc] text-xs transition-colors"
              >
                {copiedId === template.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="flex-shrink-0 h-10 border-t border-[#3e3e42] px-4 flex items-center text-xs text-[#969696]">
        <span>{filteredTemplates.length} 个模板</span>
      </div>
    </div>
  );
}

