import { registerRootComponent } from 'expo';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

registerRootComponent(App);

export default App;
