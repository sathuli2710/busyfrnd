import { Text, View } from 'react-native';
import { Icon } from '@busyfrnd/mobile-core';
import { colors } from '@busyfrnd/mobile-core';

const STEPS = [['DRAFT', 'Draft'], ['IN_REVIEW', 'In review'], ['APPROVED', 'Approved'], ['PUBLISHED', 'Live']] as const;
export function StatusSteps({ status }: { status: string }) {
  const idx = status === 'REJECTED' ? 0 : status === 'SUSPENDED' ? 2 : Math.max(0, STEPS.findIndex(([k]) => k === status));
  const bad = status === 'REJECTED' || status === 'SUSPENDED';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {STEPS.map(([k, label], i) => {
        const done = i < idx || (status === 'PUBLISHED' && i === 3), active = i === idx && !done;
        return (
          <View key={k} style={{ flex: i === STEPS.length - 1 ? 0 : 1, flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ alignItems: 'center', gap: 5, width: 54 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.ok : '#fff', borderColor: done ? colors.ok : active ? (bad ? colors.danger : colors.brand) : colors.line }}>
                {done ? <Icon name="checkmark" size={14} color="#fff" /> : <Text style={{ fontSize: 11, fontWeight: '900', color: active ? (bad ? colors.danger : colors.brand) : colors.muted }}>{i + 1}</Text>}
              </View>
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: active || done ? colors.text : colors.muted }}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={{ flex: 1, height: 2, marginTop: 12, marginHorizontal: -10, backgroundColor: i < idx ? colors.ok : colors.line }} />}
          </View>
        );
      })}
    </View>
  );
}
