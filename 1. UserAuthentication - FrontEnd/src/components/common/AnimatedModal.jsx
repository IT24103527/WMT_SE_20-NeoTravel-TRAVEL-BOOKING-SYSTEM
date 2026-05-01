import { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import { colors, shadowSm } from '../../utils/theme';

const { height } = Dimensions.get('window');

/**
 * Reusable animated bottom-sheet modal.
 * Props:
 *   visible    — boolean
 *   onClose    — function
 *   title      — string
 *   children   — content
 *   height     — optional fixed height (default: auto)
 */
export default function AnimatedModal({ visible, onClose, title, children }) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 260,
          mass: 0.85,
        }),
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 280,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.97,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: bgAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Header */}
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowSm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title:    { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceHigh, justifyContent: 'center', alignItems: 'center' },
  closeIcon:{ fontSize: 13, color: colors.textSecondary, fontWeight: '700' },
  content:  { paddingHorizontal: 24, paddingTop: 16 },
});
