import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RoomLobbyScreen } from '../screens/RoomLobbyScreen';
import { GameTableScreen } from '../screens/GameTableScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { useSocketEvents } from '../hooks/useSocketEvents';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  RoomLobby: { roomCode: string };
  GameTable: { roomCode: string };
  Stats: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['pokerfriends://', 'https://pokerfriends.app'],
  config: {
    screens: {
      GameTable: {
        path: 'room/:roomCode',
        parse: { roomCode: (code: string) => code },
      },
    },
  },
};

export function RootNavigator() {
  // Subscribe to socket events at app level (activates when userId is set)
  useSocketEvents();

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Login"
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} />
        <Stack.Screen name="GameTable" component={GameTableScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
