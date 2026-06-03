import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCompareStore} from '../../store/compareStore';
import {Icon} from '../../components/ui/Icon';
import {Button} from '../../components/ui/Button';
import {coverImage, locationLine, money} from '../../lib/format';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const ROWS = [
  {label: 'Price',     key: p => money(p.price, p.currency)},
  {label: 'Type',      key: p => p.type ?? '—'},
  {label: 'BHK',       key: p => p.bhk != null ? `${p.bhk} BHK` : '—'},
  {label: 'Bathrooms', key: p => p.bathrooms != null ? `${p.bathrooms}` : '—'},
  {label: 'Area',      key: p => (p.carpetArea ?? p.superBuiltUpArea) != null ? `${p.carpetArea ?? p.superBuiltUpArea} ft²` : '—'},
  {label: 'Furnishing',key: p => p.furnishing ? String(p.furnishing).replace(/_/g, ' ') : '—'},
  {label: 'Floor',     key: p => p.floorNumber != null ? `${p.floorNumber}` : '—'},
  {label: 'Facing',    key: p => p.facing ?? '—'},
  {label: 'Location',  key: p => locationLine(p)},
  {label: 'Verified',  key: p => p.isVerified ? '✓ Yes' : 'No'},
];

export function CompareScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const {items, remove, clear} = useCompareStore();

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({pressed}) => [styles.iconBtn, pressed && {opacity: 0.7}]}>
            <Icon name="chevron-left" size={22} color={c.text} />
          </Pressable>
          <Text style={styles.title}>Compare</Text>
          {items.length > 0 ? (
            <Pressable onPress={clear} hitSlop={10} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          ) : <View style={{width: 60}} />}
        </View>
      </SafeAreaView>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⚖️</Text>
          <Text style={styles.emptyTitle}>No properties to compare</Text>
          <Text style={styles.emptySub}>Add up to 3 properties using the compare button on any listing.</Text>
          <Button title="Browse Properties" onPress={() => navigation.goBack()} style={styles.emptyBtn} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Property header cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
            <View style={styles.rowLabel} />
            {items.map(p => (
              <View key={p.id} style={styles.propCard}>
                <Image source={{uri: coverImage(p)}} style={styles.propImg} />
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => remove(p.id)}
                  hitSlop={4}>
                  <Icon name="x" size={12} color="#fff" />
                </Pressable>
                <Text style={styles.propTitle} numberOfLines={2}>{p.title}</Text>
                <Pressable onPress={() => navigation.navigate('PropertyDetail', {id: p.id})}>
                  <Text style={styles.propView}>View →</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {/* Comparison rows */}
          {ROWS.map((row, ri) => (
            <View key={row.label} style={[styles.compRow, ri % 2 === 0 && styles.compRowAlt]}>
              <View style={styles.rowLabel}>
                <Text style={styles.rowLabelText}>{row.label}</Text>
              </View>
              {items.map(p => (
                <View key={p.id} style={styles.rowCell}>
                  <Text style={styles.rowCellText} numberOfLines={2}>
                    {row.key(p)}
                  </Text>
                </View>
              ))}
              {/* Placeholder cells if < 3 items */}
              {Array.from({length: 3 - items.length}).map((_, i) => (
                <View key={`ph-${i}`} style={styles.rowCell} />
              ))}
            </View>
          ))}
          <View style={{height: spacing.xxl}} />
        </ScrollView>
      )}
    </View>
  );
}

const COL_W = 130;
const LABEL_W = 90;

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    headerSafe: {backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.borderSoft},
    header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
    iconBtn: {width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderSoft, alignItems: 'center', justifyContent: 'center'},
    title: {flex: 1, textAlign: 'center', color: c.text, fontSize: 18, fontWeight: '700', fontFamily: 'serif'},
    clearBtn: {width: 60, alignItems: 'flex-end'},
    clearText: {color: c.danger, fontSize: 13, fontWeight: '600'},

    // Empty state
    empty: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
    emptyIcon: {fontSize: 48, marginBottom: spacing.md},
    emptyTitle: {color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center'},
    emptySub: {color: c.textMuted, fontSize: 14, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20},
    emptyBtn: {marginTop: spacing.lg, width: '100%'},

    // Cards row
    cardsRow: {paddingHorizontal: spacing.sm, paddingVertical: spacing.md, gap: spacing.sm},
    propCard: {width: COL_W, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSoft, overflow: 'hidden'},
    propImg: {width: '100%', height: 80, backgroundColor: c.surface2},
    removeBtn: {position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center'},
    propTitle: {color: c.text, fontSize: 11.5, fontWeight: '600', padding: spacing.sm, paddingBottom: 2},
    propView: {color: c.gold, fontSize: 11, fontWeight: '700', paddingHorizontal: spacing.sm, paddingBottom: spacing.sm},

    // Comparison table
    compRow: {flexDirection: 'row', minHeight: 44, alignItems: 'center'},
    compRowAlt: {backgroundColor: c.surface},
    rowLabel: {width: LABEL_W, paddingHorizontal: spacing.sm},
    rowLabelText: {color: c.textMuted, fontSize: 11.5, fontWeight: '700'},
    rowCell: {width: COL_W, paddingHorizontal: spacing.sm},
    rowCellText: {color: c.text, fontSize: 12.5, fontWeight: '600'},
  });
