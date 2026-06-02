import React, {useRef, useState} from 'react';
import {
  Alert,
  Animated,
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
import {Icon} from '../../components/ui/Icon';
import {Loader} from '../../components/ui/Loader';
import {createProperty} from '../../lib/properties';
import {uploadImage} from '../../lib/imagekit';
import {apiErrorMessage} from '../../lib/api';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const STEPS = [
  {icon: 'tag',     label: 'Basic Info',  desc: 'Title, type & price'},
  {icon: 'map-pin', label: 'Location',    desc: 'City & address'},
  {icon: 'ruler',   label: 'Details',     desc: 'Rooms, size & features'},
  {icon: 'check',   label: 'Amenities',   desc: 'Facilities'},
  {icon: 'layers',  label: 'Photos',      desc: 'Property images'},
  {icon: 'user',    label: 'Contact',     desc: 'Owner details'},
];

const TYPES = [
  {key: 'apartment',  label: 'Apartment',  emoji: '🏢'},
  {key: 'villa',      label: 'Villa',      emoji: '🏡'},
  {key: 'plot',       label: 'Plot',       emoji: '🌿'},
  {key: 'commercial', label: 'Commercial', emoji: '🏬'},
  {key: 'office',     label: 'Office',     emoji: '🏛'},
  {key: 'shop',       label: 'Shop',       emoji: '🛍'},
];

const CURRENCIES = ['USD', 'INR', 'AED', 'GBP', 'EUR', 'SGD'];
const FURNISHING = ['unfurnished', 'semi_furnished', 'furnished'];
const FACING = ['north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west'];
const AGES = ['Under construction', 'New (0-1 year)', '1-5 years', '5-10 years', '10+ years'];

const AMENITIES = [
  {group: 'Basics',           items: ['Parking', 'Lift', 'CCTV', 'Security Guard', '24x7 Water', 'Power Backup']},
  {group: 'Fitness',          items: ['Swimming Pool', 'Gym', 'Yoga Room', 'Jogging Track', 'Club House', 'Kids Play Area']},
  {group: 'Outdoors',         items: ['Garden', 'Terrace', 'Rooftop Access', 'BBQ Area', 'Pet Zone']},
  {group: 'Tech & Utilities', items: ['High-Speed WiFi', 'Smart Home', 'EV Charging', 'Solar Panels', 'Rainwater Harvesting']},
  {group: 'Nearby',           items: ['Shopping Centre', 'School', 'Hospital', 'Metro', 'Airport']},
];

const NUM_KEYS = ['price','bhk','bathrooms','balconies','superBuiltUpArea','carpetArea','plotArea','floorNumber','totalFloors'];

const EMPTY = {
  title:'', type:'apartment', listingType:'buy', description:'',
  price:'', currency:'INR', priceNegotiable:false, featured:false,
  country:'India', state:'', city:'', locality:'', address:'', landmark:'', pincode:'',
  bhk:'', bathrooms:'', balconies:'',
  superBuiltUpArea:'', carpetArea:'', plotArea:'',
  floorNumber:'', totalFloors:'', propertyAge:'', furnishing:'', facing:'',
  amenities:[],
  ownerName:'', ownerPhone:'', ownerWhatsapp:'', ownerEmail:'', agencyName:'',
};

export function PostPropertyScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const progress = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  function goStep(n) {
    Animated.timing(progress, {
      toValue: n / (STEPS.length - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
    setStep(n);
    setError('');
    scrollRef.current?.scrollTo({y: 0, animated: false});
  }

  function validate() {
    if (step === 0) {
      if (!form.title.trim()) return 'Property title is required.';
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
        return 'Enter a valid price.';
    }
    if (step === 4 && images.some(i => i.uploading))
      return 'Photos are still uploading, please wait.';
    return '';
  }

  function next() {
    Keyboard.dismiss();
    const err = validate();
    if (err) { setError(err); return; }
    goStep(Math.min(step + 1, STEPS.length - 1));
  }

  function prev() {
    Keyboard.dismiss();
    if (step === 0) navigation.goBack();
    else goStep(step - 1);
  }

  async function pickImages() {
    const res = await launchImageLibrary({mediaType: 'photo', selectionLimit: 8, quality: 0.85});
    if (res.didCancel || !res.assets?.length) return;
    const picked = res.assets.map(a => ({uri: a.uri, uploading: true, url: null}));
    setImages(prev => [...prev, ...picked]);
    picked.forEach(async p => {
      try {
        const {url} = await uploadImage(p.uri);
        setImages(prev => prev.map(it => it.uri === p.uri ? {...it, uploading: false, url} : it));
      } catch {
        setImages(prev => prev.filter(it => it.uri !== p.uri));
        Alert.alert('Upload failed', 'Could not upload this photo.');
      }
    });
  }

  function removeImage(uri) {
    setImages(prev => prev.filter(it => it.uri !== uri));
  }

  function toggleAmenity(a) {
    set('amenities', form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a]);
  }

  async function onSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      const payload = {...form};
      NUM_KEYS.forEach(k => {
        payload[k] = payload[k] === '' || payload[k] == null ? undefined : Number(payload[k]);
      });
      ['furnishing','facing','propertyAge','state','address','landmark','pincode',
       'ownerName','ownerPhone','ownerWhatsapp','ownerEmail','agencyName'].forEach(k => {
        if (!payload[k]) payload[k] = undefined;
      });
      payload.imageUrls = images.map(i => i.url).filter(Boolean);
      await createProperty(payload);
      qc.invalidateQueries({queryKey: ['my-properties']});
      qc.invalidateQueries({queryKey: ['properties']});
      qc.invalidateQueries({queryKey: ['notifications']});
      Alert.alert('Submitted!', 'Your listing is under review. It goes live once verified.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e) {
      setError(apiErrorMessage(e, 'Submit failed. Try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  const progressW = progress.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']});

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} hitSlop={10} onPress={prev}>
          <Icon name="chevron-left" size={22} color={c.text} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>{STEPS[step].label}</Text>
          <Text style={styles.headerSub}>{STEPS[step].desc}</Text>
        </View>
        <Text style={styles.stepBadge}>{step + 1}/{STEPS.length}</Text>
      </View>

      {/* progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, {width: progressW}]} />
      </View>

      {/* step indicator */}
      <View style={styles.stepRow}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={i}>
              <Pressable onPress={() => i <= step && goStep(i)} style={styles.stepItem}>
                <View style={[styles.stepCircle, active && styles.stepCircleActive, done && styles.stepCircleDone]}>
                  {done
                    ? <Icon name="check" size={11} color="#fff" strokeWidth={2.6} />
                    : <Text style={[styles.stepNum, (active || done) && styles.stepNumActive]}>{i + 1}</Text>}
                </View>
                {active && <Text style={styles.stepLabel}>{s.label}</Text>}
              </Pressable>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* content */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {step === 0 && <StepBasic   form={form} set={set} styles={styles} c={c} />}
          {step === 1 && <StepLocation form={form} set={set} styles={styles} />}
          {step === 2 && <StepDetails  form={form} set={set} styles={styles} c={c} />}
          {step === 3 && <StepAmenities form={form} toggleAmenity={toggleAmenity} styles={styles} c={c} />}
          {step === 4 && <StepPhotos images={images} pickImages={pickImages} removeImage={removeImage} styles={styles} c={c} />}
          {step === 5 && <StepContact form={form} set={set} images={images} styles={styles} c={c} />}

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="x" size={15} color={c.danger} strokeWidth={2.4} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* footer */}
      <View style={styles.footer}>
        <Pressable style={styles.prevBtn} onPress={prev}>
          <Icon name="chevron-left" size={16} color={c.textDim} strokeWidth={2.2} />
          <Text style={styles.prevText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
        </Pressable>

        <View style={styles.footerDots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.footDot, i === step && styles.footDotActive, i < step && styles.footDotDone]} />
          ))}
        </View>

        <Pressable style={[styles.nextBtn, submitting && {opacity: 0.6}]}
          onPress={step < STEPS.length - 1 ? next : onSubmit} disabled={submitting}>
          {submitting ? (
            <Loader size={20} color={c.onGold} />
          ) : (
            <>
              <Text style={styles.nextText}>{step < STEPS.length - 1 ? 'Next' : 'Submit'}</Text>
              <Icon name={step < STEPS.length - 1 ? 'chevron-right' : 'check'} size={16} color={c.onGold} strokeWidth={2.4} />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ── steps ─────────────────────────────────────────────────────────────────────
function StepBasic({form, set, styles, c}) {
  return (
    <>
      <Card styles={styles}>
        <Input label="PROPERTY TITLE *" value={form.title} onChangeText={v => set('title', v)}
          placeholder="e.g. 3BHK Sea-facing Apartment" icon="home" compact />
        <Input label="DESCRIPTION" value={form.description} onChangeText={v => set('description', v)}
          placeholder="Highlights, location, key features…"
          multiline numberOfLines={4} style={styles.textarea} />
      </Card>

      <SLabel top>LISTING TYPE</SLabel>
      <Card styles={styles}>
        <View style={styles.segment}>
          {[{key:'buy',label:'For Sale'},{key:'rent',label:'For Rent'}].map(o => (
            <Pressable key={o.key} onPress={() => set('listingType', o.key)}
              style={[styles.segItem, form.listingType === o.key && styles.segItemActive]}>
              <Text style={[styles.segText, form.listingType === o.key && styles.segTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <SLabel top>PROPERTY TYPE</SLabel>
      <View style={styles.typeGrid}>
        {TYPES.map(t => (
          <Pressable key={t.key} onPress={() => set('type', t.key)}
            style={[styles.typeCard, form.type === t.key && styles.typeCardActive]}>
            <Text style={styles.typeEmoji}>{t.emoji}</Text>
            <Text style={[styles.typeLabel, form.type === t.key && styles.typeLabelActive]}>{t.label}</Text>
            {form.type === t.key && (
              <View style={styles.typeCheck}>
                <Icon name="check" size={10} color="#fff" strokeWidth={2.6} />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <SLabel top>PRICING</SLabel>
      <Card styles={styles}>
        <SLabel>CURRENCY</SLabel>
        <View style={styles.pillsWrap}>
          {CURRENCIES.map(cur => (
            <Pressable key={cur} onPress={() => set('currency', cur)}
              style={[styles.miniPill, form.currency === cur && styles.miniPillActive]}>
              <Text style={[styles.miniPillText, form.currency === cur && styles.miniPillTextActive]}>{cur}</Text>
            </Pressable>
          ))}
        </View>
        <Input label="PRICE *" value={form.price} onChangeText={v => set('price', v)}
          keyboardType="numeric" placeholder="e.g. 9500000" icon="tag" compact />
        <View style={styles.togglesRow}>
          <Toggle label="Negotiable" value={form.priceNegotiable} onChange={v => set('priceNegotiable', v)} c={c} />
          <Toggle label="Featured" value={form.featured} onChange={v => set('featured', v)} c={c} />
        </View>
      </Card>
    </>
  );
}

function StepLocation({form, set, styles}) {
  return (
    <>
      <SLabel top>REGION</SLabel>
      <Card styles={styles}>
        <View style={styles.row2}>
          <Input label="CITY *" value={form.city} onChangeText={v => set('city', v)}
            placeholder="Mumbai" icon="map-pin" compact containerStyle={styles.col} />
          <Input label="LOCALITY" value={form.locality} onChangeText={v => set('locality', v)}
            placeholder="Bandra West" compact containerStyle={styles.col} />
        </View>
        <View style={styles.row2}>
          <Input label="STATE" value={form.state} onChangeText={v => set('state', v)}
            placeholder="Maharashtra" compact containerStyle={styles.col} />
          <Input label="COUNTRY" value={form.country} onChangeText={v => set('country', v)}
            placeholder="India" compact containerStyle={styles.col} />
        </View>
      </Card>

      <SLabel top>ADDRESS</SLabel>
      <Card styles={styles}>
        <Input label="FULL ADDRESS" value={form.address} onChangeText={v => set('address', v)}
          placeholder="Street, building name…" compact />
        <Input label="LANDMARK" value={form.landmark} onChangeText={v => set('landmark', v)}
          placeholder="Near landmark" compact />
        <Input label="PINCODE" value={form.pincode} onChangeText={v => set('pincode', v)}
          placeholder="400050" keyboardType="numeric" compact />
      </Card>
    </>
  );
}

function StepDetails({form, set, styles, c}) {
  return (
    <>
      <SLabel top>ROOMS</SLabel>
      <Card styles={styles}>
        <CounterRow label="Bedrooms (BHK)" icon="bed" value={form.bhk} onChange={v => set('bhk', String(v))} />
        <CounterRow label="Bathrooms" icon="bath" value={form.bathrooms} onChange={v => set('bathrooms', String(v))} />
        <CounterRow label="Balconies" icon="layers" value={form.balconies} onChange={v => set('balconies', String(v))} last />
      </Card>

      <SLabel top>AREA (SQ. FT)</SLabel>
      <Card styles={styles}>
        <Input label="CARPET AREA" value={form.carpetArea} onChangeText={v => set('carpetArea', v)}
          placeholder="1100" keyboardType="numeric" icon="ruler" compact />
        <Input label="SUPER BUILT-UP AREA" value={form.superBuiltUpArea} onChangeText={v => set('superBuiltUpArea', v)}
          placeholder="1450" keyboardType="numeric" compact />
        <Input label="PLOT AREA" value={form.plotArea} onChangeText={v => set('plotArea', v)}
          placeholder="0" keyboardType="numeric" compact />
      </Card>

      <SLabel top>BUILDING</SLabel>
      <Card styles={styles}>
        <Input label="FLOOR NUMBER" value={form.floorNumber} onChangeText={v => set('floorNumber', v)}
          placeholder="8" keyboardType="numeric" icon="building" compact />
        <Input label="TOTAL FLOORS" value={form.totalFloors} onChangeText={v => set('totalFloors', v)}
          placeholder="22" keyboardType="numeric" compact />
        <SLabel>PROPERTY AGE</SLabel>
        <View style={styles.pillsWrap}>
          {AGES.map(a => (
            <Pressable key={a} onPress={() => set('propertyAge', a)}
              style={[styles.miniPill, form.propertyAge === a && styles.miniPillActive]}>
              <Text style={[styles.miniPillText, form.propertyAge === a && styles.miniPillTextActive]}>{a}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <SLabel top>INTERIOR</SLabel>
      <Card styles={styles}>
        <SLabel>FURNISHING</SLabel>
        <View style={styles.pillsWrap}>
          {FURNISHING.map(f => {
            const label = f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <Pressable key={f} onPress={() => set('furnishing', f)}
                style={[styles.miniPill, form.furnishing === f && styles.miniPillActive]}>
                <Text style={[styles.miniPillText, form.furnishing === f && styles.miniPillTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <SLabel>FACING</SLabel>
        <View style={styles.pillsWrap}>
          {FACING.map(f => {
            const label = f.replace(/_/g, ' ').toUpperCase();
            return (
              <Pressable key={f} onPress={() => set('facing', f)}
                style={[styles.miniPill, form.facing === f && styles.miniPillActive]}>
                <Text style={[styles.miniPillText, form.facing === f && styles.miniPillTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </>
  );
}

function StepAmenities({form, toggleAmenity, styles, c}) {
  return (
    <>
      {form.amenities.length > 0 && (
        <View style={styles.amenBadge}>
          <Icon name="check" size={13} color={c.gold} strokeWidth={2.6} />
          <Text style={styles.amenBadgeText}>{form.amenities.length} selected</Text>
        </View>
      )}
      {AMENITIES.map(group => (
        <React.Fragment key={group.group}>
          <SLabel top>{group.group.toUpperCase()}</SLabel>
          <View style={styles.pillsWrap}>
            {group.items.map(a => (
              <Pressable key={a} onPress={() => toggleAmenity(a)}
                style={[styles.amenChip, form.amenities.includes(a) && styles.amenChipActive]}>
                {form.amenities.includes(a) && (
                  <Icon name="check" size={11} color={c.gold} strokeWidth={2.6} />
                )}
                <Text style={[styles.amenChipText, form.amenities.includes(a) && styles.amenChipTextActive]}>{a}</Text>
              </Pressable>
            ))}
          </View>
        </React.Fragment>
      ))}
    </>
  );
}

function StepPhotos({images, pickImages, removeImage, styles, c}) {
  return (
    <>
      <Pressable style={styles.addPhotoBtn} onPress={pickImages}>
        <View style={styles.addPhotoCircle}>
          <Icon name="plus" size={26} color={c.gold} strokeWidth={2.4} />
        </View>
        <Text style={styles.addPhotoTitle}>Add photos</Text>
        <Text style={styles.addPhotoSub}>Pick from gallery · up to 8</Text>
      </Pressable>

      {images.length > 0 && (
        <View style={styles.photoGrid}>
          {images.map((img, idx) => (
            <View key={img.uri} style={styles.photoCell}>
              <Image source={{uri: img.url || img.uri}} style={styles.photoImg} />
              {idx === 0 && !img.uploading && (
                <View style={styles.coverTag}><Text style={styles.coverTagText}>Cover</Text></View>
              )}
              {img.uploading ? (
                <View style={styles.photoOverlay}><Loader size={24} color="#fff" /></View>
              ) : (
                <Pressable style={styles.photoRemove} onPress={() => removeImage(img.uri)} hitSlop={6}>
                  <Icon name="x" size={12} color="#fff" strokeWidth={2.4} />
                </Pressable>
              )}
            </View>
          ))}
          {images.length < 8 && (
            <Pressable style={styles.addMore} onPress={pickImages}>
              <Icon name="plus" size={20} color={c.textMuted} />
            </Pressable>
          )}
        </View>
      )}
      <Text style={styles.photoHint}>First photo becomes the cover image.</Text>
    </>
  );
}

function StepContact({form, set, images, styles, c}) {
  return (
    <>
      <SLabel top>CONTACT DETAILS</SLabel>
      <Card styles={styles}>
        <Input label="OWNER / CONTACT NAME" value={form.ownerName} onChangeText={v => set('ownerName', v)}
          placeholder="Full name" icon="user" compact />
        <Input label="AGENCY NAME" value={form.agencyName} onChangeText={v => set('agencyName', v)}
          placeholder="Agency name" compact />
        <Input label="PHONE" value={form.ownerPhone} onChangeText={v => set('ownerPhone', v)}
          placeholder="+91 98765 43210" keyboardType="phone-pad" icon="phone" compact />
        <Input label="WHATSAPP" value={form.ownerWhatsapp} onChangeText={v => set('ownerWhatsapp', v)}
          placeholder="Same as phone? Leave blank" keyboardType="phone-pad" compact />
        <Input label="EMAIL" value={form.ownerEmail} onChangeText={v => set('ownerEmail', v)}
          placeholder="Email address" keyboardType="email-address"
          autoCapitalize="none" icon="mail" compact />
      </Card>

      <SLabel top>SUMMARY</SLabel>
      <Card styles={styles}>
        {[
          ['Title',     form.title || '—'],
          ['Type',      form.type],
          ['Listing',   form.listingType === 'buy' ? 'For Sale' : 'For Rent'],
          ['Price',     form.price ? `${form.currency} ${Number(form.price).toLocaleString()}` : '—'],
          ['City',      form.city || '—'],
          ['BHK',       form.bhk || '—'],
          ['Photos',    `${images?.length || 0} added`],
          ['Amenities', `${form.amenities.length} selected`],
        ].map(([k, v], i, arr) => (
          <View key={k} style={[styles.sumRow, i === arr.length - 1 && {borderBottomWidth: 0}]}>
            <Text style={styles.sumKey}>{k}</Text>
            <Text style={styles.sumVal} numberOfLines={1}>{String(v)}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.submitNote}>
        <Icon name="check" size={14} color={c.gold} strokeWidth={2.6} />
        <Text style={styles.submitNoteText}>Goes live once our team verifies it — usually within 24 hours.</Text>
      </View>
    </>
  );
}

// ── shared ────────────────────────────────────────────────────────────────────
function Card({children, styles}) {
  return <View style={styles.card}>{children}</View>;
}

function SLabel({children, top}) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={[styles.sLabel, top && styles.sLabelTop]}>{children}</Text>;
}

function CounterRow({label, icon, value, onChange, last}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const n = parseInt(value, 10) || 0;
  return (
    <View style={[styles.counterRow, last && {borderBottomWidth: 0}]}>
      <View style={styles.counterLeft}>
        <View style={styles.counterIcon}>
          <Icon name={icon} size={15} color={c.gold} />
        </View>
        <Text style={styles.counterLabel}>{label}</Text>
      </View>
      <View style={styles.counterControl}>
        <Pressable style={[styles.counterBtn, n === 0 && styles.counterBtnDim]}
          onPress={() => onChange(Math.max(0, n - 1))} hitSlop={8}>
          <Text style={styles.counterBtnText}>−</Text>
        </Pressable>
        <Text style={styles.counterVal}>{n}</Text>
        <Pressable style={styles.counterBtn} onPress={() => onChange(n + 1)} hitSlop={8}>
          <Text style={styles.counterBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Toggle({label, value, onChange, c}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={() => onChange(!value)}
      style={[styles.toggleBtn, value && styles.toggleBtnOn]}>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
      <Text style={[styles.toggleLabel, value && {color: c.gold}]}>{label}</Text>
    </Pressable>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const makeStyles = c => StyleSheet.create({
  root: {flex: 1, backgroundColor: c.bg},
  flex: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingTop: 4, paddingBottom: spacing.xs},
  backBtn: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  headerMid: {flex: 1, paddingHorizontal: spacing.sm},
  headerTitle: {color: c.text, fontSize: 17, fontWeight: '700'},
  headerSub: {color: c.textMuted, fontSize: 12, marginTop: 1},
  stepBadge: {color: c.textMuted, fontSize: 13, fontWeight: '600'},
  progressTrack: {height: 3, backgroundColor: c.borderSoft, marginHorizontal: spacing.md},
  progressFill: {height: 3, backgroundColor: c.gold, borderRadius: 2},

  // step indicator
  stepRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 8},
  stepItem: {alignItems: 'center', gap: 3},
  stepCircle: {width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center'},
  stepCircleActive: {backgroundColor: c.gold, borderColor: c.gold},
  stepCircleDone: {backgroundColor: c.success, borderColor: c.success},
  stepNum: {color: c.textMuted, fontSize: 12, fontWeight: '800'},
  stepNumActive: {color: '#fff'},
  stepLabel: {color: c.gold, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.3},
  stepLine: {flex: 1, height: 2, backgroundColor: c.border, marginBottom: 12},
  stepLineDone: {backgroundColor: c.success},

  scroll: {paddingHorizontal: spacing.md, paddingTop: 2, paddingBottom: spacing.xxl},
  card: {backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSoft, padding: spacing.md, gap: spacing.sm + 2, marginBottom: 2},
  sLabel: {color: c.textMuted, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.5, marginBottom: 7},
  sLabelTop: {marginTop: spacing.md},

  // type grid
  typeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: 2},
  typeCard: {width: '30.8%', aspectRatio: 1.1, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', gap: 4},
  typeCardActive: {borderColor: c.gold, backgroundColor: c.goldFaint},
  typeEmoji: {fontSize: 24},
  typeLabel: {color: c.textDim, fontSize: 12, fontWeight: '600'},
  typeLabelActive: {color: c.gold, fontWeight: '700'},
  typeCheck: {position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: 9, backgroundColor: c.gold, alignItems: 'center', justifyContent: 'center'},

  // segment
  segment: {flexDirection: 'row', backgroundColor: c.bg, borderRadius: radius.md, padding: 3, borderWidth: 1, borderColor: c.border},
  segItem: {flex: 1, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center'},
  segItemActive: {backgroundColor: c.gold},
  segText: {color: c.textDim, fontSize: 14, fontWeight: '600'},
  segTextActive: {color: c.onGold, fontWeight: '700'},

  // pills
  pillsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm},
  miniPill: {paddingHorizontal: 12, height: 34, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center'},
  miniPillActive: {borderColor: c.gold, backgroundColor: c.goldFaint},
  miniPillText: {color: c.textDim, fontSize: 12.5, fontWeight: '600'},
  miniPillTextActive: {color: c.gold, fontWeight: '700'},

  // toggles
  togglesRow: {flexDirection: 'row', gap: spacing.sm},
  row2: {flexDirection: 'row', gap: spacing.sm},
  col: {flex: 1},
  toggleBtn: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface},
  toggleBtnOn: {borderColor: c.goldGlow, backgroundColor: c.goldFaint},
  toggleTrack: {width: 36, height: 20, borderRadius: 10, backgroundColor: c.border, justifyContent: 'center', paddingHorizontal: 2},
  toggleTrackOn: {backgroundColor: c.gold},
  toggleThumb: {width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', alignSelf: 'flex-start'},
  toggleThumbOn: {alignSelf: 'flex-end'},
  toggleLabel: {flex: 1, color: c.textDim, fontSize: 13, fontWeight: '600'},

  // counter
  counterRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: c.borderSoft},
  counterLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  counterIcon: {width: 30, height: 30, borderRadius: 8, backgroundColor: c.goldFaint, alignItems: 'center', justifyContent: 'center'},
  counterLabel: {color: c.text, fontSize: 14.5, fontWeight: '500'},
  counterControl: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  counterBtn: {width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: c.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: c.goldFaint},
  counterBtnDim: {borderColor: c.border, backgroundColor: c.surface},
  counterBtnText: {color: c.gold, fontSize: 18, fontWeight: '700', lineHeight: 22},
  counterVal: {color: c.text, fontSize: 18, fontWeight: '800', minWidth: 30, textAlign: 'center'},

  // amenities
  amenBadge: {flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: c.goldFaint, borderWidth: 1, borderColor: c.goldGlow, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm},
  amenBadgeText: {color: c.gold, fontSize: 13, fontWeight: '700'},
  amenChip: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface},
  amenChipActive: {borderColor: c.gold, backgroundColor: c.goldFaint},
  amenChipText: {color: c.textDim, fontSize: 13, fontWeight: '600'},
  amenChipTextActive: {color: c.gold, fontWeight: '700'},

  // photos
  addPhotoBtn: {borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed', borderRadius: radius.lg, paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm, backgroundColor: c.surface, marginBottom: spacing.md},
  addPhotoCircle: {width: 56, height: 56, borderRadius: 28, backgroundColor: c.goldFaint, alignItems: 'center', justifyContent: 'center'},
  addPhotoTitle: {color: c.text, fontSize: 16, fontWeight: '700'},
  addPhotoSub: {color: c.textMuted, fontSize: 13},
  photoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm},
  photoCell: {width: '31%', aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: c.surface2},
  photoImg: {width: '100%', height: '100%'},
  photoOverlay: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center'},
  photoRemove: {position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center'},
  coverTag: {position: 'absolute', bottom: 4, left: 4, backgroundColor: c.gold, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2},
  coverTagText: {color: c.onGold, fontSize: 9, fontWeight: '800', textTransform: 'uppercase'},
  addMore: {width: '31%', aspectRatio: 1, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed', backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center'},
  photoHint: {color: c.textMuted, fontSize: 12, marginTop: spacing.xs},

  // summary/contact
  sumRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.borderSoft},
  sumKey: {color: c.textMuted, fontSize: 13, width: 80},
  sumVal: {color: c.text, fontSize: 13.5, fontWeight: '700', flex: 1, textTransform: 'capitalize'},
  submitNote: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: spacing.md, backgroundColor: c.goldFaint, borderWidth: 1, borderColor: c.goldGlow, borderRadius: radius.md, padding: spacing.md},
  submitNoteText: {color: c.gold, fontSize: 13, lineHeight: 18, flex: 1, fontWeight: '600'},

  // misc
  textarea: {height: 100, textAlignVertical: 'top', paddingTop: spacing.sm},
  errorBox: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,107,107,0.1)', borderWidth: 1, borderColor: 'rgba(239,107,107,0.3)', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md, marginTop: spacing.xs},
  errorText: {color: c.danger, fontSize: 13, flex: 1},

  // footer
  footer: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: c.borderSoft, backgroundColor: c.bgSoft},
  prevBtn: {flexDirection: 'row', alignItems: 'center', gap: 2},
  prevText: {color: c.textDim, fontSize: 15, fontWeight: '600'},
  footerDots: {flexDirection: 'row', gap: 5, alignItems: 'center'},
  footDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: c.border},
  footDotActive: {width: 18, backgroundColor: c.gold},
  footDotDone: {backgroundColor: c.success},
  nextBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.gold, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: 12},
  nextText: {color: c.onGold, fontSize: 15, fontWeight: '800'},
});
