import React, {useState} from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import {useQueryClient} from '@tanstack/react-query';
import {Input} from '../../components/ui/Input';
import {Button} from '../../components/ui/Button';
import {Icon} from '../../components/ui/Icon';
import {Loader} from '../../components/ui/Loader';
import {Avatar} from '../../components/ui/Avatar';
import {createReel} from '../../lib/reels';
import {uploadImage, uploadVideo} from '../../lib/imagekit';
import {useMyProperties} from '../../hooks/useProperties';
import {useAuthStore} from '../../store/authStore';
import {apiErrorMessage} from '../../lib/api';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

export function CreateReelScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const [videoUrl, setVideoUrl] = useState('');
  const [videoSource, setVideoSource] = useState('url'); // 'url' | 'local'
  const [localVideo, setLocalVideo] = useState(null); // {uri, uploading, url, thumbUrl}
  const [caption, setCaption] = useState('');
  const [thumbnail, setThumbnail] = useState(null); // {uri, uploading, url}
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {data: mine} = useMyProperties('all');
  const myProperties = mine?.items?.filter(p => p.verificationStatus === 'verified') ?? [];

  async function pickLocalVideo() {
    const res = await launchImageLibrary({mediaType: 'video', selectionLimit: 1, videoQuality: 'high'});
    if (res.didCancel || !res.assets?.length) return;
    const asset = res.assets[0];
    setLocalVideo({uri: asset.uri, uploading: true, url: null, thumbUrl: null});
    setThumbnail(null); // will be auto-set from video
    try {
      const result = await uploadVideo(asset.uri);
      setLocalVideo({uri: asset.uri, uploading: false, url: result.url, thumbUrl: result.thumbnailUrl});
      // auto-fill thumbnail from video
      if (result.thumbnailUrl && !thumbnail) {
        setThumbnail({uri: result.thumbnailUrl, uploading: false, url: result.thumbnailUrl});
      }
    } catch (e) {
      setLocalVideo(null);
      Alert.alert('Upload failed', 'Could not upload video. Check your connection.');
    }
  }

  async function pickThumbnail() {
    const res = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1, quality: 0.85});
    if (res.didCancel || !res.assets?.length) return;
    const asset = res.assets[0];
    setThumbnail({uri: asset.uri, uploading: true, url: null});
    try {
      const {url} = await uploadImage(asset.uri);
      setThumbnail({uri: asset.uri, uploading: false, url});
    } catch {
      setThumbnail(null);
      Alert.alert('Upload failed', 'Could not upload thumbnail.');
    }
  }

  async function onSubmit() {
    setError('');
    const finalVideoUrl = videoSource === 'local' ? localVideo?.url : videoUrl.trim();
    if (!finalVideoUrl) {
      setError(videoSource === 'local'
        ? 'Please select and upload a video first.'
        : 'Please enter a video URL.');
      return;
    }
    if (localVideo?.uploading) {
      setError('Video is still uploading, please wait.');
      return;
    }
    if (thumbnail?.uploading) {
      setError('Thumbnail is still uploading, please wait.');
      return;
    }
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await createReel({
        videoUrl: finalVideoUrl,
        ...(thumbnail?.url ? {thumbnailUrl: thumbnail.url} : {}),
        ...(caption.trim() ? {caption: caption.trim()} : {}),
        ...(selectedProperty ? {propertyId: selectedProperty.id} : {}),
      });
      qc.invalidateQueries({queryKey: ['reels-feed']});
      Alert.alert('Reel posted!', 'Your reel is now live.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e) {
      setError(apiErrorMessage(e, 'Failed to post reel. Try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* header */}
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} hitSlop={10} onPress={() => navigation.goBack()}>
          <Icon name="x" size={20} color={c.text} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Reel</Text>
        <View style={{width: 40}} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* video section */}
          <SectionCard styles={styles}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionIcon}>
                <Icon name="film" size={16} color={c.gold} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Video</Text>
                <Text style={styles.sectionSub}>Upload from phone or add a link</Text>
              </View>
            </View>

            {/* source toggle */}
            <View style={styles.sourceToggle}>
              <Pressable
                onPress={() => setVideoSource('local')}
                style={[styles.sourceBtn, videoSource === 'local' && styles.sourceBtnActive]}>
                <Icon name="layers" size={15} color={videoSource === 'local' ? c.onGold : c.textDim} />
                <Text style={[styles.sourceBtnText, videoSource === 'local' && styles.sourceBtnTextActive]}>
                  From Phone
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setVideoSource('url')}
                style={[styles.sourceBtn, videoSource === 'url' && styles.sourceBtnActive]}>
                <Icon name="arrow-right" size={15} color={videoSource === 'url' ? c.onGold : c.textDim} />
                <Text style={[styles.sourceBtnText, videoSource === 'url' && styles.sourceBtnTextActive]}>
                  From URL
                </Text>
              </Pressable>
            </View>

            {videoSource === 'local' ? (
              localVideo ? (
                <View style={styles.videoUploaded}>
                  {localVideo.uploading ? (
                    <>
                      <Loader size={28} color={c.gold} />
                      <Text style={styles.videoUploadingText}>Uploading video…</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.videoSuccessIcon}>
                        <Icon name="check" size={20} color={c.success} strokeWidth={2.6} />
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={styles.videoSuccessText}>Video uploaded</Text>
                        <Text style={styles.videoSuccessSub} numberOfLines={1}>{localVideo.uri.split('/').pop()}</Text>
                      </View>
                      <Pressable onPress={() => { setLocalVideo(null); setThumbnail(null); }} hitSlop={8}>
                        <Icon name="x" size={18} color={c.textMuted} strokeWidth={2.2} />
                      </Pressable>
                    </>
                  )}
                </View>
              ) : (
                <Pressable style={styles.videoPicker} onPress={pickLocalVideo}>
                  <View style={styles.videoPickerIcon}>
                    <Icon name="play" size={26} color={c.gold} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.videoPickerTitle}>Select video</Text>
                  <Text style={styles.videoPickerSub}>MP4, MOV · thumbnail auto-generated</Text>
                </Pressable>
              )
            ) : (
              <>
                <Input
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  placeholder="https://youtube.com/watch?v=..."
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  icon="search"
                  compact
                />
                {videoUrl.trim() ? (
                  <View style={styles.urlPreview}>
                    <Icon name="check" size={13} color={c.success} strokeWidth={2.6} />
                    <Text style={styles.urlPreviewText} numberOfLines={1}>{videoUrl.trim()}</Text>
                  </View>
                ) : null}
              </>
            )}
          </SectionCard>

          {/* thumbnail */}
          <SectionCard styles={styles}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionIcon}>
                <Icon name="layers" size={16} color={c.gold} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.sectionTitle}>Thumbnail</Text>
                <Text style={styles.sectionSub}>Cover image for your reel (optional)</Text>
              </View>
            </View>

            {thumbnail ? (
              <View style={styles.thumbWrap}>
                <Image source={{uri: thumbnail.url || thumbnail.uri}} style={styles.thumbImg} />
                {thumbnail.uploading && (
                  <View style={styles.thumbOverlay}>
                    <Loader size={28} color="#fff" />
                  </View>
                )}
                {!thumbnail.uploading && (
                  <Pressable style={styles.thumbRemove} onPress={() => setThumbnail(null)} hitSlop={8}>
                    <Icon name="x" size={13} color="#fff" strokeWidth={2.4} />
                  </Pressable>
                )}
              </View>
            ) : (
              <Pressable style={styles.thumbPick} onPress={pickThumbnail}>
                <View style={styles.thumbPickIcon}>
                  <Icon name="plus" size={22} color={c.gold} strokeWidth={2.4} />
                </View>
                <Text style={styles.thumbPickText}>Pick from gallery</Text>
              </Pressable>
            )}
          </SectionCard>

          {/* caption */}
          <SectionCard styles={styles}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionIcon}>
                <Icon name="message-circle" size={16} color={c.gold} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Caption</Text>
                <Text style={styles.sectionSub}>Describe the property (optional)</Text>
              </View>
            </View>
            <Input
              value={caption}
              onChangeText={setCaption}
              placeholder="A stunning sea-facing villa in Goa..."
              multiline
              numberOfLines={3}
              style={styles.textarea}
              maxLength={2200}
            />
            <Text style={styles.charCount}>{caption.length}/2200</Text>
          </SectionCard>

          {/* link property */}
          <SectionCard styles={styles}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionIcon}>
                <Icon name="home" size={16} color={c.gold} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.sectionTitle}>Link Property</Text>
                <Text style={styles.sectionSub}>Attach a verified listing (optional)</Text>
              </View>
            </View>

            {selectedProperty ? (
              <View style={styles.linkedProp}>
                <View style={styles.linkedPropInfo}>
                  <Text style={styles.linkedPropTitle} numberOfLines={1}>{selectedProperty.title}</Text>
                  <Text style={styles.linkedPropSub}>{selectedProperty.city || 'Location'}</Text>
                </View>
                <Pressable onPress={() => setSelectedProperty(null)} hitSlop={8} style={styles.linkedPropRemove}>
                  <Icon name="x" size={14} color={c.textMuted} strokeWidth={2.2} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.propPickBtn} onPress={() => setPropertyOpen(true)}>
                <Icon name="search" size={16} color={c.textMuted} />
                <Text style={styles.propPickText}>
                  {myProperties.length === 0 ? 'No verified listings found' : 'Choose a property'}
                </Text>
                {myProperties.length > 0 && (
                  <Icon name="chevron-right" size={16} color={c.textMuted} />
                )}
              </Pressable>
            )}
          </SectionCard>

          {/* creator info */}
          <View style={styles.creatorRow}>
            <Avatar uri={user?.avatarUrl} name={user?.fullName} size={34} />
            <View>
              <Text style={styles.creatorName}>{user?.fullName || 'Agent'}</Text>
              <Text style={styles.creatorRole}>Posting as verified agent</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="x" size={14} color={c.danger} strokeWidth={2.4} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            title="Post Reel"
            size="lg"
            loading={submitting}
            onPress={onSubmit}
            style={styles.submitBtn}
          />

          <Text style={styles.note}>Your reel will be visible to all users immediately.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* property picker sheet */}
      {propertyOpen && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Choose a Property</Text>
              <Pressable hitSlop={8} onPress={() => setPropertyOpen(false)}>
                <Icon name="x" size={20} color={c.text} strokeWidth={2.2} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {myProperties.length === 0 ? (
                <Text style={styles.pickerEmpty}>No verified listings. Post and get verified first.</Text>
              ) : (
                myProperties.map(p => (
                  <Pressable
                    key={p.id}
                    style={styles.pickerRow}
                    onPress={() => {
                      setSelectedProperty(p);
                      setPropertyOpen(false);
                    }}>
                    <View style={styles.pickerRowIcon}>
                      <Icon name="home" size={16} color={c.gold} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.pickerRowTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={styles.pickerRowSub}>{p.city || 'Location'} · {p.type}</Text>
                    </View>
                    {selectedProperty?.id === p.id && (
                      <Icon name="check" size={16} color={c.gold} strokeWidth={2.6} />
                    )}
                  </Pressable>
                ))
              )}
              <View style={{height: spacing.xl}} />
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function SectionCard({children, styles}) {
  return <View style={styles.card}>{children}</View>;
}

const makeStyles = c => StyleSheet.create({
  root: {flex: 1, backgroundColor: c.bg},
  flex: {flex: 1},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: c.borderSoft,
  },
  closeBtn: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface},
  headerTitle: {color: c.text, fontSize: 18, fontWeight: '700', fontFamily: 'serif'},
  scroll: {padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md},
  card: {backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSoft, padding: spacing.md, gap: spacing.md},
  sectionHead: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm},
  sectionIcon: {width: 34, height: 34, borderRadius: 10, backgroundColor: c.goldFaint, alignItems: 'center', justifyContent: 'center'},
  sectionTitle: {color: c.text, fontSize: 15, fontWeight: '700'},
  sectionSub: {color: c.textMuted, fontSize: 12, marginTop: 1},
  sourceToggle: {flexDirection: 'row', backgroundColor: c.bg, borderRadius: radius.md, padding: 3, borderWidth: 1, borderColor: c.border},
  sourceBtn: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: radius.sm},
  sourceBtnActive: {backgroundColor: c.gold},
  sourceBtnText: {color: c.textDim, fontSize: 13.5, fontWeight: '600'},
  sourceBtnTextActive: {color: c.onGold, fontWeight: '700'},
  videoPicker: {height: 130, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed', backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm},
  videoPickerIcon: {width: 52, height: 52, borderRadius: 26, backgroundColor: c.goldFaint, alignItems: 'center', justifyContent: 'center'},
  videoPickerTitle: {color: c.text, fontSize: 15, fontWeight: '700'},
  videoPickerSub: {color: c.textMuted, fontSize: 12},
  videoUploaded: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.borderSoft, padding: spacing.md, minHeight: 64},
  videoUploadingText: {color: c.textMuted, fontSize: 13},
  videoSuccessIcon: {width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(95,208,138,0.12)', alignItems: 'center', justifyContent: 'center'},
  videoSuccessText: {color: c.text, fontSize: 14, fontWeight: '700'},
  videoSuccessSub: {color: c.textMuted, fontSize: 12, marginTop: 1},
  urlPreview: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(95,208,138,0.08)', borderRadius: radius.sm, padding: spacing.sm, borderWidth: 1, borderColor: 'rgba(95,208,138,0.3)'},
  urlPreviewText: {color: c.success, fontSize: 12, flex: 1},
  thumbWrap: {height: 180, borderRadius: radius.md, overflow: 'hidden', backgroundColor: c.surface2},
  thumbImg: {width: '100%', height: '100%'},
  thumbOverlay: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center'},
  thumbRemove: {position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center'},
  thumbPick: {height: 120, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed', backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm},
  thumbPickIcon: {width: 44, height: 44, borderRadius: 22, backgroundColor: c.goldFaint, alignItems: 'center', justifyContent: 'center'},
  thumbPickText: {color: c.textMuted, fontSize: 13, fontWeight: '600'},
  textarea: {height: 80, textAlignVertical: 'top', paddingTop: spacing.sm},
  charCount: {color: c.textMuted, fontSize: 11, textAlign: 'right'},
  linkedProp: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: c.goldFaint, borderRadius: radius.md, borderWidth: 1, borderColor: c.goldGlow, padding: spacing.sm},
  linkedPropInfo: {flex: 1},
  linkedPropTitle: {color: c.text, fontSize: 14, fontWeight: '700'},
  linkedPropSub: {color: c.textMuted, fontSize: 12, marginTop: 1},
  linkedPropRemove: {width: 28, height: 28, borderRadius: 14, backgroundColor: c.white06, alignItems: 'center', justifyContent: 'center'},
  propPickBtn: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: c.bg, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.md},
  propPickText: {flex: 1, color: c.textMuted, fontSize: 14},
  creatorRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs},
  creatorName: {color: c.text, fontSize: 14, fontWeight: '700'},
  creatorRole: {color: c.textMuted, fontSize: 12},
  errorBox: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,107,107,0.1)', borderWidth: 1, borderColor: 'rgba(239,107,107,0.3)', borderRadius: radius.md, padding: spacing.sm},
  errorText: {color: c.danger, fontSize: 13, flex: 1},
  submitBtn: {marginTop: spacing.xs},
  note: {color: c.textMuted, fontSize: 12, textAlign: 'center'},
  // property picker
  pickerOverlay: {...StyleSheet.absoluteFillObject, backgroundColor: c.overlay, justifyContent: 'flex-end', zIndex: 50},
  pickerSheet: {backgroundColor: c.bgSoft, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderColor: c.border, padding: spacing.lg, maxHeight: '75%'},
  pickerHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md},
  pickerTitle: {color: c.text, fontSize: 18, fontWeight: '700', fontFamily: 'serif'},
  pickerEmpty: {color: c.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: spacing.xl},
  pickerRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderSoft},
  pickerRowIcon: {width: 36, height: 36, borderRadius: 10, backgroundColor: c.goldFaint, alignItems: 'center', justifyContent: 'center'},
  pickerRowTitle: {color: c.text, fontSize: 14, fontWeight: '700'},
  pickerRowSub: {color: c.textMuted, fontSize: 12, marginTop: 1, textTransform: 'capitalize'},
});
