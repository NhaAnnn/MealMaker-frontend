import "react-native-gesture-handler";
import * as React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// --- Import các màn hình ---
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ExploreScreen from "./src/screens/ExploreScreen";
import RecipeDetailScreen from "./src/screens/RecipeDetailScreen";
import FridgeScreen from "./src/screens/FridgeScreen";
import FilterScreen from "./src/screens/FilterScreen";
import PlanScreen from "./src/screens/PlanScreen";
import AccountScreen from "./src/screens/AccountScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import BlogScreen from "./src/screens/BlogScreen";
import UploadRecipeScreen from "./src/screens/UploadRecipeScreen";
import PostDetailScreen from "./src/screens/PostDetailScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import HabitCollectionScreen from "./src/screens/HabitCollectionScreen";
import ShoppingListDetailScreen from "./src/screens/ShoppingListDetailScreen";
import LikedPostsScreen from "./src/screens/LikedPostsScreen";
import QuizScreen from "./src/screens/QuizScreen";

// --- Import Auth Context ---
import { AuthProvider, useAuth } from "./src/components/AuthContext";

// --- Định nghĩa Navigators ---
const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator(); // Stack Gốc
const AuthStack = createStackNavigator(); // Stack cho Đăng nhập/Đăng ký
const AuthenticatedStack = createStackNavigator(); // Stack cho Luồng ứng dụng đã xác thực

// --- Cấu hình chung ---
const commonScreenOptions = {
  headerStyle: { backgroundColor: "#3D2C1C" }, // Màu nâu
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "bold" },
};

// --- 1. Tab Navigator (Màn hình chính có thanh tab) ---
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          let rn = route.name;

          if (rn === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (rn === "Explore") {
            iconName = focused ? "search" : "search-outline";
          } else if (rn === "Blog") {
            iconName = focused ? "newspaper" : "newspaper-outline";
          } else if (rn === "Plan") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (rn === "Account") {
            iconName = focused ? "person-circle" : "person-circle-outline";
          }

          return <Ionicons name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: "#886B47", // Màu active
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: "#ffe0b4ff",
          position: "absolute",
          marginHorizontal: 15,
          marginBottom: 10,
          borderRadius: 15,
          borderTopWidth: 0,
          borderColor: "#E0E0E0",
          borderWidth: 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 15,
          elevation: 15,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Blog" component={BlogScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

// --- 2. Auth Stack (Đăng nhập và Đăng ký) ---
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

// --- 3. Luồng ứng dụng đã xác thực (Authenticated App Flow) ---
function AuthenticatedAppFlow() {
  const { hasCompletedHabits } = useAuth(); // Lấy cờ trạng thái từ Context

  // Nếu người dùng MỚI (hasCompletedHabits=false) -> Bắt đầu bằng HabitCollection
  // Nếu người dùng CŨ (hasCompletedHabits=true) -> Bắt đầu bằng MainTabs
  const initialRoute = hasCompletedHabits ? "MainTabs" : "HabitCollection";

  // SỬ DỤNG AuthenticatedStack
  return (
    <AuthenticatedStack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      {/* 3a. Màn hình Thu thập Thói quen (Chỉ cho người dùng mới) */}
      <AuthenticatedStack.Screen
        name="HabitCollection"
        component={HabitCollectionScreen}
      />

      {/* 3b. Màn hình Chính (Main Tabs) */}
      <AuthenticatedStack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Các màn hình phụ không có tab bar */}
      <AuthenticatedStack.Screen name="Fridge" component={FridgeScreen} />
      <AuthenticatedStack.Screen name="Filter" component={FilterScreen} />
      <AuthenticatedStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
      />
      <AuthenticatedStack.Screen name="Favorites" component={FavoritesScreen} />
      <AuthenticatedStack.Screen
        name="UploadRecipe"
        component={UploadRecipeScreen}
        options={{ presentation: "modal" }}
      />
      <AuthenticatedStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
      />
      <AuthenticatedStack.Screen
        name="ShoppingListDetail"
        component={ShoppingListDetailScreen}
        options={{ presentation: "modal" }}
      />

      <AuthenticatedStack.Screen
        name="LikedPosts"
        component={LikedPostsScreen}
      />

      <AuthenticatedStack.Screen name="Quiz" component={QuizScreen} />
    </AuthenticatedStack.Navigator>
  );
}

// --- 4. App Navigator Gốc (Chọn Auth hay App Flow) ---
function AppRootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#886B47" />
      </View>
    );
  }

  // SỬ DỤNG RootStack
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        // KHÔNG ĐĂNG NHẬP -> Hiển thị Stack Đăng nhập/Đăng ký
        <RootStack.Screen name="Auth" component={AuthStackNavigator} />
      ) : (
        // ĐÃ ĐĂNG NHẬP -> Hiển thị Luồng Ứng dụng đã xác thực (Home)
        <RootStack.Screen
          name="AuthenticatedFlow"
          component={AuthenticatedAppFlow}
        />
      )}
    </RootStack.Navigator>
  );
}

// --- 5. App component (Cấp cao nhất) ---
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppRootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9EBD7",
  },
});
