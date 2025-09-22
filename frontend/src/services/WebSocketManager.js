import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { v4 as uuidv4 } from 'uuid';

/**
 * WebSocket 연결 관리 클래스
 */
class WebSocketManager {
  constructor(meetupId, userId) {
    this.meetupId = meetupId;
    this.userId = userId;
    this.stompClient = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageQueue = [];
    this.connected = false;
    this.subscriptions = new Map();
    this.eventHandlers = new Map();
    this.heartbeatInterval = null;
  }

  /**
   * 편의 콜백 일괄 등록
   * @param {{ onConnect?: Function, onDisconnect?: Function, onMessageReceived?: Function, onTypingStatusReceived?: Function, onMessageStatusReceived?: Function, onError?: Function }} callbacks
   */
  registerCallbacks(callbacks = {}) {
    const {
      onConnect,
      onDisconnect,
      onMessageReceived,
      onTypingStatusReceived,
      onMessageStatusReceived,
      onError,
    } = callbacks;

    if (onConnect) this.on('connected', onConnect);
    if (onDisconnect) this.on('disconnected', onDisconnect);
    if (onMessageReceived) this.on('messageReceived', onMessageReceived);
    if (onTypingStatusReceived) this.on('typingStatusReceived', onTypingStatusReceived);
    // 내부 이벤트명은 messageStatusUpdated이지만, 외부 콜백명은 onMessageStatusReceived를 지원
    if (onMessageStatusReceived) this.on('messageStatusUpdated', onMessageStatusReceived);
    if (onError) this.on('error', onError);
  }

  /**
   * WebSocket 연결 시작
   */
  connect() {
    try {
      const socket = new SockJS('/ws');
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          userId: this.userId.toString(),
          meetupId: this.meetupId.toString()
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: this.onConnected.bind(this),
        onStompError: this.onError.bind(this),
        onWebSocketClose: this.onDisconnected.bind(this),
        onWebSocketError: this.onError.bind(this)
      });

