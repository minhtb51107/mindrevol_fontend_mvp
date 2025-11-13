// File: src/features/community/services/friendService.js
import apiClient from '@/services/axios';

const API_URL = '/friends'; // Dùng URL mới

export default {
  getMyFriends() {
    return apiClient.get(`${API_URL}/my-friends`);
  },
  getPendingRequests() {
    return apiClient.get(`${API_URL}/pending-requests`);
  },
  sendFriendRequest(email) {
    return apiClient.post(`${API_URL}/request`, { email });
  },
  acceptRequest(friendshipId) {
    return apiClient.put(`${API_URL}/accept/${friendshipId}`);
  },
  declineRequest(friendshipId) {
    return apiClient.delete(`${API_URL}/decline/${friendshipId}`);
  },
  removeFriend(friendUserId) {
    return apiClient.delete(`${API_URL}/remove/${friendUserId}`);
  },
};