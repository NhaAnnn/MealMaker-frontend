import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image, // Thêm
  Platform, // Thêm
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // Import Image Picker
import { useAuth } from "../components/AuthContext";
import { useNavigation } from "@react-navigation/native";

// --- Màu sắc ---
const PRIMARY_BLUE = "#007AFF";
const DARK_BLUE = "#003A70";
const BACKGROUND_LIGHT = "#F0F3F6";
const TEXT_DARK = "#2C3E50";

const API_URL = "https://api.your-app.com/posts";

export default function UploadRecipeScreen() {
  const navigation = useNavigation();
  const { userToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // States cho Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [imageUri, setImageUri] = useState(null); // State cho ảnh
  const [time, setTime] = useState(""); // <-- (MỚI) State cho Thời gian
  const [difficulty, setDifficulty] = useState(""); // <-- (MỚI) State cho Độ khó

  // Hàm chọn ảnh (Giữ nguyên)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Xin lỗi", "Chúng tôi cần quyền truy cập thư viện ảnh.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Hàm Submit (Đã cập nhật FormData)
  const handleSubmit = async () => {
    // Cập nhật kiểm tra
    if (
      !title ||
      !description ||
      !ingredients ||
      !imageUri ||
      !time ||
      !difficulty
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tất cả các trường.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();

    // Thêm các trường text
    formData.append("title", title);
    formData.append("description", description);
    formData.append("ingredients", ingredients);
    formData.append("time_minutes", time); // <-- (MỚI) Gửi thời gian
    formData.append("difficulty_score", difficulty); // <-- (MỚI) Gửi độ khó

    // Xử lý file ảnh
    let localUri = imageUri;
    let filename = localUri.split("/").pop();
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;

    // @ts-ignore
    formData.append("imageFile", { uri: localUri, name: filename, type });

    try {
      // Gửi FormData lên server
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: formData, // Gửi FormData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Lỗi khi gửi bài đăng");
      }

      Alert.alert("Thành công", "Bài đăng của bạn đã được gửi!");
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", e.message || "Không thể gửi bài, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng Công Thức Mới</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>Ảnh bìa công thức</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={30} color={PRIMARY_BLUE} />
              <Text style={styles.imagePickerText}>Nhấn để chọn ảnh</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Tiêu đề công thức</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Gà nướng mật ong"
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thời gian (phút)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 30"
              value={time}
              onChangeText={setTime}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Độ khó (1-5)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 2.5"
              value={difficulty}
              onChangeText={setDifficulty}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Mô tả ngắn</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Mô tả về món ăn của bạn..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Nguyên liệu</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Ví dụ: - 1kg Gà..."
          value={ingredients}
          onChangeText={setIngredients}
          multiline
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Gửi Bài Đăng</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_DARK,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 15,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  imagePicker: {
    width: "100%",
    height: 180,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePickerText: {
    color: PRIMARY_BLUE,
    marginTop: 5,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  button: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  buttonDisabled: {
    backgroundColor: "#A9A9A9",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputGroup: {
    flex: 1,
  },

  inputGroup: {
    flex: 1,
    marginRight: 8,
  },

  inputGroup: {
    flex: 1,
    marginLeft: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  inputGroup: {
    flex: 1,
    paddingHorizontal: 4,
  },
});