      this.stompClient.activate();
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.onError(error);
    }
  }

  /**
   * 연결 성공 시 호출
   */
  onConnected() {
    console.log('WebSocket connected successfully');
    this.connected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    // 이벤트 핸들러 호출
    this.triggerEvent('connected');

    // 구독 설정
    this.setupSubscriptions();

    // 큐에 있는 메시지 전송
    this.flushMessageQueue();

    // 하트비트 시작
    this.startHeartbeat();

    // 사용자 입장 알림
    this.sendUserJoin();

    // 메시지 동기화 요청
    this.requestMessageSync();
  }

  /**
   * 연결 해제 시 호출
   */
  onDisconnected() {
    console.log('WebSocket disconnected');
    this.connected = false;
    this.stopHeartbeat();
    this.triggerEvent('disconnected');
    
    // 자동 재연결 시도
    this.reconnect();
  }

  /**
   * 오류 발생 시 호출
   */
  onError(error) {
    console.error('WebSocket error:', error);
    this.connected = false;
    this.triggerEvent('error', error);
    
    // 재연결 시도
    this.reconnect();
  }

  /**
   * 구독 설정
   */
  setupSubscriptions() {
    // 메시지 구독
    this.subscribe(`/topic/meetup/${this.meetupId}/messages`, (message) => {
      const messageData = JSON.parse(message.body);
      this.triggerEvent('messageReceived', messageData);
    });

    // 타이핑 상태 구독
    this.subscribe(`/topic/meetup/${this.meetupId}/typing`, (message) => {
      const typingData = JSON.parse(message.body);
      this.triggerEvent('typingStatusReceived', typingData);
    });

    // 온라인 사용자 구독
    this.subscribe(`/topic/meetup/${this.meetupId}/users`, (message) => {
      const usersData = JSON.parse(message.body);
      this.triggerEvent('onlineUsersUpdated', usersData);
    });

    // 개인 알림 구독
    this.subscribe(`/user/${this.userId}/queue/notifications`, (message) => {
      const notification = JSON.parse(message.body);
      this.triggerEvent('notificationReceived', notification);
    });

    // 메시지 상태 업데이트 구독
    this.subscribe(`/user/${this.userId}/queue/message-status`, (message) => {
      const statusUpdate = JSON.parse(message.body);
      this.triggerEvent('messageStatusUpdated', statusUpdate);
    });

    // 메시지 동기화 구독
    this.subscribe(`/user/${this.userId}/queue/message-sync`, (message) => {
      const syncData = JSON.parse(message.body);
      this.triggerEvent('messagesSynced', syncData);
    });

    // 오류 메시지 구독
    this.subscribe(`/user/${this.userId}/queue/errors`, (message) => {
      const error = JSON.parse(message.body);
      this.triggerEvent('errorReceived', error);
    });

    // 읽지 않은 메시지 수 구독
    this.subscribe(`/user/${this.userId}/queue/unread-count`, (message) => {
      const unreadData = JSON.parse(message.body);
      this.triggerEvent('unreadCountUpdated', unreadData);
    });
  }

  /**
   * 토픽 구독
   */
  subscribe(destination, callback) {
    if (this.stompClient && this.connected) {
      const subscription = this.stompClient.subscribe(destination, callback);
      this.subscriptions.set(destination, subscription);
      return subscription;
    }
    return null;
  }

  /**
   * 구독 해제
   */
  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  /**
   * 연결 해제
   */
  disconnect() {
    if (this.stompClient) {
      // 사용자 퇴장 알림
      this.sendUserLeave();
      
      // 하트비트 중지
      this.stopHeartbeat();
      
      // 모든 구독 해제
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      
      // 연결 해제
      this.stompClient.deactivate();
      this.connected = false;
      
      this.triggerEvent('disconnected');
    }
  }

  /**
   * 메시지 전송
   */
  sendMessage(content, clientMessageId = null) {
    const messageId = clientMessageId || uuidv4();
    const message = {
      content: content,
      senderId: this.userId,
      meetupId: this.meetupId,
      clientMessageId: messageId,
      timestamp: new Date().toISOString()
    };

    if (this.connected && this.stompClient) {
      try {
        this.stompClient.publish({
          destination: `/app/chat/${this.meetupId}/message`,
          body: JSON.stringify(message)
        });
        
        console.log('Message sent:', messageId);
        return messageId;
      } catch (error) {
        console.error('Error sending message:', error);
        this.queueMessage(`/app/chat/${this.meetupId}/message`, message);
        this.triggerEvent('messageSendFailed', { messageId, error });
        return messageId;
      }
    } else {
      // 연결이 끊어진 경우 메시지 큐에 추가
      this.queueMessage(`/app/chat/${this.meetupId}/message`, message);
      this.reconnect();
      return messageId;
    }
  }

  /**
   * 타이핑 상태 전송
   */
  sendTypingIndicator(isTyping) {
    if (this.connected && this.stompClient) {
      try {
        this.stompClient.publish({
          destination: `/app/chat/${this.meetupId}/typing`,
          body: JSON.stringify({
            userId: this.userId,
            meetupId: this.meetupId,
            isTyping: isTyping
          })
        });
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }
    }
  }

  /**
   * 메시지 상태 업데이트
   */
  updateMessageStatus(messageId, status) {
    if (this.connected && this.stompClient) {
      try {
        this.stompClient.publish({
          destination: `/app/chat/${this.meetupId}/status`,
          body: JSON.stringify({
            messageId: messageId,
            userId: this.userId,
            status: status
          })
        });
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    }
  }

  /**
   * 메시지를 읽음으로 표시
   */
  markMessageAsRead(messageId) {
    this.updateMessageStatus(messageId, 'READ');
  }

  /**
   * 메시지 재시도
   */
  retryMessage(clientMessageId) {
    if (this.connected && this.stompClient) {
      try {
        this.stompClient.publish({
          destination: `/app/chat/${this.meetupId}/retry`,
          body: JSON.stringify({
            clientMessageId: clientMessageId,
            senderId: this.userId
          })
        });
      } catch (error) {
        console.error('Error retrying message:', error);
      }
    }
  }

  /**
   * 메시지 동기화 요청
   */
  requestMessageSync(lastSyncTime = null) {
    if (this.connected && this.stompClient) {
      try {
        this.stompClient.publish({
          destination: `/app/chat/${this.meetupId}/sync`,
          body: JSON.stringify({
            userId: this.userId,
            lastSyncTime: lastSyncTime
          })
        });
      } catch (error) {
        console.error('Error requesting message sync:', error);
      }
    }
  }

  /**
   * 사용자 입장 알림
   */
  sendUserJoin() {
    if (this.connected && this.stompClient) {
      try {
        this.stompClient.publish({
          destination: `/app/chat/${this.meetupId}/join`,
          body: JSON.stringify({
            userId: this.userId,
            sessionId: this.stompClient.connectedHeaders?.session || 'unknown'
          })
        });
      } catch (error) {
        console.error('Error sending user join:', error);
      }
    }
  }

  /**
   * 사용자 퇴장 알림
   */
  sendUserLeave() {
    if (this.connected && this.stompClient) {
      try {
        this.stompClient.publish({
          destination: `/app/chat/${this.meetupId}/leave`,
          body: JSON.stringify({
            userId: this.userId,
            sessionId: this.stompClient.connectedHeaders?.session || 'unknown'
          })
        });
      } catch (error) {
        console.error('Error sending user leave:', error);
      }
    }
  }

  /**
   * 하트비트 시작
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.connected && this.stompClient) {
        try {
          this.stompClient.publish({
            destination: `/app/chat/${this.meetupId}/heartbeat`,
            body: JSON.stringify({
              sessionId: this.stompClient.connectedHeaders?.session || 'unknown',
              timestamp: Date.now()
            })
          });
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, 30000); // 30초마다
  }

  /**
   * 하트비트 중지
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 메시지 큐에 추가
   */
  queueMessage(destination, message) {
    this.messageQueue.push({
      destination: destination,
      message: message,
      timestamp: Date.now()
    });

    // 큐 크기 제한 (최대 50개)
    if (this.messageQueue.length > 50) {
      this.messageQueue.shift();
    }
  }

  /**
   * 큐에 있는 메시지 전송
   */
  flushMessageQueue() {
    if (this.connected && this.stompClient && this.messageQueue.length > 0) {
      console.log(`Flushing ${this.messageQueue.length} queued messages`);
      
      const messagesToSend = [...this.messageQueue];
      this.messageQueue = [];

      messagesToSend.forEach(item => {
        try {
          this.stompClient.publish({
            destination: item.destination,
            body: JSON.stringify(item.message)
          });
        } catch (error) {
          console.error('Error sending queued message:', error);
          // 실패한 메시지는 다시 큐에 추가
          this.messageQueue.push(item);
        }
      });
    }
  }

  /**
   * 재연결 시도
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.triggerEvent('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    this.triggerEvent('reconnecting', { attempt: this.reconnectAttempts });

    setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // 최대 30초
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * 이벤트 핸들러 등록
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * 이벤트 핸들러 제거
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 이벤트 트리거
   */
  triggerEvent(event, data = null) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected() {
    return this.connected && this.stompClient && this.stompClient.connected;
  }

  /**
   * 연결 상태 정보 반환
   */
  getConnectionInfo() {
    return {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      subscriptions: this.subscriptions.size
    };
  }

  /**
   * 큐 정리 (오래된 메시지 제거)
   */
  cleanupQueue() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5분

    this.messageQueue = this.messageQueue.filter(item => {
      return (now - item.timestamp) < maxAge;
    });
  }
}

export default WebSocketManager;