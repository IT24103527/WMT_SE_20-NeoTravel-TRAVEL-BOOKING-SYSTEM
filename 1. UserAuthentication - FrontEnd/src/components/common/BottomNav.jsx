import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';

export default function BottomNav() {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Get current route safely
  const currentRoute = useNavigationState(state => {
    if (!state || !state.routes || state.index == null) return null;
    return state.routes[state.index]?.name;
  });

  const isActive = (route) => currentRoute === route;

  const TabItem = ({ name, icon, label }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate(name)}
      style={{ alignItems: 'center', flex: 1 }}
    >
      <Ionicons
        name={isActive(name) ? icon : `${icon}-outline`}
        size={24}
        color={isActive(name) ? '#007AFF' : '#999'}
      />
      <Text
        style={{
          fontSize: 12,
          marginTop: 2,
          color: isActive(name) ? '#007AFF' : '#999',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#eee',

        // shadow (iOS)
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,

        // elevation (Android)
        elevation: 10,
      }}
    >
      <TabItem name="Packages" icon="cube" label="Packages" />
      {user?.role === 'admin' && (
        <TabItem name="AdminPackages" icon="settings" label="Admin" />
      )}

      <TabItem name="Profile" icon="person" label="Profile" />
    </View>
  );
}