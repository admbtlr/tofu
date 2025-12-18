import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '@/screens/HomeScreen';
import EditTodoScreen from '@/screens/EditTodoScreen';
import ListDrawer from '@/components/ListDrawer';
import { TodoId } from '@/types/todo';
import { Dimensions, useWindowDimensions, Platform } from 'react-native';

export type RootStackParamList = {
  Home: undefined;
  EditTodo: { todoId?: TodoId };
};

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="EditTodo" component={EditTodoScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const width = useWindowDimensions().width;

  // Check if running on Mac (Catalyst) for vibrancy effect
  // @ts-ignore - interfaceIdiom might not be in types but exists on Mac Catalyst
  const isMac = Platform.OS === 'ios' && (Platform.constants?.interfaceIdiom === 'mac' || Platform.constants?.isMacCatalyst);

  return (
    <Drawer.Navigator
      drawerContent={props => <ListDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: width > 900 ? 'permanent' : 'slide',
        drawerStyle: {
          width: width > 900 ? 250 : '100%',
          backgroundColor: isMac ? 'transparent' : undefined,
          borderRightColor: 'rgba(255,255,255,0.1)'
        },
        sceneContainerStyle: isMac ? {
          backgroundColor: 'transparent',
        } : undefined,
      }}
    >
      <Drawer.Screen name="Main" component={StackNavigator} />
    </Drawer.Navigator>
  );
}
