import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useAuth } from "../components/AuthContext"; // Đảm bảo đường dẫn đúng

const API_URL = "https://mealmaker-backend-production.up.railway.app/api/";

export const useUserUpdateAPI = () => {
  const { userId, processResponse, fetchUserData } = useAuth();

  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // --- HÀM CẬP NHẬT HỒ SƠ AI ---
  const completeHabitCollection = useCallback(
    async (aiProfilePayload) => {
      if (!userId) {
        Alert.alert("Lỗi", "Không tìm thấy ID người dùng.");
        return;
      }

      const endpoint = `${API_URL}users/${userId}/ai_profile`;

      // Gửi body đơn giản (chỉ dữ liệu profile)
      const finalBody = {
        ...aiProfilePayload,
        timestamp: new Date().toISOString(), // Thêm timestamp
      };

      const config = {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBody),
      };

      setUpdateLoading(true);
      setUpdateError(null);

      try {
        const response = await fetch(endpoint, config);
        await processResponse(response, endpoint);

        // --- QUAN TRỌNG: TẢI LẠI DỮ LIỆU USER SAU KHI CẬP NHẬT ---
        // Thao tác này sẽ kích hoạt logic kiểm tra AI_PROFILE trong AuthContext.js
        await fetchUserData(userId);

        console.log("Cập nhật AI Profile thành công và đã đồng bộ Context.");
      } catch (error) {
        setUpdateError(error.message);
        Alert.alert("Lỗi Cập nhật", error.message);
        throw error;
      } finally {
        setUpdateLoading(false);
      }
    },
    [userId, processResponse, fetchUserData]
  );

  // --- HÀM CẬP NHẬT/LƯU DỮ LIỆU TỦ LẠNH ---
  const updateFridge = useCallback(
    async (fridgeDataPayload) => {
      if (!userId) {
        Alert.alert("Lỗi", "Không tìm thấy ID người dùng.");
        return;
      }

      // Giả định endpoint lưu tủ lạnh là /api/users/:id/fridge
      const endpoint = `${API_URL}users/${userId}/fridge`;

      const config = {
        method: "PATCH", // Hoặc PUT tùy theo API của bạn
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fridgeDataPayload),
      };

      setUpdateLoading(true);
      setUpdateError(null);

      try {
        const response = await fetch(endpoint, config);
        await processResponse(response, endpoint);

        console.log("Lưu dữ liệu tủ lạnh thành công.");
      } catch (error) {
        setUpdateError(error.message);
        Alert.alert("Lỗi Lưu Tủ Lạnh", error.message);
        throw error;
      } finally {
        setUpdateLoading(false);
      }
    },
    [userId, processResponse]
  );

  const fetchWeeklyData = useCallback(
    async (recipeIdsArray) => {
      if (!userId) {
        return;
      }

      const endpoint = `${API_URL}users/${userId}/weekly_menu`;

      // ⭐ Đóng gói mảng IDs vào đối tượng { weekly_menu: [...] } ⭐
      const payloadToSend = {
        weekly_menu: recipeIdsArray,
      };

      const config = {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSend), // Gửi payload đã bọc
      };

      setUpdateLoading(true);
      setUpdateError(null);

      try {
        const response = await fetch(endpoint, config);
        // Giả định processResponse xử lý lỗi HTTP và trả về body JSON
        await processResponse(response, endpoint);

        console.log("Lưu menu thành công.");
      } catch (error) {
        setUpdateError(error.message);
        Alert.alert("Lỗi Lưu Menu", error.message);
        throw error;
      } finally {
        setUpdateLoading(false);
      }
    },
    [userId, processResponse]
  ); // Giả định API_URL, setUpdateLoading, setUpdateError được truy cập

  return {
    updateLoading,
    updateError,
    completeHabitCollection,
    updateFridge,
    fetchWeeklyData,
  };
};
