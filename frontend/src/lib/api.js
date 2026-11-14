import { axiosInstance } from "./axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers(filters = {}) {
  const response = await axiosInstance.get("/users", { params: filters });
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export const updateProfile = async data => (await axiosInstance.put("/users/profile", data)).data;
export const addLanguage = async data => (await axiosInstance.post("/users/languages", data)).data;
export const updateLanguage = async ({ language, ...data }) => (await axiosInstance.put(`/users/languages/${encodeURIComponent(language)}`, data)).data;
export const removeLanguage = async language => (await axiosInstance.delete(`/users/languages/${encodeURIComponent(language)}`)).data;
export const getEndorsements = async () => {
  const { data } = await axiosInstance.get("/users/endorsements");
  if (!Array.isArray(data)) throw new Error("Unexpected endorsements response. Restart the backend and refresh the page.");
  return data;
};
export const endorseUser = async ({ userId, ...data }) => (await axiosInstance.post(`/users/${userId}/endorse`, data)).data;
export const completeCall = async data => (await axiosInstance.post("/calls/complete", data)).data;
