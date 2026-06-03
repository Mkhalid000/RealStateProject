import React, {useEffect, useRef, useState} from 'react';
import {Alert, Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon} from '../components/ui/Icon';
import {BottomSheet} from '../components/ui/BottomSheet';
import {useAuthStore} from '../store/authStore';
import {radius, spacing, useColors, useThemedStyles} from '../theme';

const TABS = {
  Explore: {icon: 'compass', label: 'Explore'},
  Reels: {icon: 'play', label: 'Reels'},
  Saved: {icon: 'heart', label: 'Saved'},
  Profile: {icon: 'user', label: 'Profile'},
};

/**
 * Premium bottom bar with SVG tab icons. Agents get a floating center "+"
 * action button that opens a sheet (Add Reel / Add Property).
 */
export function TabBar({state, navigation}) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const role = useAuthStore(s => s.user?.role);
  const isAgent = role === 'agent' || role === 'admin';
  const [addOpen, setAddOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Agents get a "+" create action; everyone else gets an AI assistant.
  // Both sit in a floating center button.
  const centerIcon = isAgent ? 'plus' : 'sparkles';
  const onCenterPress = () => (isAgent ? setAddOpen(true) : setAiOpen(true));

  // Split routes so the FAB can sit dead-center.
  const routes = state.routes;
  const mid = Math.ceil(routes.length / 2);
  const left = routes.slice(0, mid);
  const right = routes.slice(mid);

  const renderTab = route => {
    const index = routes.findIndex(r => r.key === route.key);
    const focused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };
    const meta = TABS[route.name] || {icon: 'compass', label: route.name};
    return (
      <TabItem
        key={route.key}
        focused={focused}
        icon={meta.icon}
        label={meta.label}
        onPress={onPress}
      />
    );
  };

  return (
    <View style={[styles.bar, {paddingBottom: Math.max(insets.bottom, 10)}]}>
      <View style={styles.row}>
        {left.map(renderTab)}
        <View style={styles.fabSlot} />
        {right.map(renderTab)}
      </View>

      <Pressable
        style={[styles.fab, {bottom: Math.max(insets.bottom, 10) + 14}]}
        onPress={onCenterPress}>
        <Icon name={centerIcon} size={26} color={c.onGold} strokeWidth={2.4} />
        {!isAgent ? <Text style={styles.fabLabel}>AI</Text> : null}
      </Pressable>

      <AddActionsSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        navigation={navigation}
      />
      <AiAssistantSheet visible={aiOpen} onClose={() => setAiOpen(false)} />
    </View>
  );
}

function TabItem({focused, icon, label, onPress}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(v, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [focused, v]);

  const scale = v.interpolate({inputRange: [0, 1], outputRange: [1, 1.1]});
  const translateY = v.interpolate({inputRange: [0, 1], outputRange: [0, -2]});

  return (
    <Pressable style={styles.item} onPress={onPress} hitSlop={6}>
      <Animated.View style={{transform: [{scale}, {translateY}]}}>
        <Icon name={icon} size={23} color={focused ? c.gold : c.textMuted} />
      </Animated.View>
      <Text style={[styles.label, {color: focused ? c.gold : c.textMuted}]}>
        {label}
      </Text>
      <Animated.View style={[styles.dot, {opacity: v, transform: [{scale: v}]}]} />
    </Pressable>
  );
}

function AddActionsSheet({visible, onClose, navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

  const go = screen => {
    onClose();
    navigation.navigate(screen);
  };

  const goCreateReel = () => {
    onClose();
    navigation.navigate('CreateReel');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.sheetTitle}>Create</Text>
      <Text style={styles.sheetSub}>What would you like to add?</Text>

      <Pressable style={styles.action} onPress={() => go('PostProperty')}>
        <View style={[styles.actionIcon, {backgroundColor: c.goldFaint}]}>
          <Icon name="home" size={22} color={c.gold} />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Add Property</Text>
          <Text style={styles.actionDesc}>List a home, plot or commercial space</Text>
        </View>
        <Icon name="chevron-right" size={20} color={c.textMuted} />
      </Pressable>

      <Pressable style={styles.action} onPress={goCreateReel}>
        <View style={[styles.actionIcon, {backgroundColor: c.goldFaint}]}>
          <Icon name="film" size={22} color={c.gold} />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Add Reel</Text>
          <Text style={styles.actionDesc}>Share a short video of a property</Text>
        </View>
        <Icon name="chevron-right" size={20} color={c.textMuted} />
      </Pressable>

      <View style={{height: spacing.sm}} />
    </BottomSheet>
  );
}

const AI_PROMPTS = [
  {icon: 'search', title: 'Find me a home', desc: 'Tell AI your budget & needs'},
  {icon: 'map-pin', title: 'Best areas to buy', desc: 'Get neighbourhood insights'},
  {icon: 'tag', title: 'Estimate a price', desc: 'What should this property cost?'},
  {icon: 'home', title: 'Buy vs rent advice', desc: 'See what suits you better'},
];

function AiAssistantSheet({visible, onClose}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

  const ask = () => {
    onClose();
    Alert.alert('AUREVIA AI', 'Your AI property assistant is coming soon.');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.aiHead}>
        <View style={styles.aiBadge}>
          <Icon name="sparkles" size={20} color={c.onGold} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.sheetTitle}>AUREVIA AI</Text>
          <Text style={styles.sheetSub}>Your personal property assistant</Text>
        </View>
      </View>

      {AI_PROMPTS.map(p => (
        <Pressable key={p.title} style={styles.action} onPress={ask}>
          <View style={[styles.actionIcon, {backgroundColor: c.goldFaint}]}>
            <Icon name={p.icon} size={20} color={c.gold} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>{p.title}</Text>
            <Text style={styles.actionDesc}>{p.desc}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={c.textMuted} />
        </Pressable>
      ))}

      <Pressable style={styles.aiAsk} onPress={ask}>
        <Icon name="sparkles" size={16} color={c.onGold} />
        <Text style={styles.aiAskText}>Ask AUREVIA AI anything</Text>
      </Pressable>

      <View style={{height: spacing.sm}} />
    </BottomSheet>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    bar: {
      backgroundColor: c.bgSoft,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: spacing.sm,
    },
    row: {flexDirection: 'row', alignItems: 'center'},
    item: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 2},
    label: {fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3},
    dot: {width: 5, height: 5, borderRadius: 3, backgroundColor: c.gold, marginTop: 1},
    fabSlot: {width: 64},
    fab: {
      position: 'absolute',
      alignSelf: 'center',
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: c.bg,
      shadowColor: '#C9893B',
      shadowOpacity: 0.45,
      shadowRadius: 12,
      shadowOffset: {width: 0, height: 6},
      elevation: 10,
    },
    fabLabel: {
      color: c.onGold,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.5,
      marginTop: -1,
    },
    // ----- sheets -----
    sheetTitle: {color: c.text, fontSize: 20, fontWeight: '700', fontFamily: 'serif'},
    sheetSub: {color: c.textMuted, fontSize: 13, marginTop: 2, marginBottom: spacing.md},
    aiHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    aiBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiAsk: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.gold,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      marginTop: spacing.xs,
    },
    aiAskText: {color: c.onGold, fontSize: 15, fontWeight: '800', letterSpacing: 0.2},
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    actionIcon: {
      width: 46,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {flex: 1},
    actionTitle: {color: c.text, fontSize: 15.5, fontWeight: '700'},
    actionDesc: {color: c.textMuted, fontSize: 12.5, marginTop: 2},
  });
