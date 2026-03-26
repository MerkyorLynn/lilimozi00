/**
 * MDW（模型下拉组件）的 React 版本
 * 支持按 provider 分组、自定义输入
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from '../Settings.module.css';

interface ModelWidgetProps {
  providers: Record<string, { models?: string[]; base_url?: string }>;
  value: string;
  onSelect: (modelId: string) => void;
  placeholder?: string;
  lookupModelMeta?: (id: string) => any;
  formatContext?: (n: number) => string;
}

export function ModelWidget({
  providers, value, onSelect,
  placeholder, lookupModelMeta, formatContext,
}: ModelWidgetProps) {
  const t = window.t || ((k: string) => k);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch('');
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const query = search.toLowerCase();

  // Collect all models from all providers
  const allModels = useMemo(() => {
    const models: string[] = [];
    const seen = new Set<string>();
    for (const p of Object.values(providers)) {
      for (const m of (p.models || [])) {
        if (!seen.has(m)) {
          seen.add(m);
          models.push(m);
        }
      }
    }
    return models;
  }, [providers]);

  const handleCustomSubmit = () => {
    const val = customInput.trim();
    if (!val) return;
    onSelect(val);
    setCustomInput('');
    setOpen(false);
  };

  return (
    <div className={styles['mdw']} ref={ref}>
      <button
        className={styles['mdw-trigger']}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        <span className={styles['mdw-value']}>{value || `— ${placeholder || t('settings.api.selectModel')} —`}</span>
        <span className={styles['mdw-arrow']}>▾</span>
      </button>
      <div className={`${styles['mdw-popup']}${open  ? ' ' + styles['open'] : ''}`}>
        <input
          ref={searchRef}
          className={styles['mdw-search']}
          type="text"
          placeholder={t('settings.api.searchModel')}
          spellCheck={false}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className={styles['mdw-options']}>
          {allModels
            .filter(mid => !query || mid.toLowerCase().includes(query))
            .map(mid => {
              const meta = lookupModelMeta?.(mid);
              return (
                <button
                  key={mid}
                  className={`${styles['mdw-option']}${mid === value  ? ' ' + styles['selected'] : ''}`}
                  type="button"
                  onClick={() => { onSelect(mid); setOpen(false); }}
                >
                  <span className={styles['mdw-option-name']}>{mid}</span>
                  {meta?.context && formatContext && (
                    <span className={styles['mdw-option-ctx']}>{formatContext(meta.context)}</span>
                  )}
                </button>
              );
            })
          }
          <div className={styles['mdw-custom-row']}>
            <input
              type="text"
              className={styles['mdw-custom-input']}
              placeholder={t('settings.api.customInput')}
              spellCheck={false}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomSubmit();
                e.stopPropagation();
              }}
            />
            <button
              type="button"
              className={styles['mdw-custom-confirm']}
              onClick={(e) => { e.stopPropagation(); handleCustomSubmit(); }}
            >
              ↵
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
