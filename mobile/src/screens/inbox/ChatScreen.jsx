import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Avatar} from '../../components/ui/Avatar';
import {Icon} from '../../components/ui/Icon';
import {Loader} from '../../components/ui/Loader';
import {useAuthStore} from '../../store/authStore';
import {fetchMessages, sendMessage, startConversation} from '../../lib/messages';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

export function ChatScreen({route, navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const qc = useQueryClient();
  const me = useAuthStore(s => s.user);

  // Params: { conversationId?, agentId, recipient: {id, fullName, avatarUrl} }
  const {conversationId: initConvId, agentId, recipient} = route.params || {};

  const [convId, setConvId] = useState(initConvId ?? null);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const {data, isLoading} = useQuery({
    queryKey: ['messages', convId],
    queryFn: () => fetchMessages(convId),
    enabled: !!convId,
    refetchInterval: 4000,
  });

  // v5: use useEffect to react to data changes instead of onSuccess
  useEffect(() => {
    if (data) {
      qc.invalidateQueries({queryKey: ['chat-unread-count']});
      qc.invalidateQueries({queryKey: ['conversations']});
    }
  }, [data, qc]);

  const messages = Array.isArray(data) ? data : [];

  const {mutate: send, isPending: sending} = useMutation({
    mutationFn: async (msgText) => {
      let cid = convId;
      if (!cid) {
        const conv = await startConversation({agentId: agentId ?? recipient?.id});
        cid = conv.id;
        setConvId(cid);
      }
      const msg = await sendMessage({conversationId: cid, text: msgText});
      return {msg, cid};
    },
    onMutate: (msgText) => {
      // Optimistic: append a temporary message immediately
      const tempMsg = {
        id: `tmp-${Date.now()}`,
        senderId: me?.id,
        text: msgText,
        createdAt: new Date().toISOString(),
        _pending: true,
      };
      if (convId) {
        qc.setQueryData(['messages', convId], (old = []) => [...old, tempMsg]);
      }
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 50);
    },
    onSuccess: ({msg, cid}) => {
      // Replace temp message with the real one from server
      qc.setQueryData(['messages', cid], (old = []) =>
        old.filter(m => !m._pending).concat(msg),
      );
      qc.invalidateQueries({queryKey: ['conversations']});
    },
    onError: (_, msgText) => {
      // Remove the optimistic message on failure
      if (convId) {
        qc.setQueryData(['messages', convId], (old = []) =>
          old.filter(m => !m._pending),
        );
        setText(msgText); // restore input
      }
      Alert.alert('Error', 'Could not send message.');
    },
  });

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    send(trimmed);
  }

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 100);
    }
  }, [messages.length]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({pressed}) => [styles.iconBtn, pressed && {opacity: 0.7}]}>
            <Icon name="chevron-left" size={22} color={c.text} />
          </Pressable>
          <Avatar uri={recipient?.avatarUrl} name={recipient?.fullName} size={36} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{recipient?.fullName ?? 'Agent'}</Text>
            <Text style={styles.headerStatus}>
              {convId ? 'Online' : 'Start a conversation'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isLoading ? (
          <Loader fullscreen size={40} label="Loading…" />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Icon name="message-circle" size={40} color={c.border} />
                <Text style={styles.emptyChatText}>Start the conversation</Text>
                <Text style={styles.emptyChatSub}>
                  Ask about a property, schedule a visit, or negotiate.
                </Text>
              </View>
            }
            renderItem={({item}) => {
              const isMine = item.senderId === me?.id;
              return (
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  {/* backend field is `text` */}
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                    {item._pending ? '⏳ Sending…' : formatTime(item.createdAt)}
                  </Text>
                </View>
              );
            }}
          />
        )}

        {/* Input bar */}
        <SafeAreaView edges={['bottom']} style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor={c.textDim}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={submit}
            disabled={!text.trim() || sending}>
            {sending ? (
              <Loader size={18} color={c.onGold} />
            ) : (
              <Icon name="arrow-right" size={18} color={c.onGold} />
            )}
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    flex: {flex: 1},
    headerSafe: {backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.borderSoft},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerInfo: {flex: 1},
    headerName: {color: c.text, fontSize: 15, fontWeight: '700'},
    headerStatus: {color: c.textMuted, fontSize: 12, marginTop: 1},

    list: {padding: spacing.md, flexGrow: 1, justifyContent: 'flex-end'},

    emptyChat: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.sm,
    },
    emptyChatText: {color: c.textMuted, fontSize: 16, fontWeight: '700', marginTop: spacing.sm},
    emptyChatSub: {color: c.textDim, fontSize: 13, textAlign: 'center', paddingHorizontal: spacing.lg},

    bubble: {
      maxWidth: '78%',
      marginBottom: spacing.sm,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radius.lg,
    },
    bubbleMine: {
      alignSelf: 'flex-end',
      backgroundColor: c.gold,
      borderBottomRightRadius: 4,
    },
    bubbleTheirs: {
      alignSelf: 'flex-start',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderBottomLeftRadius: 4,
    },
    bubbleText: {color: c.text, fontSize: 14.5, lineHeight: 21},
    bubbleTextMine: {color: c.onGold},
    bubbleTime: {color: c.textDim, fontSize: 10.5, marginTop: 3, alignSelf: 'flex-end'},
    bubbleTimeMine: {color: 'rgba(255,255,255,0.7)'},

    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      padding: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
      backgroundColor: c.bg,
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
    sendBtnDisabled: {opacity: 0.45},
  });
