import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity, // <-- Thay thế Button
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // <-- Thêm icon
import { useAuth } from "../components/AuthContext";

// --- Định nghĩa màu sắc (Từ theme của app) ---
const PRIMARY_BLUE = "#007AFF";
const DARK_BLUE = "#003A70";
const BACKGROUND_LIGHT = "#F0F3F6";
const TEXT_DARK = "#2C3E50";
const TEXT_LIGHT = "#6C7A89";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("test");
  const [password, setPassword] = useState("123");

  const { login, isLoading, error } = useAuth();

  const handleLogin = () => {
    if (username && password) {
      login(username, password);
    } else {
      Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_LIGHT} />
      <View style={styles.container}>
        {/* Logo/Icon */}
        <Ionicons
          name="person-circle-outline"
          size={80}
          color={DARK_BLUE}
          style={styles.logoIcon}
        />

        {/* Tiêu đề */}
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Chào mừng bạn trở lại!</Text>

        {/* Báo lỗi */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Ô nhập Username (với icon) */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color={TEXT_LIGHT}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập (dùng 'test')"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Ô nhập Password (với icon) */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={TEXT_LIGHT}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu (dùng '123')"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Nút Đăng nhập (Tùy chỉnh) */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        {/* Nút Đăng ký (chuyển màn hình) */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => {
            /* TODO: Thay 'Register' bằng tên màn hình Đăng ký của bạn */
            // navigation.navigate('Register');
            Alert.alert("Thông báo", "Chức năng đăng ký chưa được cài đặt.");
          }}
        >
          <Text style={styles.registerText}>
            Chưa có tài khoản?{" "}
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    fontWeight: "800", // Đậm hơn
    textAlign: "center",
    marginBottom: 8,
    color: DARK_BLUE, // Màu xanh đậm
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: TEXT_LIGHT, // Màu xám
    marginBottom: 30,
  },
  // Ô nhập liệu (mới)
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12, // Bo tròn nhiều hơn
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0", // Viền nhạt
    // Shadow cho iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Shadow cho Android
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
    color: "#E74C3C", // Màu đỏ
    textAlign: "center",
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "600",
  },
  // Nút bấm (mới)
  button: {
    backgroundColor: PRIMARY_BLUE, // Màu xanh chủ đạo
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
    backgroundColor: "#A9A9A9", // Màu xám khi đang tải
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700", // Chữ đậm
  },
  // Nút đăng ký (mới)
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
    color: PRIMARY_BLUE, // Màu xanh
  },
});
