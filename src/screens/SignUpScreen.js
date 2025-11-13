import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator, // THÊM: Import ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../components/AuthContext"; // THÊM: Import useAuth

// --- Colors ---
const PRIMARY_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const ACTIVE_COLOR = "#886B47"; // Sử dụng màu nhấn hợp lý

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { signUp } = useAuth(); // SỬA: Lấy hàm signUp từ Context

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!username || password.length < 1) {
      Alert.alert(
        "Lỗi",
        "Vui lòng nhập username hợp lệ và mật khẩu ít nhất 6 ký tự."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Gọi hàm signUp (sẽ đặt userToken và hasCompletedHabits=false)
      await signUp(username, fullname, password);

      // Không cần điều hướng thủ công ở đây
      Alert.alert(
        "Thành công",
        "Đăng ký hoàn tất! Tiếp tục để thiết lập sở thích."
      );
    } catch (error) {
      Alert.alert(
        "Lỗi Đăng ký",
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Sign Up</Text>
      <Text style={styles.subHeader}>
        Let's create an account to start your personalized cooking journey!
      </Text>
      <View style={styles.inputGroup}>
        <Ionicons
          name="person-outline"
          size={20}
          color={PRIMARY_BLUE}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={fullname}
          onChangeText={setFullname}
          autoCapitalize="none"
          placeholderTextColor="#A0704C"
        />
      </View>
      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Ionicons
          name="key-outline"
          size={20}
          color={PRIMARY_BLUE}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="User name"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#A0704C"
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={PRIMARY_BLUE}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (least 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#A0704C"
        />
      </View>

      {/* Confirm Password Input */}
      <View style={styles.inputGroup}>
        <Ionicons
          name="checkmark-circle-outline"
          size={20}
          color={PRIMARY_BLUE}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholderTextColor="#A0704C"
        />
      </View>

      {/* Button Đăng Ký */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      {/* Nút Quay lại Đăng nhập */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Have account? Login now!</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: BACKGROUND_LIGHT,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: PRIMARY_BLUE,
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 16,
    color: TEXT_DARK,
    marginBottom: 40,
    textAlign: "center",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0D0C0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: TEXT_DARK,
    fontSize: 16,
  },
  button: {
    width: "100%",
    backgroundColor: PRIMARY_BLUE,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: ACTIVE_COLOR,
    fontSize: 14,
    fontWeight: "600",
  },
});
