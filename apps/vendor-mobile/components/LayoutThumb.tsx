import { View } from 'react-native';
import type { LayoutTemplate } from '@busyfrnd/shared';

/** Tiny wireframe of a template: structure + palette at a glance. */
export function LayoutThumb({ tpl }: { tpl: Pick<LayoutTemplate, 'theme' | 'sections'> }) {
  const th = tpl.theme;
  const border = { borderWidth: 1, borderColor: th.text + '14', backgroundColor: th.surface } as const;
  return (
    <View style={{ backgroundColor: th.background, borderRadius: 16, padding: 8, gap: 5, borderWidth: 1, borderColor: th.text + '12' }}>
      {tpl.sections.map((s, i) => {
        switch (s.type) {
          case 'hero': return <View key={i} style={{ height: 30, borderRadius: 8, backgroundColor: th.primary }} />;
          case 'banner': return <View key={i} style={{ height: 16, borderRadius: 8, backgroundColor: th.accent }} />;
          case 'categories': return <View key={i} style={{ flexDirection: 'row', gap: 3 }}>{[0, 1, 2, 3].map((n) => <View key={n} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: n ? th.text + '18' : th.primary }} />)}</View>;
          case 'productGrid': return <View key={i} style={{ flexDirection: 'row', gap: 4 }}>{[0, 1, 2].map((n) => <View key={n} style={[{ flex: 1, height: 28, borderRadius: 6, padding: 3 }, border]}><View style={{ flex: 1, borderRadius: 3, backgroundColor: th.primary + '30' }} /></View>)}</View>;
          case 'productList': return <View key={i} style={{ gap: 3 }}>{[0, 1].map((n) => <View key={n} style={[{ height: 14, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 }, border]}><View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: th.primary + '40' }} /><View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: th.text + '22' }} /></View>)}</View>;
          case 'services': return <View key={i} style={{ gap: 3 }}>{[0, 1].map((n) => <View key={n} style={[{ height: 12, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: th.accent }, border]} />)}</View>;
          default: return <View key={i} style={{ height: 10, borderRadius: 5, backgroundColor: th.text + '12' }} />;
        }
      })}
    </View>
  );
}
