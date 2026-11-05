import type { LayoutTemplate } from '@busyfrnd/shared';

/** Tiny wireframe of a template: shows its structure + palette at a glance. */
export function LayoutThumb({ tpl }: { tpl: Pick<LayoutTemplate, 'theme' | 'sections'> }) {
  const { theme: th, sections } = tpl;
  const block = (type: string, i: number) => {
    switch (type) {
      case 'hero': return <div key={i} className="h-9 rounded-lg" style={{ background: `linear-gradient(135deg, ${th.primary}, ${th.accent})` }} />;
      case 'banner': return <div key={i} className="h-5 rounded-lg" style={{ background: th.primary }} />;
      case 'categories': return <div key={i} className="flex gap-1">{[0, 1, 2, 3].map((n) => <span key={n} className="h-2.5 flex-1 rounded-full" style={{ background: n ? `${th.text}18` : th.primary }} />)}</div>;
      case 'productGrid': return <div key={i} className="grid grid-cols-3 gap-1">{[0, 1, 2].map((n) => <span key={n} className="h-8 rounded-md" style={{ background: th.surface, boxShadow: `inset 0 0 0 1px ${th.text}14` }}><span className="m-1 block h-4 rounded" style={{ background: `${th.primary}30` }} /></span>)}</div>;
      case 'productList': return <div key={i} className="flex flex-col gap-1">{[0, 1].map((n) => <span key={n} className="flex h-4 items-center gap-1 rounded-md px-1" style={{ background: th.surface, boxShadow: `inset 0 0 0 1px ${th.text}14` }}><span className="h-2.5 w-2.5 rounded" style={{ background: `${th.primary}40` }} /><span className="h-1 flex-1 rounded" style={{ background: `${th.text}22` }} /></span>)}</div>;
      case 'services': return <div key={i} className="flex flex-col gap-1">{[0, 1].map((n) => <span key={n} className="h-3.5 rounded-md" style={{ background: th.surface, boxShadow: `inset 3px 0 0 ${th.accent}, inset 0 0 0 1px ${th.text}14` }} />)}</div>;
      default: return <div key={i} className="h-3 rounded-md" style={{ background: `${th.text}12` }} />;
    }
  };
  return <div className="flex flex-col gap-1.5 rounded-2xl p-2.5" style={{ background: th.background, boxShadow: `inset 0 0 0 1px ${th.text}12` }}>{sections.map((s, i) => block(s.type, i))}</div>;
}
