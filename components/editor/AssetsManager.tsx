'use client';

import { useState, useRef } from 'react';
import { Upload, FileVideo, FileAudio, FileImage, Folder, Trash2, Download, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAssetsStore } from '@/lib/store/assets-store';

export default function AssetsManager() {
  const { assets, addAsset, removeAsset, searchAssets } = useAssetsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return FileVideo;
      case 'audio':
        return FileAudio;
      case 'image':
        return FileImage;
      default:
        return Folder;
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      // 判断文件类型
      let type: 'video' | 'audio' | 'image' = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('image/')) type = 'image';
      else {
        alert(`不支持的文件类型: ${file.type}`);
        continue;
      }

      // 创建 Blob URL
      const url = URL.createObjectURL(file);

      // 添加到 store
      addAsset({
        name: file.name,
        type,
        size: file.size,
        url,
        description: `上传于 ${new Date().toLocaleString()}`,
        tags: [],
      });
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个资源吗？')) {
      removeAsset(id);
    }
  };

  const handleCopyPath = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('路径已复制到剪贴板');
  };

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredAssets = searchAssets(searchQuery, selectedType);

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
      {/* 标题栏 */}
      <div className="flex-shrink-0 h-12 bg-[#2d2d30] border-b border-[#3e3e42] px-4 flex items-center gap-2">
        <Folder className="w-4 h-4 text-[#007acc]" />
        <span className="text-sm font-medium text-[#cccccc]">资源管理</span>
        <div className="flex-1" />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={handleUpload}
          className="h-8 px-3 flex items-center gap-2 rounded bg-[#007acc] hover:bg-[#005a9e] text-white text-xs transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>上传</span>
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex-shrink-0 p-4 space-y-3 border-b border-[#3e3e42]">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969696]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索资源..."
            className="w-full h-9 pl-9 pr-3 bg-[#3c3c3c] border border-[#3e3e42] rounded text-[#cccccc] placeholder-[#969696] text-sm focus:outline-none focus:border-[#007acc]"
          />
        </div>

        {/* 类型筛选 */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: '全部', icon: Folder },
            { id: 'video', label: '视频', icon: FileVideo },
            { id: 'audio', label: '音频', icon: FileAudio },
            { id: 'image', label: '图片', icon: FileImage },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedType(id as any)}
              className={cn(
                'flex-1 h-8 flex items-center justify-center gap-1.5 rounded text-xs transition-colors',
                selectedType === id
                  ? 'bg-[#007acc] text-white'
                  : 'bg-[#2d2d30] text-[#969696] hover:bg-[#37373d] hover:text-[#cccccc]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 资源列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Folder className="w-12 h-12 text-[#3e3e42] mb-3" />
            <p className="text-sm text-[#969696] mb-1">暂无资源</p>
            <p className="text-xs text-[#5a5a5a]">
              {searchQuery ? '未找到匹配的资源' : '点击上传按钮添加资源'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map((asset) => {
              const Icon = getIcon(asset.type);
              return (
                <div
                  key={asset.id}
                  className="group p-3 bg-[#2d2d30] hover:bg-[#37373d] rounded border border-[#3e3e42] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* 图标 */}
                    <div className="w-10 h-10 flex items-center justify-center bg-[#1e1e1e] rounded flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#007acc]" />
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#cccccc] font-medium truncate">
                        {asset.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#969696]">{formatSize(asset.size)}</span>
                        <span className="text-xs text-[#5a5a5a]">·</span>
                        <span className="text-xs text-[#969696]">
                          {asset.uploadedAt instanceof Date 
                            ? asset.uploadedAt.toLocaleDateString()
                            : new Date(asset.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#5a5a5a] font-mono mt-1 truncate">
                        {asset.url}
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyPath(asset.url)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#3e3e42] text-[#cccccc] transition-colors"
                        title="复制路径"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-900/50 text-[#cccccc] hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="flex-shrink-0 h-10 border-t border-[#3e3e42] px-4 flex items-center justify-between text-xs text-[#969696]">
        <span>{filteredAssets.length} 个资源</span>
        <span>
          总大小: {formatSize(assets.reduce((sum, a) => sum + a.size, 0))}
        </span>
      </div>
    </div>
  );
}

