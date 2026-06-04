import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Icon} from '../../components/ui/Icon';
import {Avatar} from '../../components/ui/Avatar';
import {useAuthStore} from '../../store/authStore';
import {sendAIMessage, cachedProperties, resetAIContext} from '../../lib/openrouter';
import {coverImage, money} from '../../lib/format';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const SESSIONS_KEY = '@ai_chat_sessions';
const SCREEN_W = require('react-native').Dimensions.get('window').width;
const PANEL_W  = SCREEN_W * 0.78;

const QUICK_QUESTIONS = [
  {icon: 'home',        text: 'Should I buy or rent right now?'},
  {icon: 'calculator',  text: 'How do I calculate my EMI?'},
  {icon: 'map-pin',     text: 'Which areas are best for investment?'},
  {icon: 'tag',         text: 'How do I negotiate property price?'},
  {icon: 'layers',      text: 'What documents do I need to buy a home?'},
  {icon: 'sparkles',    text: 'What are the hidden costs of buying?'},
];

function uid() {
  return Math.random().toString(36).slice(2);
}

export function AIScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const user = useAuthStore(s => s.user);
  const listRef = useRef(null);

  // ── Session state ──
  const [sessions, setSessions]         = useState([]);   // [{id, title, createdAt, messages}]
  const [activeId, setActiveId]         = useState(null); // current session id
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [panelOpen, setPanelOpen]       = useState(false);
  const panelAnim = useRef(new Animated.Value(PANEL_W)).current;

  const activeSession  = sessions.find(s => s.id === activeId) ?? null;
  const messages       = activeSession?.messages ?? [];
  const hasMessages    = messages.length > 0;

  // Load sessions on mount
  useEffect(() => {
    AsyncStorage.getItem(SESSIONS_KEY)
      .then(raw => {
        if (raw) {
          const saved = JSON.parse(raw);
          setSessions(saved);
          if (saved.length) setActiveId(saved[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setSessionsLoaded(true));
  }, []);

  // Save sessions whenever they change
  useEffect(() => {
    if (!sessionsLoaded) return;
    AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)).catch(() => {});
  }, [sessions, sessionsLoaded]);

  // Panel open/close animation
  function openPanel() {
    setPanelOpen(true);
    Animated.spring(panelAnim, {toValue: 0, useNativeDriver: true, speed: 18, bounciness: 0}).start();
  }
  function closePanel() {
    Animated.timing(panelAnim, {toValue: PANEL_W, duration: 220, useNativeDriver: true}).start(() => setPanelOpen(false));
  }

  function startNewSession() {
    closePanel();
    const id = uid();
    setSessions(prev => [{id, title: 'New Chat', createdAt: Date.now(), messages: []}, ...prev]);
    setActiveId(id);
    setInput('');
    resetAIContext();
  }

  function loadSession(id) {
    closePanel();
    setActiveId(id);
    setInput('');
  }

  function deleteSession(id) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (activeId === id) {
        setActiveId(next.length ? next[0].id : null);
      }
      return next;
    });
  }

  function updateActiveMessages(updater) {
    setSessions(prev =>
      prev.map(s =>
        s.id === activeId
          ? {...s, messages: typeof updater === 'function' ? updater(s.messages) : updater}
          : s,
      ),
    );
  }

  // Three separate anims for wave effect
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) return;
    const wave = (d, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.spring(d, {toValue: -8, useNativeDriver: true, speed: 22, bounciness: 10}),
          Animated.spring(d, {toValue: 0,  useNativeDriver: true, speed: 22, bounciness: 10}),
          Animated.delay(300),
        ]),
      );
    const a1 = wave(dot1, 0);
    const a2 = wave(dot2, 150);
    const a3 = wave(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); dot1.setValue(0); dot2.setValue(0); dot3.setValue(0); };
  }, [loading, dot1, dot2, dot3]);

  async function ask(text) {
    const q = text.trim();
    if (!q || loading) return;
    setInput('');

    // Create a session automatically if none is active
    let currentId = activeId;
    if (!currentId) {
      currentId = uid();
      const newSession = {id: currentId, title: q.slice(0, 50), createdAt: Date.now(), messages: []};
      setSessions(prev => [newSession, ...prev]);
      setActiveId(currentId);
    }

    const userMsg = {id: uid(), role: 'user', text: q, createdAt: Date.now()};

    // Update title of session if it's the first message
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== currentId) return s;
        const isFirst = s.messages.length === 0;
        return {
          ...s,
          title: isFirst ? q.slice(0, 50) : s.title,
          messages: [...s.messages, userMsg],
        };
      }),
    );

    setLoading(true);
    setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 80);

    try {
      const currentMsgs = [...messages, userMsg];
      const history = currentMsgs.map(m => ({role: m.role, content: m.text}));
      const reply = await sendAIMessage(history);
      const aiMsg = {id: uid(), role: 'assistant', text: reply, createdAt: Date.now()};
      setSessions(prev =>
        prev.map(s =>
          s.id === currentId ? {...s, messages: [...s.messages, aiMsg]} : s,
        ),
      );
    } catch {
      const errMsg = {id: uid(), role: 'assistant', text: 'Sorry, something went wrong. Please try again.', createdAt: Date.now()};
      setSessions(prev =>
        prev.map(s =>
          s.id === currentId ? {...s, messages: [...s.messages, errMsg]} : s,
        ),
      );
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 80);
    }
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({pressed}) => [styles.backBtn, pressed && {opacity: 0.7}]}>
            <Icon name="chevron-left" size={22} color={c.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.aiBadge}>
              <Icon name="sparkles" size={15} color={c.onGold} />
            </View>
            <View>
              <Text style={styles.headerTitle}>AUREVIA AI</Text>
              <Text style={styles.headerSub}>Property Assistant</Text>
            </View>
          </View>
          {/* Hamburger — opens history panel */}
          <Pressable
            onPress={openPanel}
            hitSlop={10}
            style={({pressed}) => [styles.menuBtn, pressed && {opacity: 0.7}]}>
            <Icon name="menu" size={22} color={c.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Welcome / quick questions (only when no messages) */}
        {!hasMessages ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.welcomeContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Greeting */}
            <View style={styles.welcomeHero}>
              <View style={styles.welcomeOrb}>
                <Icon name="sparkles" size={36} color={c.onGold} />
              </View>
              <Text style={styles.welcomeTitle}>
                Hello{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
              </Text>
              <Text style={styles.welcomeSub}>
                Ask me anything about real estate — buying, renting, investment, EMI and more.
              </Text>
            </View>

            {/* Quick questions */}
            <Text style={styles.quickLabel}>Popular questions</Text>
            <View style={styles.quickGrid}>
              {QUICK_QUESTIONS.map(q => (
                <Pressable
                  key={q.text}
                  style={({pressed}) => [styles.quickCard, pressed && {opacity: 0.75}]}
                  onPress={() => ask(q.text)}>
                  <View style={styles.quickIconWrap}>
                    <Icon name={q.icon} size={16} color={c.gold} />
                  </View>
                  <Text style={styles.quickText}>{q.text}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          /* Chat messages */
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({animated: true})}
            renderItem={({item}) => (
              <MessageBubble
                msg={item}
                user={user}
                styles={styles}
                c={c}
                onOptionPress={ask}
                onPropertyPress={id => navigation.navigate('PropertyDetail', {id})}
              />
            )}
            ListFooterComponent={
              loading ? <TypingIndicator dot1={dot1} dot2={dot2} dot3={dot3} styles={styles} c={c} /> : null
            }
          />
        )}

        {/* Input bar */}
        <SafeAreaView edges={['bottom']} style={styles.inputBar}>
          {/* Quick chips while chatting */}
          {hasMessages && !loading && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              keyboardShouldPersistTaps="handled">
              {QUICK_QUESTIONS.slice(0, 4).map(q => (
                <Pressable key={q.text} style={styles.chip} onPress={() => ask(q.text)}>
                  <Text style={styles.chipText} numberOfLines={1}>{q.text}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about property, EMI, investment…"
              placeholderTextColor={c.textDim}
              multiline
              maxLength={1000}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => ask(input)}
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
              onPress={() => ask(input)}
              disabled={!input.trim() || loading}>
              <Icon name="arrow-right" size={20} color={c.onGold} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* History side panel */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <Pressable style={styles.backdrop} onPress={closePanel} />
          {/* Panel slides from right */}
          <Animated.View style={[styles.panel, {transform: [{translateX: panelAnim}]}]}>
            <SafeAreaView edges={['top', 'bottom']} style={{flex: 1}}>
              {/* Panel header */}
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Chat History</Text>
                <Pressable onPress={closePanel} hitSlop={10}>
                  <Icon name="x" size={20} color={c.text} />
                </Pressable>
              </View>

              {/* New Chat button */}
              <Pressable style={styles.newSessionBtn} onPress={startNewSession}>
                <Icon name="plus" size={16} color={c.onGold} />
                <Text style={styles.newSessionText}>New Chat</Text>
              </Pressable>

              {/* Session list */}
              <FlatList
                data={sessions}
                keyExtractor={s => s.id}
                contentContainerStyle={styles.sessionList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={styles.sessionEmpty}>No conversations yet</Text>
                }
                renderItem={({item}) => (
                  <Pressable
                    style={({pressed}) => [
                      styles.sessionRow,
                      item.id === activeId && styles.sessionRowActive,
                      pressed && {opacity: 0.7},
                    ]}
                    onPress={() => loadSession(item.id)}>
                    <View style={styles.sessionIcon}>
                      <Icon name="message-circle" size={15}
                        color={item.id === activeId ? c.onGold : c.textDim} />
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={[styles.sessionTitle, item.id === activeId && styles.sessionTitleActive]}
                        numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.sessionDate}>{formatSessionDate(item.createdAt)}</Text>
                    </View>
                    <Pressable
                      onPress={() => deleteSession(item.id)}
                      hitSlop={8}
                      style={styles.sessionDel}>
                      <Icon name="trash-2" size={14} color={c.textDim} />
                    </Pressable>
                  </Pressable>
                )}
              />
            </SafeAreaView>
          </Animated.View>
        </>
      )}
    </View>
  );
}

function formatSessionDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  if (diff < 604800000) return d.toLocaleDateString([], {weekday: 'short'});
  return d.toLocaleDateString([], {month: 'short', day: 'numeric'});
}

/** Parse body, OPTIONS: chips, and PROPERTIES: ids from AI response */
function parseAIMessage(text) {
  let body = text;
  let options = [];
  let propertyIds = [];

  // Extract PROPERTIES:
  const propMatch = body.match(/\nPROPERTIES:\s*([^\n]+)/);
  if (propMatch) {
    propertyIds = propMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    body = body.replace(propMatch[0], '');
  }

  // Extract OPTIONS:
  const optIdx = body.lastIndexOf('\nOPTIONS:');
  if (optIdx !== -1) {
    const optLine = body.slice(optIdx + '\nOPTIONS:'.length).trim();
    options = optLine.split('|').map(o => o.trim()).filter(Boolean);
    body = body.slice(0, optIdx);
  }

  return {body: body.trim(), options, propertyIds};
}

function MessageBubble({msg, user, onOptionPress, onPropertyPress, styles, c}) {
  const isUser = msg.role === 'user';
  const {body, options, propertyIds} = isUser
    ? {body: msg.text, options: [], propertyIds: []}
    : parseAIMessage(msg.text);

  const suggestedProperties = propertyIds
    .map(id => cachedProperties.find(p => p.id === id))
    .filter(Boolean);

  return (
    <View style={styles.msgWrap}>
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.aiBubbleAvatar}>
            <Icon name="sparkles" size={13} color={c.onGold} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {body}
          </Text>
        </View>
        {isUser && (
          <Avatar uri={user?.avatarUrl} name={user?.fullName} size={28} />
        )}
      </View>

      {/* Tappable option chips */}
      {options.length > 0 && (
        <View style={styles.optionsWrap}>
          {options.map(opt => (
            <Pressable
              key={opt}
              style={({pressed}) => [styles.optionChip, pressed && styles.optionChipPressed]}
              onPress={() => onOptionPress?.(opt)}>
              <Text style={styles.optionChipText}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Suggested property cards */}
      {suggestedProperties.length > 0 && (
        <View style={styles.propCardsWrap}>
          {suggestedProperties.map(p => (
            <Pressable
              key={p.id}
              style={({pressed}) => [styles.propCard, pressed && {opacity: 0.8}]}
              onPress={() => onPropertyPress?.(p.id)}>
              <Image source={{uri: coverImage(p)}} style={styles.propCardImg} />
              <View style={styles.propCardBody}>
                <Text style={styles.propCardTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.propCardPrice}>{money(p.price, p.currency)}</Text>
                <Text style={styles.propCardLoc} numberOfLines={1}>
                  {[p.locality, p.city].filter(Boolean).join(', ')}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={c.gold} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function TypingIndicator({dot1, dot2, dot3, styles, c}) {
  return (
    <View style={styles.typingRow}>
      <View style={styles.aiBubbleAvatar}>
        <Icon name="sparkles" size={13} color={c.onGold} />
      </View>
      <View style={[styles.bubbleAI, styles.typingBubble]}>
        <View style={styles.typingDots}>
          {[dot1, dot2, dot3].map((d, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, {transform: [{translateY: d}]}]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    flex: {flex: 1},

    // Header
    headerSafe: {
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    aiBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {color: c.text, fontSize: 16, fontWeight: '800', fontFamily: 'serif'},
    headerSub: {color: c.textMuted, fontSize: 11, marginTop: 1},
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Side panel ──
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
      zIndex: 50,
    },
    panel: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: PANEL_W,
      backgroundColor: c.bg,
      borderLeftWidth: 1,
      borderLeftColor: c.borderSoft,
      zIndex: 51,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    panelTitle: {color: c.text, fontSize: 17, fontWeight: '700', fontFamily: 'serif'},
    newSessionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      margin: spacing.md,
      backgroundColor: c.gold,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      justifyContent: 'center',
    },
    newSessionText: {color: c.onGold, fontSize: 14, fontWeight: '700'},
    sessionList: {paddingHorizontal: spacing.sm, paddingBottom: spacing.xxl},
    sessionEmpty: {color: c.textMuted, textAlign: 'center', marginTop: spacing.xl, fontSize: 14},
    sessionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.lg,
      marginBottom: 4,
    },
    sessionRowActive: {backgroundColor: c.goldFaint},
    sessionIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    sessionInfo: {flex: 1},
    sessionTitle: {color: c.text, fontSize: 13, fontWeight: '600', lineHeight: 18},
    sessionTitleActive: {color: c.gold},
    sessionDate: {color: c.textDim, fontSize: 11, marginTop: 2},
    sessionDel: {padding: 4},

    // Welcome screen
    welcomeContent: {padding: spacing.md, paddingBottom: spacing.xxl},
    welcomeHero: {alignItems: 'center', paddingVertical: spacing.xl},
    welcomeOrb: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      shadowColor: c.gold,
      shadowOpacity: 0.5,
      shadowRadius: 20,
      shadowOffset: {width: 0, height: 6},
      elevation: 10,
    },
    welcomeTitle: {
      color: c.text,
      fontSize: 26,
      fontWeight: '700',
      fontFamily: 'serif',
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    welcomeSub: {
      color: c.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
      paddingHorizontal: spacing.md,
    },
    quickLabel: {
      color: c.textDim,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    quickGrid: {gap: spacing.sm},
    quickCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    quickIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickText: {color: c.text, fontSize: 14, fontWeight: '600', flex: 1},

    // Chat messages
    chatList: {
      padding: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    msgWrap: {gap: 8},
    msgRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    msgRowUser: {justifyContent: 'flex-end'},

    // Option chips
    optionsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingLeft: 36 + spacing.sm, // align with bubble (avatar width + gap)
    },
    optionChip: {
      borderWidth: 1.5,
      borderColor: c.gold,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      backgroundColor: c.goldFaint,
    },
    optionChipPressed: {backgroundColor: c.gold},
    optionChipText: {color: c.gold, fontSize: 13.5, fontWeight: '700'},

    // Suggested property cards
    propCardsWrap: {
      gap: spacing.sm,
      paddingLeft: 36 + spacing.sm,
    },
    propCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    propCardImg: {
      width: 72,
      height: 72,
      backgroundColor: c.surface2,
    },
    propCardBody: {flex: 1, paddingVertical: spacing.sm},
    propCardTitle: {color: c.text, fontSize: 13, fontWeight: '700'},
    propCardPrice: {color: c.gold, fontSize: 14, fontWeight: '800', marginTop: 2},
    propCardLoc: {color: c.textMuted, fontSize: 11.5, marginTop: 2},
    aiBubbleAvatar: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    bubble: {
      maxWidth: '80%',
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    bubbleAI: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderBottomLeftRadius: 4,
    },
    bubbleUser: {
      backgroundColor: c.gold,
      borderBottomRightRadius: 4,
    },
    bubbleText: {color: c.text, fontSize: 14.5, lineHeight: 22},
    bubbleTextUser: {color: c.onGold},

    // Typing indicator
    typingRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    typingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
    },
    typingDots: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 5,
    },
    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: c.gold,
    },

    // Input
    inputBar: {
      backgroundColor: c.bg,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
    },
    chipsRow: {
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      maxWidth: 200,
    },
    chipText: {color: c.textDim, fontSize: 12.5, fontWeight: '600'},
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      padding: spacing.sm,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: c.text,
      fontSize: 14.5,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnOff: {opacity: 0.4},
  });
