import React, {useState} from 'react';
import {
  Alert,
  Image,
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
import {Chip} from '../../components/ui/Chip';
import {Loader} from '../../components/ui/Loader';
import {createProperty} from '../../lib/properties';
import {uploadImage} from '../../lib/imagekit';
import {apiErrorMessage} from '../../lib/api';
import {radius, spacing, useThemedStyles} from '../../theme';

const TYPES = ['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'];

export function PostPropertyScreen({navigation}) {
  const styles = useThemedStyles(makeStyles);
  const qc = useQueryClient();
  const [images, setImages] = useState([]); // {uri, uploading, url}
  const [form, setForm] = useState({
    title: '',
    type: 'apartment',
    listingType: 'buy',
    price: '',
    city: '',
    locality: '',
    bhk: '',
    bathrooms: '',
    carpetArea: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  async function pickImages() {
    const res = await launchImageLibrary({mediaType: 'photo', selectionLimit: 6, quality: 0.8});
    if (res.didCancel || !res.assets?.length) return;

    const picked = res.assets.map(a => ({uri: a.uri, uploading: true, url: null}));
    setImages(prev => [...prev, ...picked]);

    // upload each to ImageKit, then swap in the hosted url
    picked.forEach(async p => {
      try {
        const {url} = await uploadImage(p.uri);
        setImages(prev => prev.map(it => (it.uri === p.uri ? {...it, uploading: false, url} : it)));
      } catch {
        setImages(prev => prev.filter(it => it.uri !== p.uri));
        Alert.alert('Upload failed', 'Ek photo upload nahi ho payi.');
      }
    });
  }

  function removeImage(uri) {
    setImages(prev => prev.filter(it => it.uri !== uri));
  }

  async function onSubmit() {
    setError('');
    if (!form.title.trim()) return setError('Title zaroori hai.');
    if (!form.price || Number.isNaN(Number(form.price))) return setError('Valid price daalein.');
    if (images.some(i => i.uploading)) return setError('Photos upload ho rahi hain, ruk jao…');

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        listingType: form.listingType,
        price: Number(form.price),
        currency: 'USD',
        ...(form.city ? {city: form.city.trim()} : {}),
        ...(form.locality ? {locality: form.locality.trim()} : {}),
        ...(form.bhk ? {bhk: parseInt(form.bhk, 10)} : {}),
        ...(form.bathrooms ? {bathrooms: parseInt(form.bathrooms, 10)} : {}),
        ...(form.carpetArea ? {carpetArea: Number(form.carpetArea)} : {}),
        ...(form.description ? {description: form.description.trim()} : {}),
        imageUrls: images.map(i => i.url).filter(Boolean),
      };
      await createProperty(payload);
      qc.invalidateQueries({queryKey: ['my-properties']});
      qc.invalidateQueries({queryKey: ['properties']});
      Alert.alert('Submitted ✓', 'Aapki listing review ke liye bhej di gayi hai. Verify hone par live ho jayegi.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e) {
      setError(apiErrorMessage(e, 'Post failed. Try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>PHOTOS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            <Pressable style={styles.addPhoto} onPress={pickImages}>
              <Text style={styles.addPhotoPlus}>＋</Text>
              <Text style={styles.addPhotoText}>Add</Text>
            </Pressable>
            {images.map(img => (
              <View key={img.uri} style={styles.thumb}>
                <Image source={{uri: img.url || img.uri}} style={styles.thumbImg} />
                {img.uploading ? (
                  <View style={styles.thumbOverlay}>
                    <Loader size={28} color="#fff" />
                  </View>
                ) : (
                  <Pressable style={styles.thumbRemove} onPress={() => removeImage(img.uri)} hitSlop={6}>
                    <Text style={styles.thumbRemoveText}>✕</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </ScrollView>

          <Input label="TITLE" value={form.title} onChangeText={v => set('title', v)} placeholder="e.g. Sea-facing 3BHK in Bandra" />

          <Text style={styles.label}>LISTING TYPE</Text>
          <View style={styles.chipRow}>
            <Chip label="For Sale" active={form.listingType === 'buy'} onPress={() => set('listingType', 'buy')} style={styles.flexChip} />
            <Chip label="For Rent" active={form.listingType === 'rent'} onPress={() => set('listingType', 'rent')} style={styles.flexChip} />
          </View>

          <Text style={styles.label}>PROPERTY TYPE</Text>
          <View style={styles.chipWrap}>
            {TYPES.map(t => (
              <Chip key={t} label={t} active={form.type === t} onPress={() => set('type', t)} />
            ))}
          </View>

          <Input label="PRICE (USD)" value={form.price} onChangeText={v => set('price', v)} keyboardType="numeric" placeholder="250000" icon="$" />

          <View style={styles.twoCol}>
            <Input label="CITY" value={form.city} onChangeText={v => set('city', v)} placeholder="Mumbai" containerStyle={styles.col} />
            <Input label="LOCALITY" value={form.locality} onChangeText={v => set('locality', v)} placeholder="Bandra West" containerStyle={styles.col} />
          </View>

          <View style={styles.threeCol}>
            <Input label="BHK" value={form.bhk} onChangeText={v => set('bhk', v)} keyboardType="numeric" placeholder="3" containerStyle={styles.col} />
            <Input label="BATH" value={form.bathrooms} onChangeText={v => set('bathrooms', v)} keyboardType="numeric" placeholder="2" containerStyle={styles.col} />
            <Input label="AREA ft²" value={form.carpetArea} onChangeText={v => set('carpetArea', v)} keyboardType="numeric" placeholder="1200" containerStyle={styles.col} />
          </View>

          <Input
            label="DESCRIPTION"
            value={form.description}
            onChangeText={v => set('description', v)}
            placeholder="Describe the property…"
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Submit for Review" size="lg" onPress={onSubmit} loading={submitting} style={styles.submit} />
          <Text style={styles.note}>Listings go live publicly once our team verifies them.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = c =>
  StyleSheet.create({
  root: {flex: 1, backgroundColor: c.bg},
  flex: {flex: 1},
  scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
  label: {color: c.textMuted, fontSize: 12.5, fontWeight: '600', letterSpacing: 0.4, marginBottom: 6, marginTop: spacing.xs},
  photoRow: {gap: spacing.sm, paddingBottom: spacing.md},
  addPhoto: {width: 88, height: 88, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed', backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center'},
  addPhotoPlus: {color: c.gold, fontSize: 26},
  addPhotoText: {color: c.textMuted, fontSize: 12},
  thumb: {width: 88, height: 88, borderRadius: radius.md, overflow: 'hidden', backgroundColor: c.surface2},
  thumbImg: {width: '100%', height: '100%'},
  thumbOverlay: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center'},
  thumbRemove: {position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center'},
  thumbRemoveText: {color: '#fff', fontSize: 12, fontWeight: '700'},
  chipRow: {flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md},
  flexChip: {flex: 1},
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md},
  twoCol: {flexDirection: 'row', gap: spacing.sm},
  threeCol: {flexDirection: 'row', gap: spacing.sm},
  col: {flex: 1},
  textarea: {height: 110, textAlignVertical: 'top', paddingTop: spacing.sm},
  error: {color: c.danger, marginBottom: spacing.sm, fontSize: 13},
  submit: {marginTop: spacing.sm},
  note: {color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.md},
  });
