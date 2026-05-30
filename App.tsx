import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Felipa_400Regular, useFonts } from '@expo-google-fonts/felipa';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LevelUpModal from './src/components/LevelUpModal';
import { scheduleDailyNudge } from './src/notifications';
import AbilityDetailScreen from './src/screens/AbilityDetailScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import CampaignPlayScreen from './src/screens/CampaignPlayScreen';
import CampaignsScreen from './src/screens/CampaignsScreen';
import HabitFormScreen from './src/screens/HabitFormScreen';
import OnboardingFlow from './src/screens/OnboardingFlow';
import ProfileScreen from './src/screens/ProfileScreen';
import TodayScreen from './src/screens/TodayScreen';
import { AppProvider, useAppStore } from './src/store';
import { BG, BORDER, GOLD, TEXT, TEXT_MUTED } from './src/theme';
import type { RootStackParamList, TabParamList } from './src/types';

const NAV_THEME = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: BG, card: BG, border: BORDER, text: TEXT },
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ name, color }: { name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string }) {
  return (
    <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={name} size={26} color={color} />
    </View>
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
          height: 96,
          paddingBottom: 28,
          paddingTop: 6,
        },
        tabBarIconStyle: { height: 36, width: 36 },
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: TEXT_MUTED,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
      }}
    >
      <Tab.Screen
        name="SideQuests"
        component={TodayScreen}
        options={{
          tabBarLabel: 'Side Quests',
          tabBarIcon: ({ color }) => <TabIcon name="sword-cross" color={color} />,
        }}
      />
      <Tab.Screen
        name="Campaigns"
        component={CampaignsScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="map" color={color} /> }}
      />
      <Tab.Screen
        name="Hero"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="shield-star" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function AppShell() {
  const { state, dismissLevelUp } = useAppStore();
  const [fontsLoaded] = useFonts({ Felipa_400Regular });

  useEffect(() => {
    scheduleDailyNudge().catch(() => {});
  }, []);

  if (!state.isLoaded || !fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: BG }} />;
  }

  if (state.character === null) {
    return <OnboardingFlow />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <NavigationContainer theme={NAV_THEME}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: BG },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'none' }} />
          <Stack.Screen
            name="HabitForm"
            component={HabitFormScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="AbilityDetail"
            component={AbilityDetailScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="CampaignPlay"
            component={CampaignPlayScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {state.pendingLevelUp !== null && (
        <LevelUpModal level={state.pendingLevelUp} onDismiss={dismissLevelUp} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: BG }}>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
