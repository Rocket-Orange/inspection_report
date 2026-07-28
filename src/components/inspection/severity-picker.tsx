import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SeverityColors, Spacing } from '@/constants/theme';
import type { Severity } from '@/types';

import { ThemedText } from '../themed-text';

interface Props {
  value: Severity;
  onChange: (severity: Severity) => void;
}

const ORDER: Severity[] = ['high', 'medium', 'low'];
const LETTERS: Record<Severity, string> = { high: 'H', medium: 'M', low: 'L' };

export function SeverityPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        Criticality
      </ThemedText>
      <View style={styles.pills}>
        {ORDER.map((sev) => {
          const active = value === sev;
          const color = SeverityColors[sev];
          return (
            <Pressable
              key={sev}
              onPress={() => onChange(sev)}
              hitSlop={4}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? color : color + '22',
                  borderColor: color,
                },
              ]}>
              <ThemedText
                style={[styles.pillText, { color: active ? '#fff' : color }]}>
                {LETTERS[sev]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  label: {
    fontSize: 11,
    minWidth: 68,
  },
  pills: {
    flexDirection: 'row',
    gap: Spacing.one,
    flex: 1,
  },
  pill: {
    minWidth: 36,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
