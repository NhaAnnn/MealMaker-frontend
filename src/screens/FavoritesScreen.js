import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../components/AuthContext";

import RecipeCard from "../components/RecipeCard";

// --- Định nghĩa màu sắc ---
const PRIMARY_BLUE = "#007AFF";
const DARK_BLUE = "#003A70";
const BACKGROUND_LIGHT = "#F0F3F6";
const TEXT_DARK = "#2C3E50";

// (GIẢ LẬP) ĐỊA CHỈ API CỦA BẠN
const API_URL = "https://api.your-app.com/favorites"; // Thay thế bằng URL thật

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy userToken và hàm reset từ Context
  const { userToken } = useAuth();

  // Hàm load dữ liệu (ĐÃ THAY ĐỔI)
  const loadFavorites = useCallback(async () => {
    setIsLoading(true);

    // 1. Kiểm tra userToken (vẫn cần thiết)
    if (!userToken) {
      setFavoriteRecipes([]);
      setIsLoading(false);
      return;
    }

    try {
      // 2. Gọi API để lấy danh sách yêu thích
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Gửi "vé" (token) để server biết bạn là ai
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tải dữ liệu từ server");
      }

      // 3. Lấy dữ liệu JSON từ server
      const recipesFromServer = await response.json();

      // 4. Cập nhật state với dữ liệu từ server
      setFavoriteRecipes(recipesFromServer);
    } catch (e) {
      console.error("Lỗi khi tải danh sách yêu thích:", e);
      setFavoriteRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]); // Vẫn phụ thuộc vào userToken

  // Tự động load lại khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  // --- HÀM handleReset ---
  // Logic này vẫn đúng: nó gọi hàm resetFavorites từ Context.
  // (Lát nữa chúng ta sẽ nói về việc sửa hàm resetFavorites TRONG AuthContext)
  const handleReset = () => {
    if (!resetFavorites) {
      console.log("Hàm resetFavorites chưa được cung cấp từ Context");
      return;
    }

    Alert.alert(
      "Xác nhận đặt lại",
      "Bạn có chắc muốn xóa TẤT CẢ công thức yêu thích không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            // 1. Gọi hàm reset (hàm này cũng nên gọi API)
            await resetFavorites();

            // 2. Tải lại danh sách rỗng từ server
            loadFavorites();
          },
          style: "destructive",
        },
      ]
    );
  };
  // -------------------------------------------

  // --- Giao diện ---

  // Header chung (dùng cho cả 3 trạng thái)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Công Thức Yêu Thích</Text>
      <TouchableOpacity style={styles.headerButton} onPress={handleReset}>
        <Text style={styles.resetText}>Đặt lại</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        </View>
      </View>
    );
  }

  // Hiển thị khi danh sách rỗng (hoặc chưa đăng nhập)
  if (favoriteRecipes.length === 0) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={60} color="#ccc" />

          {/* Hiển thị thông báo dựa trên trạng thái đăng nhập */}
          {userToken ? (
            <>
              <Text style={styles.emptyText}>Bạn chưa lưu công thức nào</Text>
              <Text style={styles.emptySubText}>
                Nhấn vào 🤍 ở chi tiết công thức để lưu lại nhé.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyText}>Vui lòng đăng nhập</Text>
              <Text style={styles.emptySubText}>
                Đăng nhập để xem các công thức yêu thích của bạn.
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  // Hiển thị danh sách FlatList
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
      {renderHeader()}

      <FlatList
        data={favoriteRecipes}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() =>
              navigation.navigate("RecipeDetail", {
                recipe: item,
              })
            }
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        style={styles.container}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 15,
    paddingVertical: 10, // Giảm padding 1 chút
    height: 60,
  },
  headerButton: {
    padding: 5,
    minWidth: 50, // Đảm bảo khu vực bấm đủ rộng
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  resetText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: -60, // Đẩy lên 1 chút (vì header 60)
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: TEXT_DARK,
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: "gray",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
