import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useUserUpdateAPI } from "../hook/useUsers";

// --- Colors ---
const PRIMARY_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const ACTIVE_COLOR = "#D35400";
const BORDER_COLOR = "#A0704C";
const BUTTON_COLOR = "#886B47";

// --- Thematic Preferences Data (THEME_PREFERENCES) ---
const THEME_PREFERENCES = [
  // --- CARD 1: CULINARY REGION (region) ---
  {
    theme: "CULINARY CULTURE 🌍",
    description: "Which regional flavors do you love? (Select multiple)",
    key: "region",
    tags: [
      { name: "Vietnam", value: "Vietnam", icon: "flag" },
      { name: "Asia (Other)", value: "Asia", icon: "food-fork-drink" },
      { name: "Europe/Americas", value: "Europe", icon: "pizza" },
      { name: "Latin America", value: "Latinh", icon: "fire" },
      { name: "Mediterranean", value: "Mediterranean", icon: "weather-sunny" },
    ],
    singleSelection: false,
  },

  // --- CARD 2: SIGNATURE DISHES (favorite_dishes) ---
  {
    theme: "SIGNATURE DISHES 🍜",
    description:
      "Which dishes do you always want to eat or cook? (Select multiple)",
    key: "favorite_dishes",
    tags: [
      { name: "Pho", value: "Pho", icon: "bowl-mix" },
      { name: "Banh Mi", value: "BanhMi", icon: "baguette" },
      { name: "Sushi", value: "Sushi", icon: "fish" },
      { name: "Pizza", value: "Pizza", icon: "pizza" },
      { name: "Burger", value: "Burger", icon: "hamburger" },
      { name: "Salad/Vegetables", value: "Salad", icon: "leaf" },
    ],
    singleSelection: false,
  },

  // --- CARD 3: KEY INGREDIENTS (favorite_ingredients) ---
  {
    theme: "ESSENTIAL INGREDIENTS 🥩",
    description:
      "Which main ingredients are indispensable in your kitchen? (Select multiple)",
    key: "favorite_ingredients",
    tags: [
      { name: "Chicken", value: "Chicken", icon: "food-drumstick" }, // ĐÃ SỬA: chicken-leg -> food-drumstick (gần gũi và chắc chắn có)
      { name: "Beef", value: "Beef", icon: "cow" },
      { name: "Seafood", value: "Seafood", icon: "fish" },
      { name: "Eggs", value: "Eggs", icon: "egg-outline" }, // ĐÃ SỬA: egg-multiple -> egg-outline (chắc chắn có)
      { name: "Carrot", value: "Carrot", icon: "carrot" },
      { name: "Rice/Noodles", value: "Rice/Noodles", icon: "rice" },
    ],
    singleSelection: false,
  },

  // --- CARD 4: DIET (diet) ---
  {
    theme: "DIETARY RESTRICTIONS 🥕",
    description: "Which diet are you currently following? (Select multiple)",
    key: "diet",
    tags: [
      { name: "Vegan", value: "Vegan", icon: "leaf" },
      { name: "Vegetarian", value: "Vegetarian", icon: "food-apple" },
      { name: "Gluten-Free", value: "Gluten-Free", icon: "circle-off-outline" },
      { name: "Low Carb", value: "Low-Carb", icon: "corn-off" }, // ĐÃ SỬA: water-low -> corn-off (biểu thị việc kiêng tinh bột/carb)
      { name: "High Protein", value: "High-Protein", icon: "dumbbell" },
    ],
    singleSelection: false,
  },

  // --- CARD 5: COOKING SKILL LEVEL (cooking_skill_level) ---
  {
    theme: "COOKING SKILL LEVEL 🧑‍🍳",
    description: "What is your current cooking skill level? (Select one)",
    key: "cooking_skill_level",
    tags: [
      { name: "Beginner (1)", value: 1, icon: "emoticon-sad-outline" },
      { name: "Intermediate (2)", value: 2, icon: "emoticon-happy-outline" },
      { name: "Advanced (3)", value: 3, icon: "star" },
      { name: "Expert (4)", value: 4, icon: "medal" },
      { name: "Master (5)", value: 5, icon: "trophy" },
    ],
    singleSelection: true,
  },
];
// Tag Component
const ThemeTag = ({ tag, isSelected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.tagButton,
      isSelected ? styles.tagButtonActive : styles.tagButtonInactive,
    ]}
    onPress={onPress}
  >
    <MaterialCommunityIcons
      name={tag.icon}
      size={18}
      color={isSelected ? "#fff" : TEXT_DARK}
      style={{ marginRight: 8 }}
    />
    <Text
      style={[
        styles.tagText,
        isSelected ? styles.tagTextActive : styles.tagTextInactive,
      ]}
    >
      {tag.name}
    </Text>
  </TouchableOpacity>
);

