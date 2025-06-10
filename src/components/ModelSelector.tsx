'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AIModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Most capable model, best for complex tasks'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient for most tasks'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Advanced model with strong reasoning capabilities'
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and efficiency'
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    description: 'Open source model with strong performance'
  },
  {
    id: 'llama-2-70b',
    name: 'Llama 2 70B',
    provider: 'Meta',
    description: 'Open source model with good performance'
  }
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  // Find the selected model object to display its name
  const currentModel = AVAILABLE_MODELS.find(model => model.id === selectedModel);

  return (
    <div className="flex flex-col gap-2">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-full bg-background text-primary border-primary/20 hover:border-primary/50">
          <SelectValue placeholder="Select a model">
            {currentModel ? currentModel.name : "Select a model"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background text-primary border-primary/20">
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id} className="hover:bg-primary/10 data-[state=checked]:bg-primary/20">
              <div className="flex flex-col">
                <span className="font-medium text-primary">{model.name}</span>
                <span className="text-xs text-muted-foreground">
                  {model.provider} - {model.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 