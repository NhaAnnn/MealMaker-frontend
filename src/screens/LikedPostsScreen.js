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
// import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"; // REMOVED: Caused the error
import { useSafeAreaInsets } from "react-native-safe-area-context"; // ADDED: Used for safe area padding
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../components/AuthContext";
import PostCard from "../components/PostCard";

import { useBlogAPI } from "../hook/useBlogs";

// --- Define Colors (Consistent theming) ---
const PRIMARY_BLUE = "#3D2C1C";
const DARK_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const ACCENT_COLOR = "#a58b13ff";

const ITEMS_PER_PAGE = 10;

export default function LikedPostsScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { userId, isLoggedIn } = useAuth();

  // USE useSafeAreaInsets INSTEAD OF useBottomTabBarHeight
  const insets = useSafeAreaInsets();

  const { getLikedBlogs, loading, error } = useBlogAPI();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // CALCULATE SAFE BOTTOM PADDING
  const BOTTOM_PADDING_FIX = 10 + 15;
  // Use insets.bottom (safe area padding)
  const finalPaddingBottom = insets.bottom + BOTTOM_PADDING_FIX;

  // --- Initial Data Fetch and Refresh Function ---
  const fetchLikedPosts = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setHasMore(false);
      return;
    }

    setPage(1);
    setHasMore(true);

    try {
      const response = await getLikedBlogs(1, ITEMS_PER_PAGE);
      console.log(response);
      if (response && response.data.blogs) {
        setPosts(response.data.blogs);
        const totalCount = response.count || 0;
        setHasMore(response.data.blogs.length < totalCount);
      } else {
        setPosts([]);
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error loading liked blogs list:", e);
      Alert.alert("Error", "Could not load the list of liked posts.");
      setPosts([]);
      setHasMore(false);
    }
  }, [getLikedBlogs, userId]);

  // --- Load More Data Function (Infinite Scroll) ---
  const handleLoadMore = async () => {
    if (!userId || loading || isFetchingMore || !hasMore) {
      return;
    }

    setIsFetchingMore(true);
    const nextPage = page + 1;

    try {
      const response = await getLikedBlogs(nextPage, ITEMS_PER_PAGE);

      if (response && response.blogs && response.blogs.length > 0) {
        setPosts((prevPosts) => [...prevPosts, ...response.blogs]);
        setPage(nextPage);
        setHasMore(response.blogs.length === ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error loading more liked blogs:", e);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn && userId) {
        fetchLikedPosts();
      } else if (!isLoggedIn) {
        setPosts([]);
        Alert.alert(
          "Login Required",
          "You must log in to view your liked posts."
        );
      }
      return () => {}; // Cleanup
    }, [fetchLikedPosts, isLoggedIn, userId])
  );

  const handleInteraction = (postId, interactionType) => {
    console.log(`User interaction ${interactionType} with post ${postId}`);
    // TODO: Implement logic to remove the post from the list if the user 'unlikes' it here.
  };

  // --- LIST HEADER COMPONENT ---
  const ListHeader = () => (
    <View style={[styles.listHeaderContainer]}>
      <Text style={styles.mainTitle}>Liked Posts ❤️</Text>
      <Text style={styles.subTitle}>
        These are the recipes you've saved to your favorites.
      </Text>
      <View style={{ height: 15 }} />
    </View>
  );

  // --- LIST FOOTER COMPONENT (For loading more) ---
  const renderFooter = () => {
    if (!isFetchingMore || !hasMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={PRIMARY_BLUE} />
        <Text style={{ marginLeft: 10, color: "gray" }}>Loading more...</Text>
      </View>
    );
  };

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
                  post: item,
                  postId: item._id || item.id,
                })
              }
            />
          )}
          keyExtractor={(item) => item._id || item.id}
          style={styles.list}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[
            styles.listContent,
            // USE finalPaddingBottom
            { paddingBottom: finalPaddingBottom },
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {isLoggedIn
                  ? "You haven't liked any posts yet."
                  : "Please log in to view your liked list."}
              </Text>
              {!hasMore && !initialLoading && isLoggedIn && (
                <TouchableOpacity
                  onPress={fetchLikedPosts}
                  style={{ marginTop: 15 }}
                >
                  <Text style={{ color: PRIMARY_BLUE, fontWeight: "bold" }}>
                    Try reloading
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

// --- STYLES (Kept consistent) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  listHeaderContainer: {
    marginBottom: 10,
    top: 10,
  },
  mainTitle: {
    fontSize: 28,
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
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
    color: "gray",
    marginTop: 10,
    textAlign: "center",
  },
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
