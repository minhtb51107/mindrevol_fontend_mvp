// File: src/services/websocketService.js
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import { Client } from '@stomp/stompjs';
// Cập nhật đường dẫn import mới
import { useAuthStore } from '@/features/auth/stores/authStore';

const SOCKET_URL = 'http://localhost:8080/ws';

let stompClient = null;
let subscriptions = {};
let connectionPromise = null;
let isConnecting = false;

const websocketService = {
  connect(forceReconnect = false) {
    if ((stompClient?.connected || isConnecting) && !forceReconnect) {
      console.log('WebSocket: Already connected or connecting.');
      return connectionPromise || Promise.resolve();
    }

    isConnecting = true;
    console.log('WebSocket: Attempting to connect...');
    const authStore = useAuthStore();
    const token = authStore.accessToken;

    if (!token) {
        console.warn('WebSocket: No access token found. Connection aborted.');
        isConnecting = false;
        return Promise.reject(new Error('No access token for WebSocket connection'));
    }

    const socketFactory = () => {
       // Sử dụng URL không có token query param
       return new SockJS(SOCKET_URL);
    };

    stompClient = new Client({
      webSocketFactory: socketFactory,
      connectHeaders: {
          Authorization: `Bearer ${token}`, // Gửi token qua header
      },
      debug: function (str) {
        // console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    connectionPromise = new Promise((resolve, reject) => {
      stompClient.onConnect = (frame) => {
        isConnecting = false;
        console.log('WebSocket: Connected:', frame);
        // Resubscribe topics sau khi kết nối lại
        Object.keys(subscriptions).forEach(topic => {
           console.log(`WebSocket: Resubscribing to ${topic}`);
           if (subscriptions[topic]?.messageHandler) { // Kiểm tra messageHandler tồn tại
              websocketService._subscribeInternal(topic, subscriptions[topic].messageHandler);
           }
        });
        resolve();
      };

      stompClient.onStompError = (frame) => {
        isConnecting = false;
        console.error('WebSocket: Broker reported error:', frame.headers['message']);
        console.error('WebSocket: Additional details:', frame.body);
        reject(new Error(frame.headers['message'] || 'STOMP Connection Error'));
        connectionPromise = null; // Reset promise on error
      };

       stompClient.onWebSocketError = (error) => {
         isConnecting = false;
         console.error('WebSocket: Connection Error:', error);
         // Không reject promise vì client sẽ tự reconnect
         // connectionPromise = null; // Reset promise on error
       };

        stompClient.onDisconnect = (frame) => { // Thêm frame để xem lý do disconnect
          isConnecting = false;
          console.log('WebSocket: Disconnected. Reason:', frame?.headers?.message || frame?.body || 'Unknown');
          connectionPromise = null;
          // Clear subscriptions state on clean disconnect? Maybe not if auto-reconnecting.
          // subscriptions = {}; // Reset subscriptions nếu muốn re-subscribe lại từ đầu
        };

      try {
        stompClient.activate();
      } catch (error) {
          console.error("WebSocket: Activation failed", error);
          isConnecting = false;
          reject(error);
          connectionPromise = null;
      }
    });

    return connectionPromise;
  },

  disconnect() {
    // Lưu lại subscriptions trước khi deactivate để dùng khi reconnect
    // const currentHandlers = { ...subscriptions }; // Tạo bản sao

    if (stompClient?.active) { // Kiểm tra active thay vì connected
      console.log('WebSocket: Deactivating client...');
      // Không cần unsubscribe thủ công vì deactivate sẽ làm việc đó
      // Object.keys(subscriptions).forEach(topic => this.unsubscribe(topic));
      try {
        stompClient.deactivate(); // Deactivate sẽ tự đóng kết nối và dọn dẹp
      } catch (error) {
        console.error("WebSocket: Error during deactivate:", error);
      }
    } else {
        console.log('WebSocket: Client already inactive.');
    }
    // Reset state sau khi deactivate (hoặc trong onDisconnect)
    stompClient = null;
    connectionPromise = null;
    isConnecting = false;
    subscriptions = {}; // Xóa subscriptions khi ngắt kết nối chủ động
    console.log('WebSocket: Client deactivated and state reset.');
  },

  _subscribeInternal(topic, messageHandler) {
      if (!stompClient || !stompClient.connected) {
         console.error(`WebSocket: Cannot subscribe to ${topic}. Not connected.`);
         return;
      }

      // Check if already subscribed to prevent duplicates after reconnect
      if (subscriptions[topic]) {
          console.log(`WebSocket: Already subscribed to ${topic}. Skipping.`);
          return; // Hoặc unsubscribe cũ trước nếu logic yêu cầu?
      }

      console.log(`WebSocket: Subscribing to ${topic}`);
      try {
        // Lưu messageHandler trước khi subscribe
        subscriptions[topic] = { messageHandler };
        const subscription = stompClient.subscribe(topic, (message) => {
          try {
            const parsedBody = JSON.parse(message.body);
            messageHandler(parsedBody);
          } catch (e) {
            console.error(`WebSocket: Error parsing message body on ${topic}:`, e, message.body);
          }
        },
        // Header ID không cần thiết lắm nếu quản lý bằng object subscriptions
        // { id: `sub-${topic}` }
        );

        // Cập nhật subscription object với hàm unsubscribe thực tế
        subscriptions[topic].unsubscribe = () => {
            try {
              subscription.unsubscribe();
              console.log(`WebSocket: Unsubscribed callback executed for ${topic}`);
            } catch(e) {
              console.error(`WebSocket: Error in unsubscribe callback for ${topic}:`, e);
            }
        };
      } catch (error) {
           console.error(`WebSocket: Failed to subscribe to ${topic}:`, error);
           delete subscriptions[topic]; // Xóa khỏi quản lý nếu subscribe lỗi
      }
  },

  subscribe(topic, messageHandler) {
    const doSubscribe = () => {
        // Chỉ subscribe nếu client còn tồn tại và đang kết nối
        if (stompClient && stompClient.connected) {
            this._subscribeInternal(topic, messageHandler);
        } else {
            console.warn(`WebSocket: Cannot subscribe to ${topic}. Client not connected.`);
        }
    };

    if (stompClient?.connected) {
        doSubscribe();
        return Promise.resolve();
    } else if (isConnecting && connectionPromise) {
        console.log(`WebSocket: Queuing subscription to ${topic} until connected.`);
        return connectionPromise.then(doSubscribe).catch(err => {
             console.error(`WebSocket: Connection failed before subscribing to ${topic}:`, err);
             throw err;
        });
    } else {
        console.log(`WebSocket: Not connected. Connecting before subscribing to ${topic}...`);
        return this.connect().then(doSubscribe).catch(err => {
            console.error(`WebSocket: Initial connection failed when trying to subscribe to ${topic}:`, err);
            // Có thể thử lại kết nối sau một khoảng thời gian?
            throw err;
        });
    }
  },

  unsubscribe(topic) {
    if (subscriptions[topic] && subscriptions[topic].unsubscribe) {
      console.log(`WebSocket: Unsubscribing from ${topic}`);
      try {
         subscriptions[topic].unsubscribe(); // Gọi hàm unsubscribe đã lưu
      } catch (e) {
         console.error(`WebSocket: Error during unsubscribe from ${topic}:`, e);
      }
    } else {
       console.log(`WebSocket: No active/valid subscription found for ${topic} to unsubscribe.`);
    }
     delete subscriptions[topic]; // Luôn xóa khỏi quản lý
  },

  isConnected() {
      return stompClient?.connected ?? false;
  }
};

export default websocketService;