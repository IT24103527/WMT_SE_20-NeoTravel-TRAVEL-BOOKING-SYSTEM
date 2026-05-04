// src/screens/auth/LandingScreen.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
   ScrollView,
   Animated,

} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowSm } from '../../utils/theme';

// Replace with your local image if needed, e.g. require('../../assets/landing-bg.jpg')
const backgroundImage = {
  uri: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200',
};

export default function LandingScreen() {
  const navigation = useNavigation();

  const handleLetGo = () => {
    navigation.navigate('Login');
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      {/* Semi‑transparent overlay for better text contrast */}
      <View style={styles.overlay} />

      {/* Bottom content container */}
    
      <View style={styles.bottomContainer}>
       <View style={styles.logoWrap}>
                  <Text style={styles.logoMark}>NT</Text>
                </View>
                <Text style={styles.brand}>NeoTravel</Text>
                <Text style={styles.tagline}>Explore breathtaking destinations and unforgettable experiences</Text>

        <TouchableOpacity style={styles.button} onPress={handleLetGo} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Let's Go</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // subtle dark overlay – enough contrast
  },
  bottomContainer: {
    backgroundColor: 'transparent', // no white background – blends fully
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  logoWrap: { 
    width: 72,
    height: 72,
    borderRadius: 22, 
    backgroundColor: colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 18, 
    ...shadowSm 
  },

  logoMark: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: colors.bg, 
    letterSpacing: 1 

  },

   brand: { fontSize: 30, 
    fontWeight: '800', 
    color: colors.textPrimary, 
    letterSpacing: 0.5 
   },

  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff', // white text
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#f0f0f0', // soft white
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 12,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  button: {
    backgroundColor: colors.primary, // your theme primary color
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 40,
    width: '80%',
    alignItems: 'center',
    ...shadowSm,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});