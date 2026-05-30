import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Video from 'react-native-video';
import {Avatar} from '../../components/ui/Avatar';
import {likeReel, markReelViewed, unlikeReel} from '../../lib/reels';
import {compactCount, money} from '../../lib/format';
import {colors, radius, spacing} from '../../theme';

/** A single full-screen reel: looping video + gradient scrim + actions. */
export function ReelItem({reel, height, active, onOpenProperty}) {
  const [paused, setPaused] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const [liked, setLiked] = useState(!!reel.likedByMe);
  const [likeCount, setLikeCount] = useState(reel.likeCount ?? 0);
  const viewedRef = useRef(false);

  const heart = useRef(new Animated.Value(0)).current; // tap burst
  const playIcon = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPaused(!active);
    if (active && !viewedRef.current) {
      viewedRef.current = true;
      markReelViewed(reel.id);
    }
  }, [active, reel.id]);

  function toggleLike(burst = false) {
    const next = !liked;
    if (!liked && burst) {
      heart.setValue(0);
      Animated.sequence([
        Animated.spring(heart, {toValue: 1, useNativeDriver: true, speed: 20}),
        Animated.timing(heart, {toValue: 0, duration: 350, delay: 250, useNativeDriver: true}),
      ]).start();
    }
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    (next ? likeReel : unlikeReel)(reel.id).catch(() => {
      setLiked(!next);
      setLikeCount(c => c + (next ? -1 : 1));
    });
  }

  function onTapVideo() {
    setPaused(p => {
      const np = !p;
      Animated.sequence([
        Animated.timing(playIcon, {toValue: 1, duration: 120, useNativeDriver: true}),
        Animated.timing(playIcon, {toValue: 0, duration: 400, delay: 200, useNativeDriver: true}),
      ]).start();
      return np;
    });
  }

  const agent = reel.agent;
  const property = reel.property;

  return (
    <View style={[styles.page, {height}]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTapVideo} onLongPress={() => toggleLike(true)}>
        {reel.videoUrl ? (
          <Video
            source={{uri: reel.videoUrl}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            repeat
            paused={paused}
            muted={false}
            poster={reel.thumbnailUrl || undefined}
            posterResizeMode="cover"
            onLoad={() => setBuffering(false)}
            onBuffer={({isBuffering}) => setBuffering(isBuffering)}
            ignoreSilentSwitch="ignore"
          />
        ) : reel.thumbnailUrl ? (
          <Image source={{uri: reel.thumbnailUrl}} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noVideo]} />
        )}
      </Pressable>

      {buffering && !paused ? (
        <View style={styles.bufferer} pointerEvents="none">
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}

      {/* center play indicator on tap */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.playIcon,
          {opacity: playIcon, transform: [{scale: playIcon.interpolate({inputRange: [0, 1], outputRange: [0.7, 1]})}]},
        ]}>
        <Text style={styles.playGlyph}>{paused ? '▶' : '❚❚'}</Text>
      </Animated.View>

      {/* burst heart on long-press like */}
      <Animated.Text
        pointerEvents="none"
        style={[
          styles.burst,
          {
            opacity: heart,
            transform: [{scale: heart.interpolate({inputRange: [0, 1], outputRange: [0.3, 1.4]})}],
          },
        ]}>
        ♥
      </Animated.Text>

      <View style={styles.scrim} pointerEvents="none" />

      {/* right action rail */}
      <View style={styles.rail}>
        <Action glyph={liked ? '♥' : '♡'} tint={liked ? colors.danger : '#fff'} label={compactCount(likeCount)} onPress={() => toggleLike(false)} />
        <Action glyph="◍" label={compactCount(reel.viewCount ?? 0)} />
        <Action glyph="✉" label="DM" />
        <Action glyph="↗" label="Share" />
      </View>

      {/* bottom meta */}
      <View style={styles.bottom}>
        <Pressable style={styles.agentRow}>
          <Avatar uri={agent?.avatarUrl} name={agent?.fullName} size={40} ring />
          <View style={styles.agentText}>
            <Text style={styles.agentName} numberOfLines={1}>
              {agent?.fullName || 'Agent'}{agent?.isVerified ? '  ✓' : ''}
            </Text>
            {reel.isBoosted ? <Text style={styles.boost}>★ Boosted</Text> : null}
          </View>
        </Pressable>

        {reel.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {reel.caption}
          </Text>
        ) : null}

        {property ? (
          <Pressable style={styles.propCard} onPress={() => onOpenProperty(property.id)}>
            <Text style={styles.propPrice}>{money(property.price, property.currency)}</Text>
            <View style={styles.propMeta}>
              <Text style={styles.propTitle} numberOfLines={1}>{property.title}</Text>
              <Text style={styles.propView}>View property →</Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Action({glyph, label, tint = '#fff', onPress}) {
  return (
    <Pressable style={styles.action} onPress={onPress} hitSlop={6}>
      <Text style={[styles.actionGlyph, {color: tint}]}>{glyph}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {width: '100%', backgroundColor: '#000'},
  noVideo: {backgroundColor: colors.surface},
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bufferer: {position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center'},
  playIcon: {position: 'absolute', alignSelf: 'center', top: '44%'},
  playGlyph: {color: 'rgba(255,255,255,0.9)', fontSize: 40, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8},
  burst: {position: 'absolute', alignSelf: 'center', top: '38%', color: colors.danger, fontSize: 90, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 12},
  rail: {position: 'absolute', right: spacing.md, bottom: 150, alignItems: 'center', gap: spacing.lg},
  action: {alignItems: 'center', gap: 4},
  actionGlyph: {fontSize: 30, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6},
  actionLabel: {color: '#fff', fontSize: 11, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4},
  bottom: {position: 'absolute', left: spacing.md, right: 72, bottom: spacing.xl},
  agentRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  agentText: {flex: 1},
  agentName: {color: '#fff', fontWeight: '700', fontSize: 15, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4},
  boost: {color: colors.gold, fontSize: 11, fontWeight: '700', marginTop: 1},
  caption: {color: 'rgba(255,255,255,0.92)', marginTop: spacing.sm, fontSize: 14, lineHeight: 19, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4},
  propCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: 'rgba(20,16,16,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(242,166,90,0.4)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  propPrice: {color: colors.gold, fontWeight: '800', fontSize: 16},
  propMeta: {flex: 1},
  propTitle: {color: '#fff', fontSize: 13, fontWeight: '600'},
  propView: {color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1},
});
