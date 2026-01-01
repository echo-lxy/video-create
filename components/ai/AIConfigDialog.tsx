'use client';

import { useState } from 'react';
import { useAIConfigStore, AIProvider } from '@/lib/store/ai-config-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AIConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AIConfigDialog({
  open,
  onOpenChange,
}: AIConfigDialogProps) {
  const { providers, activeProviderId, addProvider, setActiveProvider, removeProvider } =
    useAIConfigStore();
  const [newProvider, setNewProvider] = useState<Partial<AIProvider>>({
    name: '',
    apiKey: '',
    model: 'gpt-4',
  });

  if (!open) return null;

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.apiKey || !newProvider.model) {
      alert('Please fill in all fields');
      return;
    }

    addProvider({
      id: uuidv4(),
      name: newProvider.name,
      apiKey: newProvider.apiKey,
      model: newProvider.model,
      baseUrl: newProvider.baseUrl,
    });

    setNewProvider({ name: '', apiKey: '', model: 'gpt-4' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-gray-100">
            AI Provider Configuration
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Existing Providers */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Configured Providers
            </h3>
            {providers.length === 0 ? (
              <p className="text-sm text-gray-500">No providers configured</p>
            ) : (
              <div className="space-y-2">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      provider.id === activeProviderId
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-800'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">
                        {provider.name}
                      </p>
                      <p className="text-xs text-gray-500">{provider.model}</p>
                    </div>
                    <div className="flex gap-2">
                      {provider.id === activeProviderId ? (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          <Check className="w-3 h-3" />
                          Active
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveProvider(provider.id)}
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeProvider(provider.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Provider */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Add New Provider
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Provider Name
                </label>
                <Input
                  placeholder="e.g., OpenAI GPT-4"
                  value={newProvider.name || ''}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  API Key
                </label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={newProvider.apiKey || ''}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, apiKey: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Model
                </label>
                <Input
                  placeholder="gpt-4, claude-3, etc."
                  value={newProvider.model || ''}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, model: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Base URL (Optional)
                </label>
                <Input
                  placeholder="https://api.openai.com/v1"
                  value={newProvider.baseUrl || ''}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, baseUrl: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleAddProvider} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Provider
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

