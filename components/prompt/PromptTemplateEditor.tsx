'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePromptTemplateStore } from '@/lib/store/prompt-template-store';
import { useAssetsStore } from '@/lib/store/assets-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Send,
  Image as ImageIcon,
  Music,
  Video,
  Check,
} from 'lucide-react';

export default function PromptTemplateEditor() {
  const {
    templates,
    currentTemplateId,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getCurrentTemplate,
    setCurrentTemplate,
    insertAssetReference,
    getRenderedPrompt,
  } = usePromptTemplateStore();
  const { assets } = useAssetsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const currentTemplate = getCurrentTemplate();

  useEffect(() => {
    if (currentTemplate) {
      setTemplateName(currentTemplate.name);
      setTemplateContent(currentTemplate.content);
    } else {
      setTemplateName('');
      setTemplateContent('');
    }
  }, [currentTemplate]);

  const handleSave = useCallback(() => {
    if (!templateName.trim()) {
      alert('请输入模板名称');
      return;
    }

    if (currentTemplate) {
      updateTemplate(currentTemplate.id, templateContent);
    } else {
      createTemplate(templateName, templateContent);
    }
  }, [templateName, templateContent, currentTemplate, createTemplate, updateTemplate]);

  const handleCopy = useCallback(() => {
    const rendered = getRenderedPrompt();
    navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getRenderedPrompt]);

  const handleSendToAI = useCallback(() => {
    const rendered = getRenderedPrompt();
    // 这里可以集成 AI API
    // 暂时使用 alert 提示
    alert(`发送给 AI:\n\n${rendered}`);
  }, [getRenderedPrompt]);

  const handleInsertAsset = useCallback(
    (assetId: string, assetName: string) => {
      insertAssetReference(assetId, assetName);
      setShowAssetPicker(false);
    },
    [insertAssetReference]
  );

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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-300">提示词模板</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCurrentTemplate(null);
              setIsOpen(true);
            }}
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            新建
          </Button>
        </div>
        {currentTemplate && (
          <p className="text-xs text-gray-500">{currentTemplate.name}</p>
        )}
      </div>

      {/* 模板列表 */}
      <div className="flex-1 overflow-auto p-4">
        {templates.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">暂无模板</p>
            <p className="text-xs mt-1">创建模板后可以引用资源并发送给 AI</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`bg-gray-900 rounded-lg p-3 border cursor-pointer transition-colors ${
                  currentTemplateId === template.id
                    ? 'border-blue-500'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
                onClick={() => {
                  setCurrentTemplate(template.id);
                  setIsOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-300">{template.name}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除这个模板吗？')) {
                        deleteTemplate(template.id);
                      }
                    }}
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

      {/* 编辑对话框 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentTemplate ? '编辑模板' : '新建模板'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                模板名称
              </label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="输入模板名称"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">模板内容</label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAssetPicker(!showAssetPicker)}
                    className="h-7 text-xs"
                  >
                    插入资源
                  </Button>
                </div>
              </div>
              {showAssetPicker && (
                <div className="mb-2 p-3 bg-gray-800 rounded border border-gray-700 max-h-40 overflow-auto">
                  {assets.length === 0 ? (
                    <p className="text-xs text-gray-500">暂无资源，请先上传</p>
                  ) : (
                    <div className="space-y-1">
                      {assets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => handleInsertAsset(asset.id, asset.name)}
                          className="w-full text-left px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded flex items-center gap-2"
                        >
                          {getAssetIcon(asset.type)}
                          {asset.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder="输入提示词内容，可以使用 {{asset:assetId:assetName}} 引用资源"
                className="w-full h-64 p-3 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                提示：使用 {'{{asset:assetId:assetName}}'} 格式引用资源
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleSave} className="flex-1">
                保存
              </Button>
              <Button
                variant="outline"
                onClick={handleCopy}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    复制提示词
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendToAI}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                发送给 AI
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

