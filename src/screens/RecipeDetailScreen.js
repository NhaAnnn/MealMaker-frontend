import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform, // ⭐️ Imported Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useRecipes } from "../hook/useRecipes";

// --- Define MODERN BLUE colors ---
const PRIMARY_BLUE = "#AB9574"; // Main gold-brown color
const DARK_BLUE = "#3D2C1C"; // Dark brown color
const BACKGROUND_LIGHT = "#F9EBD7"; // Light cream background color
const TEXT_DARK = "#2C3E50"; // Dark text color
const TEXT_LIGHT = "#6C7A89"; // Light text color
const ACCENT_GREEN = "#2ECC71"; // Accent green
const ACCENT_RED = "#E74C3C"; // Accent red
const CARD_BG = "#FFFFFF"; // Card background

const SCREEN_WIDTH = Dimensions.get("window").width;

// --- DEFINE BASE CARD STYLE (Soft Elevated Shadow) ---
const BASE_CARD = {
  backgroundColor: CARD_BG,
  borderRadius: 12,
  marginBottom: 20,
  padding: 15,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 8,
};

// Component to display Nutrition Facts
const NutritionFactItem = React.memo(({ label, value, unit, color }) => (
  <View style={styles.nutritionItem}>
    <Text style={[styles.nutritionValue, { color }]}>
      {value}
      <Text style={styles.nutritionUnit}>{unit}</Text>
    </Text>
    <Text style={styles.nutritionLabel}>{label}</Text>
  </View>
));

// Helper function to safely get nutrition value
const getNutritionValue = (data, key) => {
  return data?.nutrition_facts?.[key] ?? 0;
};

// Separated Error/Loading Components for better organization
const ErrorView = ({ icon, message, color = TEXT_DARK }) => (
  <View style={[styles.safeArea, styles.centerContent]}>
    <Ionicons name={icon} size={30} color={color} />
    <Text style={[styles.errorText, { color, fontWeight: "600" }]}>
      {message}
    </Text>
  </View>
);

const LoadingView = () => (
  <View style={[styles.safeArea, styles.centerContent]}>
    <ActivityIndicator size="large" color={PRIMARY_BLUE} />
    <Text style={{ marginTop: 10, color: TEXT_DARK }}>
      Loading recipe details...
    </Text>
  </View>
);

// Header Component with animation
const RecipeHeader = React.memo(({ title, isLiked, onBack, onToggleLike }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLikePress = () => {
    // Animation bounce
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleLike();
  };

  return (
    <View
      // ⭐️ Safe Area Handling
      style={[styles.headerContainer]}
    >
      <TouchableOpacity onPress={onBack} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.headerTitle} numberOfLines={1}>
        {title || "Recipe Details"}
      </Text>

      <TouchableOpacity
        onPress={handleLikePress}
        style={styles.headerIcon}
        accessibilityLabel={isLiked ? "Unlike recipe" : "Like recipe"}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? ACCENT_RED : "#fff"}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
});

// Meta Info Card Component
const MetaInfoCard = React.memo(({ timeMinutes, difficultyScore }) => (
  <View style={styles.metaCard}>
    <View style={styles.metaContainer}>
      <View style={styles.metaItem}>
        <Ionicons name="timer-outline" size={20} color={PRIMARY_BLUE} />
        <Text style={styles.metaLabel}>Time</Text>
        <Text style={styles.metaValue}>{timeMinutes || 0} min</Text>
      </View>

      <View style={styles.metaSeparator} />

      <View style={styles.metaItem}>
        <Ionicons name="speedometer-outline" size={20} color={PRIMARY_BLUE} />
        <Text style={styles.metaLabel}>Difficulty</Text>
        <Text style={styles.metaValue}>{difficultyScore || 0}/5.0</Text>
      </View>
    </View>
  </View>
));

