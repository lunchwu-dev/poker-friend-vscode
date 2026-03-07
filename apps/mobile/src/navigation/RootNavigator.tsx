import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { GameTableScreen } from '../screens/GameTableScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  GameTable: { roomCode: string };
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
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Login"
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="GameTable" component={GameTableScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
