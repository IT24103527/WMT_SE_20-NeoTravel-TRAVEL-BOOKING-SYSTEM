import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen          from '../screens/auth/LoginScreen';
import SignupScreen         from '../screens/auth/SignupScreen';
import VerifyEmailScreen    from '../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen  from '../screens/auth/ResetPasswordScreen';
import { colors } from '../utils/theme';

const Stack = createNativeStackNavigator();

// Smooth slide + fade transition config
const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  animation: 'slide_from_right',
  animationDuration: 280,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  customAnimationOnGesture: true,
  fullScreenGestureEnabled: true,
};

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'fade', animationDuration: 350 }}
      />
      <Stack.Screen name="Signup"         component={SignupScreen} />
      <Stack.Screen name="VerifyEmail"    component={VerifyEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