// Nutrition Section Component
const NutritionSection = React.memo(({ recipe }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>Nutrition Facts (per serving)</Text>
    <View style={styles.nutritionRow}>
      <NutritionFactItem
        label="Calories"
        value={getNutritionValue(recipe, "calories")}
        unit="kcal"
        color={ACCENT_RED}
      />
      <NutritionFactItem
        label="Protein"
        value={getNutritionValue(recipe, "protein_g")}
        unit="g"
        color={ACCENT_GREEN}
      />
      <NutritionFactItem
        label="Fat"
        value={getNutritionValue(recipe, "fat_total_g")}
        unit="g"
        color={DARK_BLUE}
      />
      <NutritionFactItem
        label="Carbs"
        value={getNutritionValue(recipe, "carbohydrates_g")}
        unit="g"
        color={PRIMARY_BLUE}
      />
    </View>
  </View>
));

// Ingredients Section Component
const IngredientsSection = React.memo(({ ingredients }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>Ingredients</Text>
    {ingredients && Array.isArray(ingredients) && ingredients.length > 0 ? (
      ingredients.map((item, index) => (
        <View key={`ingredient-${index}`} style={styles.ingredientItem}>
          <Ionicons
            name="ellipse"
            size={5}
            color={PRIMARY_BLUE}
            style={styles.bullet}
          />
          <Text style={styles.content}>{item}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.content}>No detailed ingredient list available.</Text>
    )}
  </View>
));

// Seasonings Section Component
const SeasoningsSection = React.memo(({ seasoning }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>Seasonings</Text>
    {seasoning && Array.isArray(seasoning) && seasoning.length > 0 ? (
      seasoning.map((item, index) => (
        <View key={`ingredient-${index}`} style={styles.ingredientItem}>
          <Ionicons
            name="ellipse"
            size={5}
            color={PRIMARY_BLUE}
            style={styles.bullet}
          />
          <Text style={styles.content}>{item}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.content}>No detailed seasoning list available.</Text>
    )}
  </View>
));

// Instructions Section Component
const InstructionsSection = React.memo(({ instructions }) => {
  const instructionsArray = useMemo(
    () => (Array.isArray(instructions) ? instructions : []),
    [instructions]
  );

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Detailed Instructions</Text>
      {instructionsArray.length > 0 ? (
        instructionsArray.map((step, index) => (
          <View key={`step-${index}`} style={styles.stepItem}>
            <Text style={styles.stepNumber}>{index + 1}.</Text>
            <Text style={styles.stepText}>{step.display_text || step}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.stepText}>
          Instructions are not available or not in the expected format.
        </Text>
      )}
    </View>
  );
});

export default function RecipeDetailScreen({ route }) {
  const navigation = useNavigation();
  const recipeId = route.params?.recipeId;

  const { recipe, isLoading, error, isLiked, toggleLike, fetchRecipeById } =
    useRecipes(recipeId);

  // Fetch recipe data when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (recipeId && fetchRecipeById) {
        fetchRecipeById(recipeId);
      }
    }, [fetchRecipeById, recipeId])
  );

  // Handle like/unlike (Using Alert.alert() as requested)
  const handleToggleLike = useCallback(async () => {
    if (!recipeId) {
      return;
    }

    try {
      await toggleLike(recipeId, isLiked);

      // Show success Alert based on the NEW status (isLiked is the old status)
      const action = isLiked ? "Unliked" : "Liked";

      Alert.alert("Success!", `${action} recipe successfully.`);
    } catch (e) {
      // Show error Alert with safe checking
      const defaultErrorMessage =
        "An unknown error occurred. Please check your connection and try again.";
      const errorMessage = e && e.message ? e.message : defaultErrorMessage;

      Alert.alert(
        "Error",
        `Could not perform this action. Details: ${errorMessage}`
      );
    }
  }, [recipeId, isLiked, toggleLike]);

  // Memoize tags string to avoid recalculation
  const tagsString = useMemo(() => {
    if (
      !recipe?.tags ||
      !Array.isArray(recipe.tags) ||
      recipe.tags.length === 0
    ) {
      return "#NoTags";
    }
    return recipe.tags.map((tag) => `#${tag}`).join(" ");
  }, [recipe?.tags]);

  // Early returns for different states
  if (!recipeId) {
    return (
      <ErrorView
        icon="alert-circle-outline"
        message="Error: No Recipe ID provided."
        color={ACCENT_RED}
      />
    );
  }

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return (
      <ErrorView
        icon="warning-outline"
        message={`Error loading recipe: ${error}`}
        color={ACCENT_RED}
      />
    );
  }

  if (!recipe) {
    return (
      <ErrorView
        icon="sad-outline"
        message="Recipe not found."
        color={TEXT_LIGHT}
      />
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      <RecipeHeader
        title={recipe.title}
        isLiked={isLiked}
        onBack={() => navigation.goBack()}
        onToggleLike={handleToggleLike}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* COVER IMAGE */}
        <Image
          source={{
            uri:
              recipe.image_url ||
              "https://via.placeholder.com/600x300.png?text=No+Image",
          }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.contentWrapper}>
          {/* TITLE & TAGS */}
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.tags}>{tagsString}</Text>
          <Text style={styles.description}>{recipe.description}</Text>

          {/* META DATA */}
          <MetaInfoCard
            timeMinutes={recipe.time_minutes}
            difficultyScore={recipe.difficulty_score}
          />

          {/* NUTRITION FACTS */}
          <NutritionSection recipe={recipe} />

          {/* INGREDIENTS */}
          <IngredientsSection ingredients={recipe.ingredients_list} />

          {/* SEASONINGS */}
          <SeasoningsSection seasoning={recipe.seasoning}></SeasoningsSection>

          {/* INSTRUCTIONS */}
          <InstructionsSection instructions={recipe.instructions} />

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  scrollView: { marginHorizontal: 0 },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentWrapper: {
    paddingHorizontal: 20,
  },
  errorText: {
    padding: 20,
    fontSize: 18,
    textAlign: "center",
    color: ACCENT_RED,
    marginTop: 50,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15, // This is now controlled by the dynamic paddingTop
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    paddingHorizontal: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  headerIcon: {
    padding: 5,
  },
  image: {
    width: "100%",
    height: 250,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: TEXT_DARK,
    marginBottom: 5,
    paddingLeft: 0,
  },
  metaCard: {
    ...BASE_CARD,
    paddingHorizontal: 0,
    marginTop: 10,
    marginBottom: 20,
  },
  sectionCard: {
    ...BASE_CARD,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: DARK_BLUE,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BLUE,
    paddingLeft: 10,
    marginBottom: 15,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
  },
  metaItem: {
    alignItems: "center",
    flex: 1,
  },
  metaLabel: {
    fontSize: 13,
    color: TEXT_LIGHT,
    marginTop: 4,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 18,
    color: TEXT_DARK,
    fontWeight: "700",
    marginTop: 2,
  },
  metaSeparator: {
    width: 1,
    height: "80%",
    backgroundColor: BACKGROUND_LIGHT,
  },
  tags: {
    fontSize: 14,
    color: ACCENT_GREEN,
    fontWeight: "600",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BACKGROUND_LIGHT,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  nutritionUnit: {
    fontSize: 14,
    fontWeight: "600",
  },
  nutritionLabel: {
    fontSize: 13,
    color: TEXT_LIGHT,
    marginTop: 2,
    textTransform: "uppercase",
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    marginTop: 10,
    marginRight: 10,
    color: PRIMARY_BLUE,
  },
  content: {
    fontSize: 16,
    color: TEXT_DARK,
    lineHeight: 24,
    flexShrink: 1,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_BLUE,
    marginRight: 10,
    lineHeight: 28,
  },
  stepText: {
    fontSize: 16,
    flex: 1,
    color: TEXT_DARK,
    lineHeight: 28,
  },
});
