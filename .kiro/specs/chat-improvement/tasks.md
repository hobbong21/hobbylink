# Implementation Plan

- [x] 1. Set up enhanced data models and database schema
  - Create MessageStatus enum and update ChatMessage entity with status tracking fields
  - Create TypingStatus entity for managing typing indicators
  - Create UserSession entity for connection management
  - Write database migration scripts for new tables and columns
  - _Requirements: 2.1, 3.1, 3.2, 7.1, 7.2_

- [-] 2. Implement message status tracking system
  - [x] 2.1 Enhance ChatMessage entity with status fields
    - Add MessageStatus enum (SENDING, DELIVERED, READ, FAILED)
    - Add deliveredAt, readAt timestamps and clientMessageId field to ChatMessage
    - Update ChatMessage constructors and getters/setters
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Create MessageStatusService for status management
    - Implement methods to update message status (delivered, read, failed)
    - Add message status validation and business logic
    - Create unit tests for message status operations
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.3 Update ChatMessageRepository with status queries
    - Add methods to find messages by status
    - Add methods to update message status in bulk
    - Create integration tests for repository methods
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Implement typing indicator system
  - [x] 3.1 Create TypingStatus entity and repository
    - Define TypingStatus entity with meetupId, userId, isTyping, lastTypingAt fields
    - Create TypingStatusRepository with custom queries for active typing users
    - Write unit tests for typing status persistence
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.2 Implement TypingIndicatorService
    - Create service methods for startTyping, stopTyping, and getTypingUsers
    - Add automatic cleanup of stale typing indicators (older than 3 seconds)
    - Implement logic for multiple users typing display
    - Write unit tests for typing indicator business logic
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.3 Add WebSocket endpoints for typing indicators
    - Create WebSocket message mapping for typing start/stop events
    - Implement broadcasting of typing status to meetup participants
    - Add error handling for typing indicator WebSocket messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 4. Implement connection management and user presence
  - [x] 4.1 Create UserSession entity and management service
    - Define UserSession entity with sessionId, userId, meetupId, status, lastActivity
    - Create UserSessionRepository with queries for online users
    - Implement ConnectionManagerService for session lifecycle management
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 4.2 Add WebSocket connection event handlers
    - Implement session creation on WebSocket connect
    - Add session cleanup on WebSocket disconnect
    - Create heartbeat mechanism for activity tracking
    - Write integration tests for connection lifecycle
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 4.3 Implement online user status broadcasting
    - Add WebSocket endpoints for user status updates
    - Implement broadcasting of online/offline status changes
    - Add "away" status detection for idle users (5 minutes)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 5. Enhance WebSocket controllers with new features
  - [x] 5.1 Update WebSocketChatController with status tracking
    - Modify sendMessage method to include clientMessageId and status
    - Add message delivery confirmation handling
    - Implement error response for failed message sending
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Add typing indicator WebSocket handlers
    - Create message mapping for typing indicator events
    - Implement typing status broadcasting to meetup participants
    - Add validation for typing indicator requests
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 5.3 Implement message status update endpoints
    - Create WebSocket endpoint for message read confirmations
    - Add bulk message status update functionality
    - Implement status change broadcasting to message sender
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6. Implement message history and pagination
  - [x] 6.1 Enhance ChatMessageRepository with pagination
    - Add method to load last 50 messages on chat join
    - Implement pagination for loading previous messages (20 at a time)
    - Add efficient database queries with proper indexing
    - Write performance tests for message loading
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 6.2 Update ChatService with history management
    - Modify getChatMessages to support pagination
    - Add method for loading message history with offset
    - Implement message ordering and filtering logic
    - Create unit tests for message history functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 6.3 Add REST endpoints for message history
    - Create endpoint for initial message loading
    - Add endpoint for paginated message history
    - Implement proper error handling for history requests
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. Implement error handling and connection recovery
  - [x] 7.1 Add WebSocket connection error handling
    - Implement automatic reconnection with exponential backoff
    - Add connection status tracking and user feedback
    - Create error message broadcasting for connection issues
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.2 Implement message retry mechanism
    - Add client-side message queuing for failed sends
    - Implement retry logic with exponential backoff
    - Add duplicate message prevention using clientMessageId
    - Write integration tests for retry scenarios
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.3 Add message synchronization on reconnect
    - Implement missed message detection and fetching
    - Add timestamp-based message sync after reconnection
    - Create conflict resolution for duplicate messages
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Implement browser notifications
  - [x] 8.1 Add notification service for new messages
    - Create browser notification API integration
    - Implement notification permission handling
    - Add notification content formatting and display
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 8.2 Implement unread message tracking
    - Add unread message count tracking per user
    - Implement page title updates with unread count
    - Create notification clearing when user returns to chat
    - Write unit tests for notification logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9. Add message formatting support
  - [x] 9.1 Implement basic text formatting
    - Add support for bold (**text**) and italic (*text*) formatting
    - Implement inline code formatting (`code`)
    - Add automatic URL detection and link conversion
    - Create message content sanitization for security
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 9.2 Create message formatting component
    - Build React component for rendering formatted messages
    - Add formatting preview in message input
    - Implement proper HTML escaping for security
    - Write unit tests for formatting functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 10. Create enhanced frontend chat component
  - [x] 10.1 Build WebSocket connection manager
    - Create WebSocketManager class with connection lifecycle management
    - Implement automatic reconnection with status feedback
    - Add message queuing and retry functionality
    - Write unit tests for connection manager
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.2 Create enhanced chat UI components
    - Build typing indicator display component
    - Create online users list component
    - Add message status indicators (sending, delivered, read)
    - Implement connection status display
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 10.3 Integrate message history and pagination
    - Add infinite scroll for message history loading
    - Implement "load more messages" functionality
    - Create smooth scrolling and message positioning
    - Add loading states for message history
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 11. Add comprehensive error handling and user feedback
  - [x] 11.1 Implement user-friendly error messages
    - Create error message components for different failure types
    - Add retry buttons for failed operations
    - Implement connection status indicators
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 11.2 Add loading states and feedback
    - Create loading indicators for message sending
    - Add skeleton loading for message history
    - Implement typing indicator animations
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

- [x] 12. Write comprehensive tests
  - [x] 12.1 Create unit tests for all service classes
    - Write tests for ChatService, TypingIndicatorService, ConnectionManagerService
    - Add tests for MessageStatusService and error handling
    - Create mock-based tests for WebSocket interactions
    - _Requirements: All requirements_

  - [x] 12.2 Write integration tests for WebSocket functionality
    - Create tests for full message sending and receiving flow
    - Add tests for typing indicator broadcasting
    - Test connection management and user presence features
    - _Requirements: All requirements_

  - [x] 12.3 Add end-to-end tests for chat functionality
    - Create multi-user chat simulation tests
    - Test message history loading and pagination
    - Add tests for error scenarios and recovery
    - _Requirements: All requirements_