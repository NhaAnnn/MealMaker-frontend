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
} from "react-native";
import {
  useNavigation,
  useFocusEffect,
  useIsFocused,
} from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../components/AuthContext";
import PostCard from "../components/PostCard";

import { useBlogAPI } from "../hook/useBlogs";

// --- Define Colors ---
const PRIMARY_BLUE = "#3D2C1C";
const DARK_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const ACCENT_COLOR = "#a58b13ff"; // Màu nổi bật cho FAB

const ITEMS_PER_PAGE = 10; // Số lượng bài viết mỗi lần tải

export default function BlogScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { isLoggedIn } = useAuth();

  const { getBlogs, loading, error } = useBlogAPI();

  const [posts, setPosts] = useState([]);

  // --- STATES QUẢN LÝ PHÂN TRANG ---
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Còn dữ liệu để tải tiếp không
  const [isFetchingMore, setIsFetchingMore] = useState(false); // Đang tải thêm dữ liệu (cho footer)
  // ---------------------------------

  const tabBarHeight = useBottomTabBarHeight();
  const BOTTOM_PADDING_FIX = 10 + 15;

  // Hàm tải dữ liệu lần đầu (và refresh)
  const fetchBlogPosts = useCallback(async () => {
    // Reset trạng thái trước khi tải
    setPage(1);
    setHasMore(true);

    // Sử dụng loading từ hook, chỉ cần setPosts
    try {
      const response = await getBlogs(1, ITEMS_PER_PAGE);

      // SỬA LỖI: Truy cập đúng response.blogs
      if (response && response.blogs) {
        setPosts(response.blogs);

        // Cập nhật trạng thái 'hasMore' dựa trên tổng số lượng (hoặc số lượng trả về)
        const totalCount = response.count || 0;
        setHasMore(response.blogs.length < totalCount);
      } else {
        setPosts([]);
        setHasMore(false);
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách blog:", e);
      Alert.alert("Lỗi", "Không thể tải danh sách bài viết. Vui lòng thử lại.");
      setPosts([]);
      setHasMore(false);
    }
  }, [getBlogs]);

  // Hàm tải thêm dữ liệu
  const handleLoadMore = async () => {
    // Ngăn chặn tải nếu đang tải, đã hết, hoặc đang tải thêm
    if (loading || isFetchingMore || !hasMore) {
      return;
    }

    setIsFetchingMore(true);
    const nextPage = page + 1;

    try {
      const response = await getBlogs(nextPage, ITEMS_PER_PAGE);

      if (response && response.blogs && response.blogs.length > 0) {
        // Nối dữ liệu mới vào danh sách hiện tại
        setPosts((prevPosts) => [...prevPosts, ...response.blogs]);
        // Tăng số trang
        setPage(nextPage);

        // Kiểm tra xem còn trang nào nữa không
        setHasMore(response.blogs.length === ITEMS_PER_PAGE);
      } else {
        // API trả về mảng rỗng -> Đã hết dữ liệu
        setHasMore(false);
      }
    } catch (e) {
      console.error("Lỗi khi tải thêm blog:", e);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchBlogPosts();
      return () => {}; // Cleanup
    }, [fetchBlogPosts])
  );

  // LOGIC GIỮ NGUYÊN
  const handleInteraction = (postId, interactionType) => {
    console.log(`User interaction ${interactionType} with post ${postId}`);
    // TODO: Tích hợp hàm like/dislike từ useBlogAPI ở đây
  };

  const handleUploadPress = () => {
    // Thêm logic kiểm tra đăng nhập trước khi điều hướng
    if (!isLoggedIn) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để tạo bài viết.");
      // Giả sử có màn hình đăng nhập tên là 'Auth'
      // navigation.navigate("Auth");
    } else {
      navigation.navigate("UploadRecipe");
    }
  };

  // --- LIST HEADER COMPONENT ---
  const ListHeader = () => (
    <View style={[styles.listHeaderContainer]}>
      <Text style={styles.mainTitle}>Blog Community</Text>
      <Text style={styles.subTitle}>
        Explore and share your delicious recipes!
      </Text>
      <View style={{ height: 15 }} />
    </View>
  );

  // --- LIST FOOTER COMPONENT (Cho tải thêm) ---
  const renderFooter = () => {
    // Chỉ hiển thị loading ở footer khi đang tải thêm VÀ chưa hết dữ liệu
    if (!isFetchingMore || !hasMore) return null;

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={PRIMARY_BLUE} />
        <Text style={{ marginLeft: 10, color: "gray" }}>Đang tải thêm...</Text>
      </View>
    );
  };

  // Kiểm tra nếu đang tải lần đầu và danh sách trống
  const initialLoading = loading && posts.length === 0;

  return (
    <View style={styles.safeArea}>
      {isFocused && (
        <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_LIGHT} />
      )}

      {initialLoading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={PRIMARY_BLUE}
        />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onInteract={handleInteraction}
              onPress={() =>
                navigation.navigate("PostDetail", {
                  postId: item._id || item.id,
                })
              } // Truyền ID
            />
          )}
          keyExtractor={(item) => item._id || item.id}
          style={styles.list}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + BOTTOM_PADDING_FIX },
          ]}
          // --- THÊM LOGIC INFINITE SCROLLING ---
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} // Kích hoạt khi cuộn đến 50% cuối
          ListFooterComponent={renderFooter} // Component tải thêm
          // ------------------------------------

          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {error ? `Lỗi: ${error}` : "No articles have been written yet."}
              </Text>
              {!hasMore && !initialLoading && (
                <TouchableOpacity
                  onPress={fetchBlogPosts}
                  style={{ marginTop: 15 }}
                >
                  <Text style={{ color: PRIMARY_BLUE, fontWeight: "bold" }}>
                    Thử tải lại
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fabButton} onPress={handleUploadPress}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  listHeaderContainer: {
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: DARK_BLUE,
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 16,
    color: "gray",
  },

  list: {
    top: 30,
    flex: 1,
    paddingHorizontal: 10,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 0,
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
    textAlign: "center",
  },
  // Style cho component tải thêm ở cuối danh sách
  footerLoading: {
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  fabButton: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    bottom: 80,
    borderRadius: 30,
    backgroundColor: ACCENT_COLOR,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
