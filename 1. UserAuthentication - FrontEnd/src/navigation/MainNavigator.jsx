import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen             from '../screens/profile/ProfileScreen';
import ChangePasswordScreen      from '../screens/profile/ChangePasswordScreen';
import LoginHistoryScreen        from '../screens/profile/LoginHistoryScreen';
import ActivityLogScreen         from '../screens/profile/ActivityLogScreen';
import SessionsScreen            from '../screens/profile/SessionsScreen';
import PrivacyScreen             from '../screens/profile/PrivacyScreen';
import ExportDataScreen          from '../screens/profile/ExportDataScreen';
import VerifyEmailSettingsScreen from '../screens/profile/VerifyEmailSettingsScreen';
import TokenInfoScreen           from '../screens/profile/TokenInfoScreen';
import { colors } from '../utils/theme';
import Packages from '../screens/packages/Packages';
import PackageDetails from '../screens/packages/PackageDetails';
import ReviewScreen from '../screens/packages/ReviewScreen';
import UploadImagesScreen from '../screens/packages/UploadImagesScreen';
import Bookings from '../screens/booking/Bookings';
import AdminPackages from '../screens/packages/AdminPackages'
import FavoritesScreen from '../screens/favorites/FavoritesScreen'

const Stack = createNativeStackNavigator();

const headerOpts = {
  headerStyle:            { backgroundColor: colors.surface },
  headerTintColor:        colors.textPrimary,
  headerTitleStyle:       { fontWeight: '700', fontSize: 17 },
  headerShadowVisible:    false,
  headerBackTitleVisible: false,
  contentStyle:           { backgroundColor: colors.bg },
  animation:              'slide_from_right',
  animationDuration:      260,
  gestureEnabled:         true,
  gestureDirection:       'horizontal',
  fullScreenGestureEnabled: true,
};

// Modal-style screens slide up from bottom
const modalOpts = {
  ...headerOpts,
  animation:        'slide_from_bottom',
  animationDuration: 320,
  presentation:     'modal',
  fullScreenGestureEnabled: false,
};

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>

      {/* PROFILE */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile', animation: 'fade' }}
      />

      {/* OTHER PROFILE SCREENS */}
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password', ...modalOpts }} />
      <Stack.Screen name="LoginHistory"   component={LoginHistoryScreen}   options={{ title: 'Login History' }} />
      <Stack.Screen name="ActivityLog"    component={ActivityLogScreen}    options={{ title: 'Activity Log' }} />
      <Stack.Screen name="Sessions"       component={SessionsScreen}       options={{ title: 'Active Sessions' }} />
      <Stack.Screen name="Privacy"        component={PrivacyScreen}        options={{ title: 'Privacy Settings', ...modalOpts }} />
      <Stack.Screen name="ExportData"     component={ExportDataScreen}     options={{ title: 'Export My Data', ...modalOpts }} />
      <Stack.Screen name="VerifyEmailSettings" component={VerifyEmailSettingsScreen} options={{ title: 'Verify Email', ...modalOpts }} />
      <Stack.Screen name="TokenInfo"      component={TokenInfoScreen}      options={{ title: 'JWT Token Info' }} />

       {/* COMMON */}
      <Stack.Screen name="Packages" component={Packages} />
      <Stack.Screen name="PackageDetails" component={PackageDetails} options={{ title: 'Package Details' }} />
      <Stack.Screen name="Reviews" component={ReviewScreen} options={{ title: 'Package Reviews' }} />
      <Stack.Screen name="UploadImages" component={UploadImagesScreen} options={{ title: 'Upload Package Images', ...modalOpts }} />
      <Stack.Screen name="Bookings" component={Bookings} />
      <Stack.Screen 
      name="AdminPackages" component={AdminPackages} options={{ title: 'Manage Packages' }} 
    />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'My Favorites' }}
      />
    </Stack.Navigator>
  );
}
