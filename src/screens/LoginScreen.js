import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity, // <-- Replaces Button
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // <-- Added icon
import { useNavigation } from "@react-navigation/native"; // <--- Added import

import { useAuth } from "../components/AuthContext";

// --- Color Definitions (From app theme) ---
const PRIMARY_BLUE = "#886B47";
const DARK_BLUE = "#886B47";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const TEXT_LIGHT = "#6C7A89";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("nhan");
  const [password, setPassword] = useState("123");

  // useAuth is called here to get the signIn function
  const { signIn, isLoading, error } = useAuth();

  const handleLogin = () => {
    if (username && password) {
      signIn(username, password);
    } else {
      Alert.alert("Error", "Please enter all required information."); // Translated Alert
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_LIGHT} />
      <View style={styles.container}>
        {/* Logo/Icon */}
        <Ionicons
          name="person-circle-outline"
          size={80}
          color={DARK_BLUE}
          style={styles.logoIcon}
        />
        {/* Title */}
        <Text style={styles.title}>Log In</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color={TEXT_LIGHT}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Username (use 'test')" // Translated placeholder
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={TEXT_LIGHT}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (use '123')" // Translated placeholder
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        {/* Login Button (Custom) */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>
        {/* Register Button (screen transition) */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => {
            navigation.navigate("SignUp");
          }}
        >
          <Text style={styles.registerText}>
            Don't have an account?
            <Text style={styles.registerLink}>Sign up now</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },
  logoIcon: {
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800", // Bolder
    textAlign: "center",
    marginBottom: 8,
    color: DARK_BLUE, // Dark blue color
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: TEXT_LIGHT, // Gray color
    marginBottom: 30,
  },
  // Input Field (new)
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12, // More rounded
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0", // Light border
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Shadow for Android
    elevation: 2,
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: TEXT_DARK,
  },
  errorText: {
    color: "#E74C3C", // Red color
    textAlign: "center",
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "600",
  },
  // Button (new)
  button: {
    backgroundColor: PRIMARY_BLUE, // Primary blue color
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    // Shadow
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "#A9A9A9", // Gray when loading
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700", // Bold text
  },
  // Register Button (new)
  registerButton: {
    marginTop: 25,
  },
  registerText: {
    textAlign: "center",
    color: TEXT_LIGHT,
    fontSize: 14,
  },
  registerLink: {
    fontWeight: "bold",
    color: PRIMARY_BLUE, // Blue color
  },
});
