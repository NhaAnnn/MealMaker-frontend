import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
  Platform, // ⭐️ Imported Platform
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Import actual hooks (Assuming correct paths)
import { useAuth } from "../components/AuthContext";
import { useRecipes } from "../hook/useRecipes";

import RecipeCard from "../components/RecipeCard";

// --- Define Colors ---
const PRIMARY_BLUE = "#AB9574";
const DARK_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const RED_DELETE = "#E74C3C";

// Delete button width (fixed)
const DELETE_BUTTON_WIDTH = 100;
// Swipe threshold to reveal the delete button
const SWIPE_THRESHOLD = 50;

/**
 * Swipe-to-Delete Item Component
 */
const SwipeableListItem = ({ item, onDelete, onDetailPress }) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [isSwiped, setIsSwiped] = useState(false);

  // Function to close the item (swipe back)
  const resetPan = useCallback(() => {
    if (isSwiped) {
      Animated.timing(pan, {
        toValue: { x: 0, y: 0 },
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsSwiped(false));
    }
  }, [isSwiped, pan]);

  // Setup PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only accept the gesture when dragging significantly to the left
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 && // Horizontal swipe is dominant
          Math.abs(gestureState.dx) > 5 && // Start swiping after 5px
          gestureState.dx < 0 // Only interested in left swipes
        );
      },
      onPanResponderMove: (evt, gestureState) => {
        // Limit left swipe to the delete button width
        const newX = Math.max(gestureState.dx, -DELETE_BUTTON_WIDTH);
        pan.setValue({ x: newX, y: 0 });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swiped hard enough to the left: Open the delete button
          Animated.timing(pan, {
            toValue: { x: -DELETE_BUTTON_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: true,
          }).start(() => setIsSwiped(true));
        } else {
          // Not enough swipe or swiped right: Close
          resetPan();
        }
      },
      onPanResponderTerminate: resetPan,
    })
  ).current;

  // Actual delete handler
  const handleActualDelete = () => {
    // Call onDelete prop function, passing the recipe ID
    onDelete(item.id);
    // No need to resetPan as the item will be removed from the list
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Delete Button (Always rendered underneath) */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleActualDelete}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-bin-outline" size={24} color="#fff" />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>

      {/* Main Content (Moves with PanResponder) */}
      <Animated.View
        // Pass handlers to capture gestures
        {...panResponder.panHandlers}
        style={[
          styles.contentWrapper,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
      >
        <RecipeCard
          recipe={item}
          // Pass item and resetPan to the detail handler
          onPress={() => onDetailPress(item, resetPan)}
          // Disable default toggleLike action on the card
          onToggleLike={() => {
            Alert.alert(
              "Remove Recipe?",
              "Please swipe left and tap 'Delete' to remove this recipe from your favorites."
            );
            return;
          }}
        />
      </Animated.View>
    </View>
  );
};
// --- End of Swipeable Component ---

export default function FavoritesScreen() {
  const navigation = useNavigation();
  // Get login status and user ID
  const { userId, isLoggedIn } = useAuth();

  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use hook to get necessary functions
  const { fetchLikedRecipes, toggleLike } = useRecipes();

  // --- ACTUAL DATA LOADING FUNCTION ---
  const loadFavorites = useCallback(async () => {
    if (!userId) {
      setFavoriteRecipes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Call hook function to load liked recipes
      const data = await fetchLikedRecipes();
      setFavoriteRecipes(data);
    } catch (e) {
      console.error("Error loading favorites list:", e);
      Alert.alert(
        "Error",
        "Could not load the favorites list. Please check your connection and try again."
      );
      setFavoriteRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchLikedRecipes]); // Depend: userId and hook function

  // Reload when the screen focuses
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  // --- UNLIKE/DELETE FAVORITE RECIPE HANDLER ---
  const handleDelete = useCallback(
    (recipeId) => {
      // 1. Check login status before attempting delete
      if (!isLoggedIn) {
        Alert.alert("Error", "Please log in to perform this action.");
        return;
      }

      Alert.alert(
        "Confirm Deletion",
        `Are you sure you want to remove this recipe from your favorites?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            onPress: async () => {
              try {
                // Call toggleLike with currentIsLiked = TRUE (since it's in the list)
                await toggleLike(recipeId, true);

                // Update the local list after successful API call
                setFavoriteRecipes((prev) =>
                  prev.filter((r) => r.id !== recipeId)
                );
                Alert.alert("Success", "Recipe removed from favorites.");
              } catch (error) {
                // 2. Improved error reporting: Extract a more specific error message
                console.error("Unlike failed:", error);
                // Try to get the message from the error object, otherwise use a default message
                const errorMessage =
                  error.message || "An unknown error occurred from the server.";
                Alert.alert(
                  "Deletion Error",
                  `Removing from favorites failed: ${errorMessage}`
                );
              }
            },
            style: "destructive",
          },
        ]
      );
    },
    [toggleLike, isLoggedIn] // Added isLoggedIn to dependencies
  );

  // --- NAVIGATE TO DETAIL HANDLER ---
  const handleRecipeDetail = useCallback(
    (item, closeItem) => {
      // Close the delete button if it's open before navigating
      if (closeItem) closeItem();

      // Pass the _id so the detail screen can load the data
      navigation.navigate("RecipeDetail", { recipeId: item.id });
    },
    [navigation]
  );

  const renderHeaderRightButton = () => {
    // Temporarily hide the Reset/Extra button to keep the interface clean
    return <View style={styles.headerButton} />;
  };

  const renderHeader = () => (
    <View
      // ⭐️ Apply Safe Area Padding Top
      style={[
        styles.headerContainer,
        {
          // iOS: Fixed padding (e.g., 50) for status bar/notch + extra space
          // Android: StatusBar.currentHeight + extra space (e.g., 10)
          // paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
          paddingBottom: 10,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Favorite Recipes</Text>
      {renderHeaderRightButton()}
    </View>
  );

  // Item render function for FlatList
  const renderItem = ({ item }) => (
    <SwipeableListItem
      item={item}
      onDelete={handleDelete}
      onDetailPress={handleRecipeDetail}
    />
  );

  // --- RENDER RETURN ---
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

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
      {renderHeader()}

      <FlatList
        data={favoriteRecipes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.container}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={60} color="#ccc" />
            {isLoggedIn ? (
              <>
                <Text style={styles.emptyText}>
                  You haven't saved any recipes yet
                </Text>
                <Text style={styles.emptySubText}>
                  Tap the 🤍 icon in the recipe details to save them.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>Please Log In</Text>
                <Text style={styles.emptySubText}>
                  Log in to view your favorite recipes.
                </Text>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

// --- Styles (Only headerContainer and list-related styles were checked/modified for clarity) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: 15,
    paddingTop: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    // Shadow for header separation
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerButton: {
    padding: 5,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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

  // --- SWIPEABLE STYLES ---
  swipeContainer: {
    backgroundColor: BACKGROUND_LIGHT,
    marginBottom: 10,
    justifyContent: "center",
    borderRadius: 15,
    overflow: "hidden",
  },
  deleteButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH, // Delete button width
    backgroundColor: RED_DELETE,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 4,
    fontSize: 12,
  },
  contentWrapper: {
    backgroundColor: "#fff",
    borderRadius: 15,
  },
});
