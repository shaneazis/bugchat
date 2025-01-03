import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './Services/FirebaseAuth';
import RegisterScreen from './Screens/RegisterScreen';
import Login from './Screens/LoginScreen';
import Home from './Screens/Home';
import Chat from './Screens/Chat';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setInitialRoute("home");
      } else {
        setInitialRoute("login");
      }
    });

    // Clean up subscription
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Ask for permission to show notifications
    const askForNotificationPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
      }
    };
    askForNotificationPermission();

    // Listen for incoming notifications
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    return () => subscription.remove();
  }, []);

  if (initialRoute === null) {
    // Show a loading screen while determining the initial route
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="home" component={Home} options={{ headerShown: false }} />
        <Stack.Screen name="chat" component={Chat} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
