'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Video, Image, FileVideo, Music } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ExportFormat = 'mp4' | 'webm' | 'gif' | 'png-sequence' | 'jpeg-sequence' | 'audio';

export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';

export type ExportQuality = 'very-low' | 'low' | 'medium' | 'high' | 'very-high' | number;

export interface ExportSettings {
  format: ExportFormat;
  codec?: VideoCodec;
  quality: ExportQuality;
  startFrame?: number;
  endFrame?: number;
  scale?: number;
  fps?: number;
  loop?: boolean; // For GIF
  jpegQuality?: number; // For JPEG sequence
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (settings: ExportSettings) => void;
  defaultSettings?: Partial<ExportSettings>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

const formatOptions: Array<{
  id: ExportFormat;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  codecs?: VideoCodec[];
}> = [
  {
    id: 'mp4',
    label: 'MP4 视频',
    icon: Video,
    description: 'H.264/H.265 编码，最佳兼容性',
    codecs: ['h264', 'h265'],
  },
  {
    id: 'webm',
    label: 'WebM 视频',
    icon: FileVideo,
    description: 'VP8/VP9/AV1 编码，Web 优化',
    codecs: ['vp8', 'vp9', 'av1'],
  },
  {
    id: 'gif',
    label: 'GIF 动画',
    icon: Image,
    description: '动画 GIF，适合短片段',
  },
  {
    id: 'png-sequence',
    label: 'PNG 序列',
    icon: Image,
    description: '无损 PNG 图片序列',
  },
  {
    id: 'jpeg-sequence',
    label: 'JPEG 序列',
    icon: Image,
    description: '有损 JPEG 图片序列',
  },
];

export default function ExportDialog({
  open,
  onOpenChange,
  onExport,
  defaultSettings,
  durationInFrames,
  fps,
  width,
  height,
}: ExportDialogProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    format: defaultSettings?.format || 'mp4',
    codec: defaultSettings?.codec || 'h264',
    quality: defaultSettings?.quality || 'high',
    startFrame: defaultSettings?.startFrame ?? 0,
    endFrame: defaultSettings?.endFrame ?? durationInFrames - 1,
    scale: defaultSettings?.scale ?? 1,
    fps: defaultSettings?.fps ?? fps,
    loop: defaultSettings?.loop ?? true,
    jpegQuality: defaultSettings?.jpegQuality ?? 90,
  });

  const selectedFormat = formatOptions.find(f => f.id === settings.format);
  const duration = durationInFrames / fps;
  const selectedDuration = settings.endFrame && settings.startFrame !== undefined
    ? ((settings.endFrame - settings.startFrame + 1) / fps).toFixed(2)
    : duration.toFixed(2);

  const handleExport = () => {
    onExport(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#252526] border-[#3e3e42]">
        <DialogHeader>
          <DialogTitle className="text-[#cccccc]">导出设置</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 格式选择 */}
          <div>
            <label className="text-sm font-medium text-[#cccccc] mb-3 block">
              导出格式
            </label>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                const isSelected = settings.format === format.id;
                return (
                  <button
                    key={format.id}
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        format: format.id,
                        codec: format.codecs?.[0] || prev.codec,
                      }));
                    }}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-[#007acc] bg-[#007acc]/10'
                        : 'border-[#3e3e42] bg-[#1e1e1e] hover:border-[#007acc]/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-5 h-5', isSelected ? 'text-[#007acc]' : 'text-[#969696]')} />
                      <div className="flex-1">
                        <div className={cn('font-medium', isSelected ? 'text-[#cccccc]' : 'text-[#969696]')}>
                          {format.label}
                        </div>
                        <div className="text-xs text-[#969696] mt-1">
                          {format.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 编码器选择（仅视频格式） */}
          {selectedFormat?.codecs && (
            <div>
              <label className="text-sm font-medium text-[#cccccc] mb-2 block">
                视频编码器
              </label>
              <div className="flex gap-2">
                {selectedFormat.codecs.map((codec) => (
                  <button
                    key={codec}
                    onClick={() => setSettings(prev => ({ ...prev, codec }))}
                    className={cn(
                      'px-4 py-2 rounded text-sm transition-colors',
                      settings.codec === codec
                        ? 'bg-[#007acc] text-white'
                        : 'bg-[#3c3c3c] text-[#cccccc] hover:bg-[#37373d]'
                    )}
                  >
                    {codec.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 质量设置 */}
          {settings.format !== 'gif' && settings.format !== 'png-sequence' && settings.format !== 'jpeg-sequence' && (
            <div>
              <label className="text-sm font-medium text-[#cccccc] mb-2 block">
                质量
              </label>
              <div className="flex gap-2">
                {(['very-low', 'low', 'medium', 'high', 'very-high'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setSettings(prev => ({ ...prev, quality }))}
                    className={cn(
                      'px-4 py-2 rounded text-sm transition-colors',
                      settings.quality === quality
                        ? 'bg-[#007acc] text-white'
                        : 'bg-[#3c3c3c] text-[#cccccc] hover:bg-[#37373d]'
                    )}
                  >
                    {quality === 'very-low' ? '很低' :
                     quality === 'low' ? '低' :
                     quality === 'medium' ? '中' :
                     quality === 'high' ? '高' : '很高'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 时间范围 */}
          <div>
            <label className="text-sm font-medium text-[#cccccc] mb-2 block">
              时间范围
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#969696] mb-1 block">开始帧</label>
                <Input
                  type="number"
                  value={settings.startFrame ?? 0}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    startFrame: Math.max(0, Math.min(parseInt(e.target.value) || 0, durationInFrames - 1)),
                  }))}
                  className="bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc]"
                  min={0}
                  max={durationInFrames - 1}
                />
                <p className="text-xs text-[#969696] mt-1">
                  {(settings.startFrame ?? 0) / fps} 秒
                </p>
              </div>
              <div>
                <label className="text-xs text-[#969696] mb-1 block">结束帧</label>
                <Input
                  type="number"
                  value={settings.endFrame ?? durationInFrames - 1}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    endFrame: Math.min(durationInFrames - 1, Math.max(parseInt(e.target.value) || durationInFrames - 1, 0)),
                  }))}
                  className="bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc]"
                  min={0}
                  max={durationInFrames - 1}
                />
                <p className="text-xs text-[#969696] mt-1">
                  {((settings.endFrame ?? durationInFrames - 1) / fps).toFixed(2)} 秒
                </p>
              </div>
            </div>
            <p className="text-xs text-[#969696] mt-2">
              总时长: {selectedDuration} 秒 ({((settings.endFrame ?? durationInFrames - 1) - (settings.startFrame ?? 0) + 1)} 帧)
            </p>
          </div>

          {/* 分辨率缩放 */}
          {settings.format !== 'gif' && (
            <div>
              <label className="text-sm font-medium text-[#cccccc] mb-2 block">
                分辨率缩放
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={settings.scale ?? 1}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    scale: Math.max(0.1, Math.min(parseFloat(e.target.value) || 1, 2)),
                  }))}
                  className="bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc] w-24"
                  min={0.1}
                  max={2}
                  step={0.1}
                />
                <span className="text-sm text-[#969696]">
                  {Math.round(width * (settings.scale ?? 1))} × {Math.round(height * (settings.scale ?? 1))} px
                </span>
              </div>
            </div>
          )}

          {/* GIF 特定选项 */}
          {settings.format === 'gif' && (
            <div>
              <label className="text-sm font-medium text-[#cccccc] mb-2 block">
                GIF 选项
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-[#cccccc]">
                  <input
                    type="checkbox"
                    checked={settings.loop ?? true}
                    onChange={(e) => setSettings(prev => ({ ...prev, loop: e.target.checked }))}
                    className="rounded"
                  />
                  循环播放
                </label>
              </div>
            </div>
          )}

          {/* JPEG 质量 */}
          {settings.format === 'jpeg-sequence' && (
            <div>
              <label className="text-sm font-medium text-[#cccccc] mb-2 block">
                JPEG 质量 (1-100)
              </label>
              <Input
                type="number"
                value={settings.jpegQuality ?? 90}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  jpegQuality: Math.max(1, Math.min(parseInt(e.target.value) || 90, 100)),
                }))}
                className="bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc] w-32"
                min={1}
                max={100}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-[#3c3c3c] border-[#3e3e42] text-[#cccccc] hover:bg-[#37373d]"
          >
            取消
          </Button>
          <Button
            onClick={handleExport}
            className="bg-[#007acc] hover:bg-[#005a9e] text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            开始导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

