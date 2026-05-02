import { useEffect, useRef } from 'react';
import { Animated , View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Loader from '../components/common/Loader';
import useAuth from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import BottomNav from '../components/common/BottomNav';

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    if (!loading) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.97);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
      ]).start();
    }
  }, [loading, user]);

  if (loading) return <Loader />;

  //changed whole 
  return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <NavigationContainer>
          
          {user ? (
            <View style={{ flex: 1 }}>
              
              {/* Screens */}
              <MainNavigator />

              {/*Nav*/}
              <BottomNav />

            </View>
          ) : (
            <AuthNavigator />
          )}

        </NavigationContainer>
      </Animated.View>
);
}
