'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Upload, Download, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useUserQuery } from '@/hooks/queries/useUserQuery';
import { VOLCENGINE_VOICES } from '@/lib/volcengine/tts-client';

type AIControlState = {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  personality: string;
  goals: string;
  memoryEnabled: boolean;
  memoryNotes: string;
  ttsVoiceId?: string;
  voiceSamples: string[]; // URLs or keys to samples (future server wiring)
  trainingDocs: { name: string; url?: string; content?: string }[];
};

const DEFAULT_STATE: AIControlState = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  topP: 1,
  maxTokens: 1024,
  personality: '温暖、积极、专业，像一位可靠的私人助理。',
  goals: '帮助我更高效地沟通、创作内容、管理待办、学习与成长。',
  memoryEnabled: true,
  memoryNotes: '',
  ttsVoiceId: undefined,
  voiceSamples: [],
  trainingDocs: [],
};

export default function AIControlPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: user } = useUserQuery(session?.user?.id);

  const [state, setState] = useState<AIControlState>(DEFAULT_STATE);
  const voiceOptions = useMemo(() => Object.entries(VOLCENGINE_VOICES), []);

  // Load saved config from localStorage (placeholder before server wiring)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai_control_config');
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
    } catch (e) {
      // ignore
    }
  }, []);

  const save = () => {
    localStorage.setItem('ai_control_config', JSON.stringify(state));
    alert('已保存（本地存储）。后续可接入后端持久化。');
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-control-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = async (file: File) => {
    const text = await file.text();
    setState({ ...DEFAULT_STATE, ...JSON.parse(text) });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-4">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur">
        <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-muted" title="返回">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">AI 控制中心</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportConfig} className="rounded-lg p-2 hover:bg-muted" title="导出配置">
            <Download className="h-5 w-5" />
          </button>
          <label className="rounded-lg p-2 hover:bg-muted" title="导入配置">
            <Upload className="h-5 w-5" />
            <input type="file" accept="application/json" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importConfig(f);
            }} />
          </label>
          <button onClick={save} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            <Save className="mr-1 inline h-4 w-4" /> 保存
          </button>
        </div>
      </div>

      {/* Model & Params */}
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-base font-semibold">模型与参数</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">主模型</label>
            <select
              value={state.model}
              onChange={(e) => setState((s) => ({ ...s, model: e.target.value }))}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="qwen-2.5">Qwen 2.5</option>
              <option value="llama-3.1">Llama 3.1</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">温度（创造力）</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.temperature}
              onChange={(e) => setState((s) => ({ ...s, temperature: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">{state.temperature.toFixed(2)}</div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Top P</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.topP}
              onChange={(e) => setState((s) => ({ ...s, topP: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">{state.topP.toFixed(2)}</div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">最大输出 Tokens</label>
            <input
              type="number"
              value={state.maxTokens}
              onChange={(e) => setState((s) => ({ ...s, maxTokens: Number(e.target.value) }))}
              className="w-full rounded-md border px-3 py-2"
              min={128}
              max={8192}
            />
          </div>
        </div>
      </section>

      {/* Personality */}
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-base font-semibold">性格与目标</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">性格设定（System Prompt）</label>
            <textarea
              value={state.personality}
              onChange={(e) => setState((s) => ({ ...s, personality: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">长期目标</label>
            <textarea
              value={state.goals}
              onChange={(e) => setState((s) => ({ ...s, goals: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </section>

      {/* Memory */}
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-base font-semibold">记忆系统</h2>
        <div className="flex items-center gap-3">
          <input
            id="memoryEnabled"
            type="checkbox"
            checked={state.memoryEnabled}
            onChange={(e) => setState((s) => ({ ...s, memoryEnabled: e.target.checked }))}
          />
          <label htmlFor="memoryEnabled">启用记忆（允许助理记住偏好、背景信息等）</label>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">重要记忆（手动添加）</label>
          <textarea
            value={state.memoryNotes}
            onChange={(e) => setState((s) => ({ ...s, memoryNotes: e.target.value }))}
            rows={3}
            className="w-full resize-none rounded-md border px-3 py-2"
            placeholder="例如：我投资偏好稳健、每周三晚上需要健身、对美式英语更熟悉…"
          />
        </div>
      </section>

      {/* Voice (TTS) */}
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-base font-semibold">语音与声音训练</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">TTS 声线</label>
            <select
              value={state.ttsVoiceId || ''}
              onChange={(e) => setState((s) => ({ ...s, ttsVoiceId: e.target.value || undefined }))}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">默认</option>
              {voiceOptions.map(([key, id]) => (
                <option key={key} value={id as string}>{key}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">上传语音样本（占位）</label>
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => {
                const names = Array.from(e.target.files || []).map((f) => f.name);
                setState((s) => ({ ...s, voiceSamples: [...s.voiceSamples, ...names] }));
              }}
              className="w-full"
            />
            {state.voiceSamples.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">已添加样本：{state.voiceSamples.join(', ')}</div>
            )}
          </div>
        </div>
      </section>

      {/* Training data */}
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-base font-semibold">训练数据</h2>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">添加链接</label>
            <AddRow
              placeholder="https://example.com/knowledge"
              onAdd={(url) => setState((s) => ({ ...s, trainingDocs: [...s.trainingDocs, { name: url, url }] }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">添加备注/文档片段</label>
            <AddRow
              placeholder="在这里粘贴文本片段"
              onAdd={(content) => setState((s) => ({ ...s, trainingDocs: [...s.trainingDocs, { name: `片段${s.trainingDocs.length + 1}`, content }] }))}
            />
          </div>
          {state.trainingDocs.length > 0 && (
            <ul className="divide-y rounded-md border">
              {state.trainingDocs.map((d, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="truncate">{d.url || d.name}</span>
                  <button
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    onClick={() => setState((s) => ({ ...s, trainingDocs: s.trainingDocs.filter((_, idx) => idx !== i) }))}
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="pb-20" />
    </div>
  );
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border px-3 py-2"
      />
      <button
        onClick={() => {
          if (!value.trim()) return;
          onAdd(value.trim());
          setValue('');
        }}
        className="rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90"
      >
        添加
      </button>
    </div>
  );
}

