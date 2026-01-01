'use client';

import { useCallback, useState } from 'react';
import { useAssetsStore } from '@/lib/store/assets-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon, Music, Video, Trash2, Copy, Check } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { formatBytes } from '@/lib/utils/format';

export default function AssetManager() {
  const { assets, addAsset, removeAsset, getAssetsStats } = useAssetsStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          await addAsset(file);
        } catch (error) {
          console.error('Failed to add asset:', error);
          alert(`上传失败: ${file.name}`);
        }
      }
    },
    [addAsset]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi'],
    },
    multiple: true,
  });

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm('确定要删除这个资源吗？')) {
        await removeAsset(id);
      }
    },
    [removeAsset]
  );

  const handleCopyReference = useCallback((id: string) => {
    const reference = `staticFile('${id}')`;
    navigator.clipboard.writeText(reference);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const stats = getAssetsStats();

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-medium text-gray-300 mb-2">资源管理</h3>
        <div className="text-xs text-gray-500">
          总计: {stats.total} 个文件 | {formatBytes(stats.totalSize)}
        </div>
      </div>

      {/* 上传区域 */}
      <div className="p-4 border-b border-gray-800">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-400">
            {isDragActive ? '松开以上传文件' : '拖拽文件到此处或点击上传'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            支持图片、音频、视频文件
          </p>
        </div>
      </div>

      {/* 资源列表 */}
      <div className="flex-1 overflow-auto p-4">
        {assets.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">暂无资源</p>
            <p className="text-xs mt-1">上传文件后，可以在代码中使用 staticFile() 引用</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-gray-900 rounded-lg p-3 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* 预览 */}
                  <div className="flex-shrink-0">
                    {asset.type === 'image' ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center">
                        {getAssetIcon(asset.type)}
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getAssetIcon(asset.type)}
                      <p className="text-sm font-medium text-gray-300 truncate">
                        {asset.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatBytes(asset.size)} | {asset.type}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyReference(asset.id)}
                        className="h-6 text-xs"
                      >
                        {copiedId === asset.id ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            复制引用
                          </>
                        )}
                      </Button>
                      <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                        staticFile('{asset.id}')
                      </code>
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(asset.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

