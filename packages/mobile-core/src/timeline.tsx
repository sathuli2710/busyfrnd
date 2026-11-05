import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { Fulfillment, OrderStatus } from '@busyfrnd/shared';
import { Icon, T } from './kit';
import { colors } from './theme';

const PICKUP: OrderStatus[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];
const DELIVERY: OrderStatus[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED'];
const LABEL: Record<string, string> = { PLACED: 'Order placed', ACCEPTED: 'Accepted', PREPARING: 'Preparing', READY: 'Ready for pickup', OUT_FOR_DELIVERY: 'Out for delivery', COMPLETED: 'Completed' };

export function OrderTimeline({ status, fulfillment }: { status: OrderStatus; fulfillment: Fulfillment }) {
  const steps = fulfillment === 'PICKUP' ? PICKUP : DELIVERY;
  if (status === 'CANCELLED') return <View style={{ backgroundColor: '#FDE8EC', padding: 14, borderRadius: 18 }}><T bold color="#BE123C">This order was cancelled.</T></View>;
  const idx = Math.max(0, steps.indexOf(status));
  return (
    <View>
      {steps.map((s, i) => {
        const done = i < idx || status === 'COMPLETED', active = i === idx && status !== 'COMPLETED';
        return (
          <View key={s} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.text : '#fff', borderColor: done ? colors.text : active ? colors.brand : colors.line }}>
                {done ? <Icon name="checkmark" size={16} color="#fff" /> : <Text style={{ fontWeight: '800', fontSize: 12, color: active ? colors.brand : colors.muted }}>{i + 1}</Text>}
              </View>
              {i < steps.length - 1 && <View style={{ width: 2, height: 26, backgroundColor: done ? colors.text : colors.line }} />}
            </View>
            <Animated.View entering={FadeIn.delay(i * 80)} style={{ paddingTop: 4 }}><T variant={active ? 'label' : 'body'} bold={active || done} muted={!active && !done}>{LABEL[s]}</T></Animated.View>
          </View>
        );
      })}
    </View>
  );
}
