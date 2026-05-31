import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Button} from './Button';
import {spacing, useThemedStyles} from '../../theme';

export function EmptyState({icon = '✦', title, subtitle, actionLabel, onAction}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    wrap: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.goldFaint,
      borderWidth: 1,
      borderColor: 'rgba(201,137,46,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    icon: {fontSize: 28, color: c.gold},
    title: {color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center'},
    subtitle: {
      color: c.textMuted,
      marginTop: spacing.xs,
      textAlign: 'center',
      lineHeight: 20,
    },
    action: {marginTop: spacing.lg, alignSelf: 'center'},
  });
