import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LevelUpModal from './src/components/LevelUpModal';
import { scheduleDailyNudge } from './src/notifications';
import AbilityDetailScreen from './src/screens/AbilityDetailScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import HabitFormScreen from './src/screens/HabitFormScreen';
import OnboardingFlow from './src/screens/OnboardingFlow';
import ProfileScreen from './src/screens/ProfileScreen';
import TodayScreen from './src/screens/TodayScreen';
import { AppProvider, useAppStore } from './src/store';
import { BG, BORDER, GOLD, TEXT_MUTED } from './src/theme';
import type { RootStackParamList, TabParamList } from './src/types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: BORDER,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: TEXT_MUTED,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
      }}
    >
      <Tab.Screen
        name="Quests"
        component={TodayScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚔️" focused={focused} /> }}
      />
      <Tab.Screen
        name="Chronicle"
        component={CalendarScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📜" focused={focused} /> }}
      />
      <Tab.Screen
        name="Hero"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function AppShell() {
  const { state, dismissLevelUp } = useAppStore();

  useEffect(() => {
    scheduleDailyNudge().catch(() => {});
  }, []);

  if (!state.isLoaded) {
    return <View style={{ flex: 1, backgroundColor: BG }} />;
  }

  if (state.character === null) {
    return <OnboardingFlow />;
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="HabitForm"
            component={HabitFormScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="AbilityDetail"
            component={AbilityDetailScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {state.pendingLevelUp !== null && (
        <LevelUpModal level={state.pendingLevelUp} onDismiss={dismissLevelUp} />
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