export default function HabitCollectionScreen() {
  const navigation = useNavigation();
  const { updateLoading, completeHabitCollection } = useUserUpdateAPI();

  const [preferences, setPreferences] = useState({});

  const toggleTag = (themeKey, tagValue, isSingleSelection) => {
    setPreferences((prevPrefs) => {
      const currentTags = prevPrefs[themeKey] || [];
      let newTags;

      if (isSingleSelection) {
        newTags = currentTags.includes(tagValue) ? [] : [tagValue];
      } else {
        if (currentTags.includes(tagValue)) {
          newTags = currentTags.filter((tag) => tag !== tagValue);
        } else {
          newTags = [...currentTags, tagValue];
        }
      }

      // Specific logic for single selection (like cooking_skill_level)
      if (isSingleSelection && themeKey === "cooking_skill_level") {
        newTags = newTags.length > 0 ? [tagValue] : [];
      }

      return {
        ...prevPrefs,
        [themeKey]: newTags,
      };
    });
  };

  const totalSelected = Object.values(preferences).flat().length;

  const handleSubmit = async () => {
    if (updateLoading) return;

    // --- MINIMUM VALIDATION CHECK ---
    if ((preferences.region?.length || 0) === 0) {
      Alert.alert(
        "Missing Information",
        "Please select at least one favorite culinary region."
      );
      return;
    }
    if ((preferences.cooking_skill_level?.length || 0) !== 1) {
      Alert.alert(
        "Missing Information",
        "Please select your cooking skill level (only one selection allowed)."
      );
      return;
    }

    // --- 1. GET COOKING LEVEL (Single numeric value) ---
    const cookingLevel = preferences.cooking_skill_level?.[0] || 2;

    // --- 2. CONVERT PREFERENCES TO NEW TAGS ARRAY PAYLOAD ---
    const newTagsPayload = [];

    // Loop through all preferences keys, excluding cooking_skill_level
    for (const [key, values] of Object.entries(preferences)) {
      if (key !== "cooking_skill_level" && Array.isArray(values)) {
        values.forEach((tagValue) => {
          // All selected preference tags are given a default score of 1
          newTagsPayload.push({
            tag_name: tagValue,
            score: 1,
          });
        });
      }
    }

    // --- 3. CREATE FINAL API PAYLOAD ---
    const aiProfilePayload = {
      cooking_skill_level: cookingLevel,
      tags: newTagsPayload,
    };

    console.log("AI Profile Payload (New Structure):", aiProfilePayload);

    try {
      await completeHabitCollection(aiProfilePayload);

      Alert.alert(
        "Excellent!",
        `Your AI profile has been saved. Let's start exploring!`
      );

      navigation.replace("MainTabs");
    } catch (error) {
      console.error("Error submitting AI profile:", error);
      Alert.alert(
        "Error",
        "Could not save personal profile. Please try again."
      );
    }
  };

  // --- RENDER ---
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_LIGHT} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>✨ Personal Profile Setup</Text>
        <Text style={styles.subHeader}>
          Select the tags that best describe your preferences. This is a crucial
          step for personalizing recipe suggestions.
        </Text>

        {THEME_PREFERENCES.map((themeItem) => (
          <View key={themeItem.key} style={styles.themeContainer}>
            <Text style={styles.themeTitle}>{themeItem.theme}</Text>
            <Text style={styles.themeDescription}>{themeItem.description}</Text>

            <View style={styles.tagsWrapper}>
              {themeItem.tags.map((tag) => (
                <ThemeTag
                  key={tag.value}
                  tag={tag}
                  isSelected={(preferences[themeItem.key] || []).includes(
                    tag.value
                  )}
                  onPress={() =>
                    toggleTag(
                      themeItem.key,
                      tag.value,
                      themeItem.singleSelection
                    )
                  }
                />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={updateLoading}
        >
          {updateLoading ? (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={{ marginRight: 10 }}
            />
          ) : (
            <Ionicons name="save" size={20} color="#fff" />
          )}

          <Text style={styles.submitButtonText}>
            {updateLoading
              ? "Saving..."
              : `Save Profile & Start (${totalSelected} selected)`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  container: {
    padding: 20,
    paddingBottom: 50,
    top: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: PRIMARY_BLUE,
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 16,
    color: TEXT_DARK,
    marginBottom: 30,
    lineHeight: 24,
  },
  themeContainer: {
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderLeftWidth: 5,
    borderLeftColor: BORDER_COLOR,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: PRIMARY_BLUE,
    marginBottom: 5,
  },
  themeDescription: {
    fontSize: 14,
    color: TEXT_DARK,
    marginBottom: 15,
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  tagButtonInactive: {
    backgroundColor: BACKGROUND_LIGHT,
    borderColor: "#D0C0B0",
  },
  tagButtonActive: {
    backgroundColor: ACTIVE_COLOR,
    borderColor: ACTIVE_COLOR,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tagTextInactive: {
    color: TEXT_DARK,
  },
  tagTextActive: {
    color: "#fff",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BUTTON_COLOR,
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    shadowColor: BUTTON_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
