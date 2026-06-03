import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Video from 'react-native-video';
import {Avatar} from '../../components/ui/Avatar';
import {Icon} from '../../components/ui/Icon';
import {Loader} from '../../components/ui/Loader';
import {BottomSheet} from '../../components/ui/BottomSheet';
import {
  addComment,
  deleteComment,
  fetchComments,
  likeReel,
  markReelViewed,
  unlikeReel,
} from '../../lib/reels';
import {useAuthStore} from '../../store/authStore';
import {compactCount, money} from '../../lib/format';
import {colors, radius, spacing} from '../../theme';

/** Returns an iframe embed URL for YouTube/Vimeo, or null for direct files. */
function getEmbedUrl(url) {
  if (!url) return null;

  // YouTube: youtube.com/watch?v=ID  or  youtu.be/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&playsinline=1&controls=1&rel=0`;
  }

  // Vimeo: vimeo.com/ID
  const vmMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vmMatch) {
    return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&playsinline=1`;
  }

  return null; // direct file — use react-native-video
}

/** A single full-screen reel: looping video + gradient scrim + actions. */
export function ReelItem({reel, height, active, onOpenProperty}) {
  const currentUser = useAuthStore(s => s.user);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [liked, setLiked] = useState(!!reel.likedByMe);
  const [likeCount, setLikeCount] = useState(reel.likeCount ?? 0);
  const [commentCount, setCommentCount] = useState(reel.commentCount ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const viewedRef = useRef(false);

  const heart = useRef(new Animated.Value(0)).current;
  const playIcon = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setPaused(!active);
    if (active && !viewedRef.current) {
      viewedRef.current = true;
      markReelViewed(reel.id);
    }
  }, [active, reel.id]);

  const toggleLike = useCallback((burst = false) => {
    const next = !liked;
    if (!liked && burst) {
      heart.setValue(0);
      Animated.sequence([
        Animated.spring(heart, {toValue: 1, useNativeDriver: true, speed: 20}),
        Animated.timing(heart, {toValue: 0, duration: 350, delay: 250, useNativeDriver: true}),
      ]).start();
    }
    // Heart press spring on rail
    Animated.sequence([
      Animated.spring(heartScale, {toValue: 1.3, useNativeDriver: true, speed: 30}),
      Animated.spring(heartScale, {toValue: 1, useNativeDriver: true, speed: 30}),
    ]).start();
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    (next ? likeReel : unlikeReel)(reel.id).catch(() => {
      setLiked(!next);
      setLikeCount(c => c + (next ? -1 : 1));
    });
  }, [liked, heart, heartScale, reel.id]);

  const onTapVideo = useCallback(() => {
    // Tap = play only; double-tap still triggers like via onLongPress.
    if (paused) {
      Animated.sequence([
        Animated.timing(playIcon, {toValue: 1, duration: 100, useNativeDriver: true}),
        Animated.timing(playIcon, {toValue: 0, duration: 380, delay: 200, useNativeDriver: true}),
      ]).start();
      setPaused(false);
    }
  }, [paused, playIcon]);

  const onLoad = useCallback(() => setBuffering(false), []);
  const onBuffer = useCallback(({isBuffering}) => setBuffering(isBuffering), []);
  const toggleMute = useCallback(() => setMuted(m => !m), []);

  const agent = reel.agent;
  const property = reel.property;
  const embedUrl = getEmbedUrl(reel.videoUrl);

  return (
    <View style={[styles.page, {height}]}>
      {/* ── video / thumbnail ── */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onTapVideo}
        onLongPress={() => toggleLike(true)}>
        {embedUrl && active ? (
          // YouTube / Vimeo — use WebView embed player
          <WebView
            source={{uri: embedUrl}}
            style={StyleSheet.absoluteFill}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            onLoad={onLoad}
          />
        ) : reel.videoUrl && !embedUrl ? (
          <Video
            source={{uri: reel.videoUrl}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            repeat
            paused={paused}
            muted={muted}
            poster={reel.thumbnailUrl || undefined}
            posterResizeMode="cover"
            onLoad={onLoad}
            onBuffer={onBuffer}
            ignoreSilentSwitch="ignore"
            playInBackground={false}
            playWhenInactive={false}
            bufferConfig={{
              minBufferMs: 1500,
              maxBufferMs: 8000,
              bufferForPlaybackMs: 800,
              bufferForPlaybackAfterRebufferMs: 1200,
            }}
          />
        ) : reel.thumbnailUrl ? (
          <Image
            source={{uri: reel.thumbnailUrl}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noVideo]} />
        )}
        {/* Show thumbnail under WebView while loading */}
        {embedUrl && reel.thumbnailUrl && buffering ? (
          <Image
            source={{uri: reel.thumbnailUrl}}
            style={[StyleSheet.absoluteFill, {zIndex: -1}]}
            resizeMode="cover"
          />
        ) : null}
      </Pressable>

      {/* ── buffering spinner ── */}
      {buffering && !paused ? (
        <View style={styles.bufferer} pointerEvents="none">
          <Loader size={36} color="#fff" />
        </View>
      ) : null}

      {/* ── center play/pause indicator ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.playIcon,
          {
            opacity: playIcon,
            transform: [
              {
                scale: playIcon.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.playCircle}>
          <Icon
            name={paused ? 'play' : 'pause'}
            size={28}
            color="#fff"
            strokeWidth={2}
          />
        </View>
      </Animated.View>

      {/* ── double-tap heart burst ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.burst,
          {
            opacity: heart,
            transform: [
              {
                scale: heart.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1.4],
                }),
              },
            ],
          },
        ]}>
        <Icon name="heart" size={90} color={colors.danger} strokeWidth={1.5} />
      </Animated.View>

      {/* ── bottom gradient scrim ── */}
      <View style={styles.scrim} pointerEvents="none" />

      {/* ── right action rail ── */}
      <View style={styles.rail}>
        <Animated.View style={{transform: [{scale: heartScale}]}}>
          <RailAction
            icon="heart"
            tint={liked ? colors.danger : '#fff'}
            label={compactCount(likeCount)}
            onPress={() => toggleLike(false)}
          />
        </Animated.View>
        <RailAction icon="eye" label={compactCount(reel.viewCount ?? 0)} />
        <RailAction
          icon="message-circle"
          label={compactCount(commentCount)}
          onPress={() => {
            setPaused(true);
            setCommentsOpen(true);
          }}
        />
        <Pressable style={styles.muteBtn} onPress={toggleMute} hitSlop={8}>
          <Icon
            name={muted ? 'volume-x' : 'volume-2'}
            size={20}
            color="#fff"
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      {/* ── bottom meta ── */}
      <View style={styles.bottom}>
        <View style={styles.agentRow}>
          <Avatar uri={agent?.avatarUrl} name={agent?.fullName} size={38} ring />
          <View style={styles.agentText}>
            <Text style={styles.agentName} numberOfLines={1}>
              {agent?.fullName || 'Agent'}
              {agent?.isVerified ? '  ✓' : ''}
            </Text>
            {reel.isBoosted ? (
              <View style={styles.boostPill}>
                <Icon name="star" size={10} color={colors.gold} />
                <Text style={styles.boostText}>Boosted</Text>
              </View>
            ) : null}
          </View>
        </View>

        {reel.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {reel.caption}
          </Text>
        ) : null}

        {property ? (
          <Pressable style={styles.propCard} onPress={() => onOpenProperty(property.id)}>
            <View style={styles.propLeft}>
              <View style={styles.propIconWrap}>
                <Icon name="home" size={14} color={colors.gold} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.propTitle} numberOfLines={1}>
                  {property.title}
                </Text>
                <Text style={styles.propPrice}>
                  {money(property.price, property.currency)}
                </Text>
              </View>
            </View>
            <View style={styles.propCta}>
              <Text style={styles.propCtaText}>View</Text>
              <Icon name="chevron-right" size={13} color={colors.gold} strokeWidth={2.5} />
            </View>
          </Pressable>
        ) : null}
      </View>

      <CommentsSheet
        reelId={reel.id}
        currentUser={currentUser}
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCountChange={setCommentCount}
      />
    </View>
  );
}

function CommentsSheet({reelId, currentUser, visible, onClose, onCountChange}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchComments(reelId)
      .then(data => {
        setComments(data);
        onCountChange(data.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, reelId]);

  async function submit() {
    const t = text.trim();
    if (!t) return;
    Keyboard.dismiss();
    setText('');
    setPosting(true);
    try {
      const c = await addComment(reelId, t);
      setComments(prev => [c, ...prev]);
      onCountChange(prev => prev + 1);
    } catch {
      // revert
    } finally {
      setPosting(false);
    }
  }

  async function onDelete(id) {
    setComments(prev => prev.filter(c => c.id !== id));
    onCountChange(prev => Math.max(0, prev - 1));
    deleteComment(id).catch(() => {});
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={cStyles.header}>
        <Text style={cStyles.title}>Comments</Text>
        {comments.length > 0 ? (
          <Text style={cStyles.count}>{comments.length}</Text>
        ) : null}
      </View>

      {loading ? (
        <View style={cStyles.loader}>
          <Loader size={32} />
        </View>
      ) : comments.length === 0 ? (
        <View style={cStyles.empty}>
          <Icon name="message-circle" size={32} color={colors.textMuted} />
          <Text style={cStyles.emptyText}>Be the first to comment</Text>
        </View>
      ) : (
        <ScrollView
          style={cStyles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {comments.map(c => (
            <View key={c.id} style={cStyles.row}>
              <Avatar uri={c.user?.avatarUrl} name={c.user?.fullName} size={36} />
              <View style={cStyles.rowBody}>
                <View style={cStyles.rowTop}>
                  <Text style={cStyles.name}>{c.user?.fullName || 'User'}</Text>
                  {c.user?.id === currentUser?.id ? (
                    <Pressable hitSlop={8} onPress={() => onDelete(c.id)}>
                      <Icon name="x" size={14} color={colors.textMuted} strokeWidth={2} />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={cStyles.commentText}>{c.text}</Text>
              </View>
            </View>
          ))}
          <View style={{height: spacing.md}} />
        </ScrollView>
      )}

      <View style={cStyles.inputRow}>
        <Avatar uri={currentUser?.avatarUrl} name={currentUser?.fullName} size={34} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment…"
          placeholderTextColor={colors.textMuted}
          style={cStyles.input}
          returnKeyType="send"
          onSubmitEditing={submit}
          multiline
        />
        <Pressable
          style={[cStyles.sendBtn, (!text.trim() || posting) && cStyles.sendBtnDisabled]}
          onPress={submit}
          disabled={!text.trim() || posting}
          hitSlop={8}>
          {posting ? (
            <Loader size={18} color={colors.onGold} />
          ) : (
            <Icon name="arrow-right" size={18} color={colors.onGold} strokeWidth={2.4} />
          )}
        </Pressable>
      </View>
    </BottomSheet>
  );
}

// Inline styles for CommentsSheet (static colors — sheet sits over dark video bg)
const cStyles = StyleSheet.create({
  header: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
  title: {color: colors.text, fontSize: 18, fontWeight: '700', fontFamily: 'serif'},
  count: {color: colors.textMuted, fontSize: 14, fontWeight: '600'},
  loader: {alignItems: 'center', paddingVertical: spacing.xl},
  empty: {alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm},
  emptyText: {color: colors.textMuted, fontSize: 14},
  list: {flexShrink: 1, marginBottom: spacing.sm},
  row: {flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, alignItems: 'flex-start'},
  rowBody: {flex: 1},
  rowTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  name: {color: colors.text, fontSize: 13.5, fontWeight: '700'},
  commentText: {color: colors.textDim, fontSize: 14, lineHeight: 19, marginTop: 2},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 90,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {opacity: 0.45},
});

function RailAction({icon, label, tint = '#fff', onPress}) {
  return (
    <Pressable style={styles.action} onPress={onPress} hitSlop={6}>
      <Icon name={icon} size={28} color={tint} strokeWidth={1.8} />
      {label ? <Text style={styles.actionLabel}>{label}</Text> : null}
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
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  bufferer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  burst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '34%',
  },
  rail: {
    position: 'absolute',
    right: spacing.md,
    bottom: 160,
    alignItems: 'center',
    gap: spacing.lg,
  },
  action: {alignItems: 'center', gap: 5},
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  muteBtn: {
    marginTop: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: spacing.md,
    right: 72,
    bottom: spacing.xl,
  },
  agentRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  agentText: {flex: 1},
  agentName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  boostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  boostText: {color: colors.gold, fontSize: 11, fontWeight: '700'},
  caption: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  propCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    backgroundColor: 'rgba(15,12,12,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(242,166,90,0.35)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  propLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1},
  propIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(242,166,90,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propTitle: {color: '#fff', fontSize: 12.5, fontWeight: '600'},
  propPrice: {color: colors.gold, fontSize: 13, fontWeight: '800', marginTop: 1},
  propCta: {flexDirection: 'row', alignItems: 'center', gap: 2},
  propCtaText: {color: colors.gold, fontSize: 12, fontWeight: '700'},
});
