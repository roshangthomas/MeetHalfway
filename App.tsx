import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineNotice } from './src/components/OfflineNotice';
import { RootStackParamList } from './src/types';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { RestaurantDetailScreen } from './src/screens/RestaurantDetailScreen';
import { NoResultsScreen } from './src/screens/NoResultsScreen';
import { LocationPermissionScreen } from './src/screens/LocationPermissionScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChangeLocationScreen } from './src/screens/ChangeLocationScreen';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplash } from './src/components/AnimatedSplash';
import { QueryProvider } from './src/providers/QueryProvider';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [appReadyTime, setAppReadyTime] = useState<number | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    async function prepare() {
      try {
        // Keep native splash screen visible while we prepare
        await SplashScreen.preventAutoHideAsync();
        setAppIsReady(true);
        setAppReadyTime(Date.now() - startTime.current);
      } catch (e) {
        console.warn(e);
        setAppIsReady(true);
        setAppReadyTime(Date.now() - startTime.current);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (!appIsReady) {
    return null;
  }

  return (
    <QueryProvider>
      <NavigationContainer onReady={onLayoutRootView}>
        <ErrorBoundary>
          <OfflineNotice />
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Whats Halfway' }}
            />
            <Stack.Screen
              name="ChangeLocation"
              component={ChangeLocationScreen}
              options={{
                title: 'Change Location',
                headerBackTitle: 'Home'
              }}
            />
            <Stack.Screen
              name="LocationPermission"
              component={LocationPermissionScreen}
              options={{
                title: 'Location Access',
                headerLeft: () => null,
                gestureEnabled: false
              }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ title: 'Meeting Places' }}
            />
            <Stack.Screen
              name="RestaurantDetail"
              component={RestaurantDetailScreen}
              options={({ route }) => ({ title: route.params.restaurant.name })}
            />
            <Stack.Screen
              name="NoResults"
              component={NoResultsScreen}
              options={{ title: 'No Results', headerLeft: () => null }}
            />
          </Stack.Navigator>
        </ErrorBoundary>
      </NavigationContainer>

      {showSplash && (
        <AnimatedSplash
          message="Getting everything ready..."
          onAnimationFinish={handleSplashFinish}
          duration={appReadyTime !== null && appReadyTime < 500 ? 500 : 800}
        />
      )}
    </QueryProvider>
  );
}
