import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView,
  TouchableOpacity, Switch, ActivityIndicator, Image, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import useAuth from '../../hooks/useAuth';
import useProfile from '../../hooks/useProfile';
import { updateUser, updatePreferences, deleteUser, uploadAvatar, deleteAvatar } from '../../api/auth.api';
import { validateUsername } from '../../utils/validators';
import { colors, shadowSm } from '../../utils/theme';

// ─── Constants ───────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Settings'];

const TRAVEL_STYLES = ['Beach', 'Mountain', 'City', 'Nature', 'Luxury', 'Budget', 'Adventure', 'Cultural'];

const TIER_LEVELS = [
  { label: 'Silver', minPts: 0,     icon: '🥈' },
  { label: 'Gold',   minPts: 2000,  icon: '🥇' },
  { label: 'Plat',   minPts: 5000,  icon: '💎' },
  { label: 'Elite',  minPts: 10000, icon: '👑' },
];

const getTierIndex = (pts) => {
  let idx = 0;
  TIER_LEVELS.forEach((t, i) => { if (pts >= t.minPts) idx = i; });
  return idx;
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={sh.action}>{action}</Text></TouchableOpacity>}
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:  { fontSize: 11, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 },
  action: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});

function SettingRow({ icon, label, sub, toggle, value, onToggle, onPress, danger }) {
  return (
    <TouchableOpacity style={sr.row} onPress={onPress} activeOpacity={toggle ? 1 : 0.7}>
      <View style={sr.iconWrap}><Text style={sr.icon}>{icon}</Text></View>
      <View style={sr.text}>
        <Text style={[sr.label, danger && { color: colors.danger }]}>{label}</Text>
        {sub && <Text style={sr.sub}>{sub}</Text>}
      </View>
      {toggle
        ? <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.primary + '88' }} thumbColor={value ? colors.primary : colors.textMuted} />
        : <Text style={sr.chevron}>›</Text>
      }
    </TouchableOpacity>
  );
}
const sr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceHigh, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  icon:    { fontSize: 16 },
  text:    { flex: 1 },
  label:   { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sub:     { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textMuted },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user: authUser, setUser: setAuthUser, logout } = useAuth();
  const { profile, loading, error, refetch } = useProfile();

  const [activeTab, setActiveTab] = useState(0);
  const tabAnim    = useRef(new Animated.Value(1)).current;
  const heroAnim   = useRef(new Animated.Value(0)).current;
  const heroSlide  = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(heroSlide, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();
  }, []);

  const handleTabChange = (index) => {
    if (index === activeTab) return;
    Animated.timing(tabAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setActiveTab(index);
      Animated.timing(tabAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  // Edit profile state
  const [username, setUsername]   = useState('');
  const [bio, setBio]             = useState('');
  const [phone, setPhone]         = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [saving, setSaving]       = useState(false);

  // Preferences state — initialized from real profile
  const [travelStyles, setTravelStyles] = useState([]);
  const [notifPush, setNotifPush]       = useState(true);
  const [notifEmail, setNotifEmail]     = useState(false);
  const [biometric, setBiometric]       = useState(false);
  const [prefSaving, setPrefSaving]     = useState(false);

  // Sync local state when profile loads
  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || '');
    setBio(profile.bio || '');
    setPhone(profile.phone || '');
    setTravelStyles(profile.preferences?.travelStyles || []);
    setNotifPush(profile.preferences?.notifications?.push ?? true);
    setNotifEmail(profile.preferences?.notifications?.email ?? false);
    setBiometric(profile.preferences?.biometric ?? false);
  }, [profile]);

  const initials       = profile?.username?.slice(0, 2).toUpperCase() || '??';
  const memberSince    = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '—';
  const lastSeenText   = profile?.lastSeen
    ? new Date(profile.lastSeen).toLocaleDateString()
    : 'Never';

  // Avatar state
  const [avatarUri,     setAvatarUri]     = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (profile?.profileImage) setAvatarUri(profile.profileImage);
  }, [profile?.profileImage]);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setAvatarUri(asset.uri); // show preview immediately

    try {
      setAvatarLoading(true);
      const { data } = await uploadAvatar({
        imageBase64: asset.base64,
        mimeType:    asset.mimeType || 'image/jpeg',
      });
      setAvatarUri(data.data.profileImage);
      await refetch();
      Alert.alert('Updated', 'Profile picture updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload profile picture.');
      setAvatarUri(profile?.profileImage || '');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDeleteAvatar = () => {
    Alert.alert('Remove Photo', 'Remove your profile picture?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          setAvatarLoading(true);
          await deleteAvatar();
          setAvatarUri('');
          await refetch();
        } catch {
          // Fallback: clear via updateUser
          await updateUser({ profileImage: '' });
          setAvatarUri('');
          await refetch();
        } finally {
          setAvatarLoading(false);
        }
      }},
    ]);
  };

  // Loyalty — derived from real login count as a proxy for points
  const points         = (profile?.loginHistory?.length || 0) * 100;
  const nextTierPts    = 5000;
  const progress       = Math.min(points / nextTierPts, 1);
  const tierIdx        = getTierIndex(points);
  const currentTier    = TIER_LEVELS[tierIdx];

  const toggleStyle = (label) => {
    setTravelStyles(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
  };

  const handleUpdate = async () => {
    const err = validateUsername(username);
    if (err) return setUsernameErr(err);
    setUsernameErr('');
    try {
      setSaving(true);
      const { data } = await updateUser({ username, bio, phone });
      setAuthUser(prev => ({ ...prev, username: data.data.username }));
      await refetch();
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setPrefSaving(true);
      await updatePreferences({
        travelStyles,
        notifications: { push: notifPush, email: notifEmail },
        biometric,
      });
      Alert.alert('Saved', 'Preferences updated.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setPrefSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Account', 'This will permanently erase your account and all data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Forever', style: 'destructive', onPress: async () => {
        try { await deleteUser(); await logout(); }
        catch (err) { Alert.alert('Error', err.response?.data?.message || 'Delete failed'); }
      }},
    ]);
  };

  // ── Tab: Overview ──────────────────────────────────────────────────────────
  const renderOverview = () => {
    if (loading) return (
      <View style={styles.section}>
        <SkeletonLoader height={120} borderRadius={20} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SkeletonLoader width="47%" height={90} borderRadius={16} />
          <SkeletonLoader width="47%" height={90} borderRadius={16} />
        </View>
      </View>
    );

    if (error) return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refetch}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
      </View>
    );

    return (
      <>
        {/* Loyalty */}
        <View style={styles.section}>
          <SectionHeader title="Loyalty Status" />
          <View style={styles.card}>
            <View style={styles.tierTrack}>
              {TIER_LEVELS.map((t, i) => (
                <View key={t.label} style={styles.tierStep}>
                  <View style={[styles.tierDot, i <= tierIdx && { backgroundColor: colors.primary }]}>
                    <Text style={styles.tierDotIcon}>{t.icon}</Text>
                  </View>
                  {i < TIER_LEVELS.length - 1 && (
                    <View style={[styles.tierLine, i < tierIdx && { backgroundColor: colors.primary }]} />
                  )}
                  <Text style={[styles.tierLabel, i === tierIdx && { color: colors.primary }]}>{t.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.loyaltyMeta}>
              <View>
                <Text style={styles.loyaltyPts}>{points.toLocaleString()} pts</Text>
                <Text style={styles.loyaltySub}>{Math.max(0, nextTierPts - points).toLocaleString()} pts to next tier</Text>
              </View>
              <View style={styles.loyaltyBadge}>
                <Text style={styles.loyaltyBadgeText}>{currentTier.icon} {currentTier.label}</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <SectionHeader title="Account Info" />
          <View style={styles.card}>
            {[
              { label: 'Email',        value: profile?.email || '—' },
              { label: 'Phone',        value: profile?.phone || 'Not set' },
              { label: 'Bio',          value: profile?.bio   || 'No bio yet' },
              { label: 'Member Since', value: `${memberSince}` },
              { label: 'Last Seen',    value: lastSeenText },
              { label: 'Verified',     value: profile?.isVerified ? 'Yes' : 'No' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Travel Style */}
        <View style={styles.section}>
          <SectionHeader title="Travel Style" />
          <View style={styles.prefGrid}>
            {TRAVEL_STYLES.map(s => {
              const active = travelStyles.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.prefChip, active && styles.prefChipActive]}
                  onPress={() => toggleStyle(s)}
                >
                  <Text style={[styles.prefLabel, active && styles.prefLabelActive]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button title="Save Preferences" onPress={handleSavePreferences} loading={prefSaving} style={{ marginTop: 12 }} />
        </View>
      </>
    );
  };

  // ── Tab: Settings ──────────────────────────────────────────────────────────
  const renderSettings = () => (
    <>
      <View style={styles.section}>
        <SectionHeader title="Profile Info" />
        <View style={styles.card}>
          <InputField icon="A" label="Display Name" placeholder="Your name" value={username} onChangeText={(v) => { setUsername(v); setUsernameErr(''); }} error={usernameErr} />
          <InputField icon="@" label="Email" placeholder="you@example.com" value={profile?.email || ''} onChangeText={() => {}} />
          <InputField icon="#" label="Phone" placeholder="+1 234 567 8900" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <InputField icon="…" label="Bio" placeholder="Tell us about yourself" value={bio} onChangeText={setBio} />
          {!profile?.isVerified && (
            <View style={styles.verifyBanner}>
              <View style={styles.verifyLeft}>
                <Text style={styles.verifyTitle}>Email not verified</Text>
                <Text style={styles.verifySub}>Verify your email to secure your account</Text>
              </View>
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={() => navigation.navigate('VerifyEmailSettings', { email: profile?.email })}
              >
                <Text style={styles.verifyBtnText}>Verify</Text>
              </TouchableOpacity>
            </View>
          )}
          {profile?.isVerified && (
            <View style={styles.verifiedBanner}>
              <Text style={styles.verifiedText}>✓  Email verified</Text>
            </View>
          )}
          <Button title="Save Changes" onPress={handleUpdate} loading={saving} style={{ marginTop: 8 }} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <SettingRow icon="🔔" label="Push Notifications" sub="Booking updates & alerts" toggle value={notifPush} onToggle={(v) => { setNotifPush(v); }} />
          <SettingRow icon="📧" label="Email Digest" sub="Weekly travel summary" toggle value={notifEmail} onToggle={(v) => { setNotifEmail(v); }} />
          <Button title="Save Notification Settings" onPress={handleSavePreferences} loading={prefSaving} style={{ marginTop: 12 }} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Security" />
        <View style={styles.card}>
          <SettingRow icon="🔑" label="Change Password"  sub="Update your password"          onPress={() => navigation.navigate('ChangePassword')} />
          <SettingRow icon="🧬" label="Biometric Login"  sub="Face ID / Fingerprint"         toggle value={biometric} onToggle={(v) => { setBiometric(v); handleSavePreferences(); }} />
          <SettingRow icon="🕐" label="Login History"    sub="View recent sign-in activity"  onPress={() => navigation.navigate('LoginHistory')} />
          <SettingRow icon="📋" label="Activity Log"     sub="All account actions"           onPress={() => navigation.navigate('ActivityLog')} />
          <SettingRow icon="📱" label="Active Sessions"  sub="Manage signed-in devices"      onPress={() => navigation.navigate('Sessions')} />
          <SettingRow icon="🔐" label="JWT Token Info"   sub="View your active auth tokens"  onPress={() => navigation.navigate('TokenInfo')} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Privacy & Data" />
        <View style={styles.card}>
          <SettingRow icon="🔒" label="Privacy Settings" sub="Control your visibility"       onPress={() => navigation.navigate('Privacy')} />
          <SettingRow icon="📦" label="Export My Data"   sub="Download a copy of your data"  onPress={() => navigation.navigate('ExportData')} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Danger Zone" />
        <View style={styles.card}>
          <SettingRow icon="🚪" label="Sign Out"         sub="You'll need to sign in again"  onPress={logout} />
          <SettingRow icon="🗑️" label="Delete Account"  sub="Permanently erase all data"    onPress={handleDelete} danger />
        </View>
      </View>
    </>
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <Animated.View style={[styles.heroBanner, { opacity: heroAnim, transform: [{ translateY: heroSlide }] }]}>
        <View style={styles.heroBg} />
        <View style={styles.heroContent}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <TouchableOpacity style={styles.avatar} onPress={handlePickAvatar} activeOpacity={0.85}>
                {avatarLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
              </TouchableOpacity>
            </View>
            {profile?.isActive && <View style={styles.onlineDot} />}
            {/* Camera badge */}
            <TouchableOpacity style={styles.cameraBadge} onPress={handlePickAvatar}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar action buttons */}
          <View style={styles.avatarActions}>
            <TouchableOpacity style={styles.avatarActionBtn} onPress={handlePickAvatar}>
              <Text style={styles.avatarActionText}>Change Photo</Text>
            </TouchableOpacity>
            {avatarUri ? (
              <TouchableOpacity style={[styles.avatarActionBtn, styles.avatarDeleteBtn]} onPress={handleDeleteAvatar}>
                <Text style={[styles.avatarActionText, { color: colors.danger }]}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.heroName}>{profile?.username || authUser?.username || '—'}</Text>
          <Text style={styles.heroEmail}>{profile?.email || authUser?.email || '—'}</Text>
          <View style={styles.heroBadgeRow}>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{currentTier?.icon} {currentTier?.label} Explorer</Text>
            </View>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>Member since {memberSince}</Text>
            </View>
          </View>
          {!profile?.isVerified && (
            <View style={styles.unverifiedBadge}>
              <Text style={styles.unverifiedText}>Email not verified</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={styles.tabItem} onPress={() => handleTabChange(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
            {activeTab === i && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={{ opacity: tabAnim }}>
        {activeTab === 0 && renderOverview()}
        {activeTab === 1 && renderSettings()}
      </Animated.View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 60 },

  heroBanner:     { position: 'relative', paddingBottom: 28 },
  heroBg:         { position: 'absolute', top: 0, left: 0, right: 0, height: 140, backgroundColor: colors.primary + '14' },
  heroContent:    { alignItems: 'center', paddingTop: 36, paddingHorizontal: 24 },
  avatarWrap:     { position: 'relative', marginBottom: 14 },
  avatarRing:     { padding: 3, borderRadius: 56, borderWidth: 2, borderColor: colors.primary },
  avatar:         { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surfaceHigh, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage:    { width: 96, height: 96, borderRadius: 48 },
  avatarText:     { fontSize: 30, color: colors.primary, fontWeight: '800' },
  onlineDot:      { position: 'absolute', bottom: 6, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.bg },
  cameraBadge:    { position: 'absolute', bottom: 0, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.bg },
  cameraIcon:     { fontSize: 13 },
  avatarActions:  { flexDirection: 'row', gap: 10, marginTop: 12 },
  avatarActionBtn:{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border },
  avatarDeleteBtn:{ borderColor: colors.danger + '55', backgroundColor: colors.danger + '11' },
  avatarActionText:{ fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  heroName:       { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  heroEmail:      { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  heroBadgeRow:   { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  tierBadge:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary + '55' },
  tierBadgeText:  { color: colors.primary, fontSize: 12, fontWeight: '700' },
  memberBadge:    { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.border },
  memberBadgeText:{ color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  unverifiedBadge:{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.warning + '22', borderWidth: 1, borderColor: colors.warning + '55' },
  unverifiedText: { color: colors.warning, fontSize: 11, fontWeight: '600' },

  tabBar:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 20, paddingHorizontal: 8 },
  tabItem:        { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabText:        { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabTextActive:  { color: colors.primary, fontWeight: '700' },
  tabIndicator:   { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, backgroundColor: colors.primary, borderRadius: 1 },

  section:        { marginHorizontal: 20, marginBottom: 20 },
  card:           { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, ...shadowSm },

  tierTrack:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  tierStep:       { flex: 1, alignItems: 'center', position: 'relative' },
  tierDot:        { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  tierDotIcon:    { fontSize: 16 },
  tierLine:       { position: 'absolute', top: 18, left: '60%', right: '-60%', height: 2, backgroundColor: colors.border, zIndex: -1 },
  tierLabel:      { fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  loyaltyMeta:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  loyaltyPts:     { fontSize: 20, fontWeight: '800', color: colors.primary },
  loyaltySub:     { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  loyaltyBadge:   { backgroundColor: colors.primary + '22', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  loyaltyBadgeText:{ color: colors.primary, fontSize: 13, fontWeight: '700' },
  progressTrack:  { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },

  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:      { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  infoValue:      { fontSize: 13, color: colors.textPrimary, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },

  prefGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prefChip:       { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  prefChipActive: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  prefLabel:      { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  prefLabelActive:{ color: colors.primary },

  errorBox:       { margin: 20, padding: 20, backgroundColor: colors.danger + '18', borderRadius: 16, alignItems: 'center' },
  errorText:      { color: colors.danger, fontSize: 14, marginBottom: 10 },
  retryText:      { color: colors.primary, fontWeight: '700', fontSize: 14 },

  verifyBanner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.warning + '18', borderWidth: 1, borderColor: colors.warning + '55', borderRadius: 12, padding: 12, marginTop: 12 },
  verifyLeft:     { flex: 1 },
  verifyTitle:    { fontSize: 13, fontWeight: '700', color: colors.warning },
  verifySub:      { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  verifyBtn:      { backgroundColor: colors.warning, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, marginLeft: 12 },
  verifyBtnText:  { color: colors.bg, fontSize: 12, fontWeight: '700' },
  verifiedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '18', borderWidth: 1, borderColor: colors.success + '44', borderRadius: 12, padding: 12, marginTop: 12 },
  verifiedText:   { color: colors.success, fontSize: 13, fontWeight: '600' },
});
