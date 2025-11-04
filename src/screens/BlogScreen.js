import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView, // Đã bỏ comment SafeAreaView
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../components/AuthContext";
import PostCard from "../components/PostCard"; // Component mới

// --- Định nghĩa màu sắc ---
const PRIMARY_BLUE = "#007AFF";
const DARK_BLUE = "#003A70";
const BACKGROUND_LIGHT = "#F0F3F6";
const TEXT_DARK = "#2C3E50";

// (GIẢ LẬP) ĐỊA CHỈ API CỦA BẠN
const API_URL = "https://api.your-app.com/posts"; // URL mới cho các bài đăng

export default function BlogScreen() {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userToken } = useAuth(); // Kiểm tra xem đã đăng nhập chưa

  // --- ĐÃ SỬA LỖI THEO HƯỚNG DẪN ---
  // Tải lại khi quay về màn hình
  useFocusEffect(
    useCallback(() => {
      // (Bên trong useFocusEffect)
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // (GIẢ LẬP) Thay thế bằng fetch thật
          // const response = await fetch(API_URL);
          // const data = await response.json();

          // Dữ liệu giả lập để test (ĐÃ ĐƯỢC BỔ SUNG ĐỒNG BỘ)
          const data = [
            {
              id: "p1",
              title: "Gà Nướng Mật Ong Siêu Dễ",
              author: "User A",
              image:
                "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",

              status: "pending",
              description:
                "Công thức gà nướng mật ong đơn giản và ngon miệng cho bữa tối gia đình. Vị mặn ngọt hài hòa, da giòn rụm!",
              ingredients:
                "- 1kg Cánh gà (hoặc đùi gà)\n- 4 muỗng Mật ong\n- 2 muỗng Nước mắm\n- 2 muỗng Dầu hào\n- Tỏi, Ớt băm",
              instructions:
                "1. Ướp gà với tất cả gia vị trong 30 phút.\n2. Làm nóng lò ở 180°C.\n3. Nướng gà 20 phút, lật mặt, nướng thêm 15 phút là hoàn thành.",
              time_minutes: 40, // <-- ĐÃ THÊM
              difficulty_score: 3.0, // <-- ĐÃ THÊM
            },
            {
              id: "p2",
              title: "Cách làm Bò Bít Tết",
              author: "User B",
              image:
                "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
              status: "pending",
              description:
                "Làm bò bít tết (beefsteak) mềm, mọng nước tại nhà chỉ với vài bước đơn giản. Ngon như ngoài nhà hàng!",
              ingredients:
                "- 300g Thăn bò Mỹ (dày 2-3cm)\n- 1 củ Khoai tây\n- 1 quả Trứng gà\n- Bơ lạt, Dầu olive\n- Muối, Tiêu hột",
              instructions:
                "1. Ướp bò với muối, tiêu, dầu olive.\n2. Áp chảo 2 mặt (mỗi mặt 2-3 phút) với lửa lớn.\n3. Thêm bơ, tỏi vào chảo, rưới bơ lên thịt.\n4. Để thịt nghỉ 5 phút trước khi cắt.",
              time_minutes: 15, // <-- ĐÃ THÊM
              difficulty_score: 2.5, // <-- ĐÃ THÊM
            },
            {
              id: "p3",
              title: "Salad Ức Gà Giảm Cân",
              author: "User C",
              image:
                "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",

              status: "pending",
              description:
                "Bữa trưa healthy cho dân văn phòng, đầy đủ dinh dưỡng, no lâu mà không lo tăng cân. Sốt dầu giấm chua ngọt rất ngon.",
              ingredients:
                "- 200g Ức gà (luộc hoặc áp chảo)\n- 1 cây Xà lách Roman (hoặc Iceberg)\n- 100g Cà chua bi\n- 1/2 quả Bơ\n- Sốt Dầu Olive và Giấm Balsamic",
              instructions:
                "1. Xé gà, cắt rau, cà chua bi, bơ.\n2. Trộn đều các nguyên liệu trong tô lớn.\n3. Rưới sốt dầu giấm và thưởng thức.",
              time_minutes: 10, // <-- ĐÃ THÊM
              difficulty_score: 1.5, // <-- ĐÃ THÊM
            },
          ];
          setPosts(data);
        } catch (e) {
          console.error(e);
          Alert.alert("Lỗi", "Không thể tải danh sách bài đăng.");
        } finally {
          setIsLoading(false);
        }
      };

      // Gọi hàm async đó ngay lập tức (ĐÃ SỬA LỖI TỪ fetchPosts -> fetchData)
      fetchData();

      // Return một hàm cleanup (không bắt buộc, nhưng tốt)
      return () => {
        // console.log("Rời màn hình Blog");
        // Nếu bạn dùng fetch, đây là nơi để abort()
      };
    }, []) // Dependency rỗng, nó sẽ chạy mỗi khi focus
  );
  // --- KẾT THÚC SỬA LỖI ---

  // Xử lý khi có tương tác (sẽ được gọi từ PostCard)
  // Logic này sẽ được đặt trong PostCard.js để đơn giản hóa
  const handleInteraction = (postId, interactionType) => {
    console.log(`User tương tác ${interactionType} với post ${postId}`);
    // PostCard sẽ tự gọi API
  };

  // Nút "Đăng bài" (dấu +) ở Header
  const renderHeaderRight = () => (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => {
        if (!userToken) {
          Alert.alert("Lỗi", "Bạn cần đăng nhập để đăng bài.");
          navigation.navigate("Auth"); // Chuyển đến màn hình Login
        } else {
          navigation.navigate("UploadRecipe"); // Chuyển đến màn hình Đăng
        }
      }}
    >
      {/* --- SỬA LỖI MÀU ICON TẠI ĐÂY --- */}
      <Ionicons name="add-circle" size={30} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      {/* Header tùy chỉnh */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Blog Cộng Đồng</Text>
        {renderHeaderRight()}
      </View>

      {isLoading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={PRIMARY_BLUE}
        />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostCard post={item} onInteract={handleInteraction} />
          )}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    height: 60,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerButton: {
    padding: 5,
    position: "absolute",
    right: 15,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "gray",
    marginTop: 10,
  },
});
