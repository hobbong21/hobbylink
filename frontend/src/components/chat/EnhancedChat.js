import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import WebSocketManager from '../../services/WebSocketManager';
import './EnhancedChat.css';

/**
 * 개선된 채팅 컴포넌트
 * @param {Object} props - 컴포넌트 속성
 * @param {number} props.meetupId - 미팅 ID
 * @param {Object} props.currentUser - 현재 사용자 정보
 */
const EnhancedChat = ({ meetupId, currentUser }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    const typingTimeoutRef = useRef(null);
    const wsManager = useRef(null);
    const messagesEndRef = useRef(null);
    
    // WebSocket 연결 관리자 초기화 및 이전 메시지 로드
    useEffect(() => {
        if (!meetupId || !currentUser?.id) return;
        
        // WebSocket 연결 관리자 초기화
        wsManager.current = new WebSocketManager(meetupId, currentUser.id);
        
        // 콜백 함수 등록
        wsManager.current.registerCallbacks({
            onConnect: handleConnect,
            onDisconnect: handleDisconnect,
            onMessageReceived: handleMessageReceived,
            onTypingStatusReceived: handleTypingStatusReceived,
            onMessageStatusReceived: handleMessageStatusReceived,
            onError: handleConnectionError
        });
        
        // 연결 시작
        wsManager.current.connect();
        
        // 이전 메시지 로드
        loadPreviousMessages();
        
        // 온라인 사용자 로드
        loadOnlineUsers();
        
        // 컴포넌트 언마운트 시 연결 해제
        return () => {
            if (wsManager.current) {
                wsManager.current.disconnect();
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [meetupId, currentUser?.id]);
    
    // 메시지 목록 스크롤 처리
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    /**
     * 연결 성공 처리
     */
    const handleConnect = () => {
        setConnectionStatus('connected');
        console.log('WebSocket 연결 성공');
    };
    
    /**
     * 연결 해제 처리
     */
    const handleDisconnect = () => {
        setConnectionStatus('disconnected');
        console.log('WebSocket 연결 해제');
    };
    
    /**
     * 연결 오류 처리
     */
    const handleConnectionError = () => {
        setConnectionStatus('error');
        console.error('WebSocket 연결 오류');
    };
    
    /**
     * 메시지 수신 처리
     * @param {Object} message - 수신된 메시지
     */
    const handleMessageReceived = (message) => {
        setMessages(prevMessages => {
            // 이미 같은 clientMessageId를 가진 메시지가 있는지 확인
            const existingIndex = prevMessages.findIndex(
                msg => msg.clientMessageId === message.clientMessageId
            );
            
            if (existingIndex >= 0) {
                // 기존 메시지 업데이트
                const updatedMessages = [...prevMessages];
                updatedMessages[existingIndex] = {
                    ...updatedMessages[existingIndex],
                    id: message.id,
                    status: message.status || 'DELIVERED'
                };
                return updatedMessages;
            } else {
                // 새 메시지 추가
                return [...prevMessages, message];
            }
        });
    };
    
    /**
     * 타이핑 상태 수신 처리
     * @param {Object} typingStatus - 수신된 타이핑 상태
     */
    const handleTypingStatusReceived = (typingStatus) => {
        if (typingStatus.userId === currentUser.id) return;
        
        if (typingStatus.isTyping) {
            // 타이핑 중인 사용자 추가
            setTypingUsers(prev => {
                const exists = prev.some(user => user.id === typingStatus.userId);
                if (!exists) {
                    return [...prev, { id: typingStatus.userId, username: typingStatus.username }];
                }
                return prev;
            });
        } else {
            // 타이핑 중인 사용자 제거
            setTypingUsers(prev => prev.filter(user => user.id !== typingStatus.userId));
        }
    };
    
    /**
     * 메시지 상태 업데이트 수신 처리
     * @param {Object} statusUpdate - 수신된 메시지 상태 업데이트
     */
    const handleMessageStatusReceived = (statusUpdate) => {
        setMessages(prevMessages => {
            return prevMessages.map(msg => {
                if (msg.id === statusUpdate.messageId || msg.clientMessageId === statusUpdate.messageId) {
                    return { ...msg, status: statusUpdate.status };
                }
                return msg;
            });
        });
    };
    
    /**
     * 이전 메시지 로드
     */
    const loadPreviousMessages = async () => {
        try {
            const response = await axios.get(`/api/meetups/${meetupId}/messages`);
            setMessages(response.data);
            
            // 읽지 않은 메시지를 읽음으로 표시
            response.data.forEach(msg => {
                if (msg.senderId !== currentUser.id && msg.status !== 'READ') {
                    wsManager.current?.markMessageAsRead(msg.id);
                }
            });
        } catch (error) {
            console.error('메시지 로드 실패:', error);
        }
    };
    
    /**
     * 온라인 사용자 로드
     */
    const loadOnlineUsers = async () => {
        try {
            const response = await axios.get(`/api/meetups/${meetupId}/online-users`);
            setOnlineUsers(response.data);
        } catch (error) {
            console.error('온라인 사용자 로드 실패:', error);
        }
    };
    
    /**
     * 메시지 전송 처리
     */
    const handleSendMessage = () => {
        if (!inputMessage.trim() || !wsManager.current) return;
        
        const clientMessageId = wsManager.current.sendMessage(inputMessage.trim());
        
        // 낙관적 UI 업데이트
        setMessages(prev => [...prev, {
            id: null,
            content: inputMessage.trim(),
            senderId: currentUser.id,
            senderName: currentUser.username,
            status: 'SENDING',
            clientMessageId,
            timestamp: new Date()
        }]);
        
        setInputMessage('');
        setIsTyping(false);
        wsManager.current.sendTypingIndicator(false);
    };
    
    /**
     * 입력 변경 처리
     * @param {Event} e - 입력 이벤트
     */
    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
        
        // 타이핑 표시기 처리
        if (!isTyping && wsManager.current) {
            setIsTyping(true);
            wsManager.current.sendTypingIndicator(true);
        }
        
        // 타이핑 중지 타이머 재설정
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            wsManager.current?.sendTypingIndicator(false);
        }, 2000);
    };
    
    /**
     * 메시지 목록 하단으로 스크롤
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    /**
     * 메시지 상태 아이콘 렌더링
     * @param {string} status - 메시지 상태
     * @returns {JSX.Element} 상태 아이콘
     */
    const renderMessageStatus = (status) => {
        switch (status) {
            case 'SENDING':
                return <span className="message-status-sending">{t('chat.sending')}</span>;
            case 'DELIVERED':
                return <span className="message-status-delivered">{t('chat.delivered')}</span>;
            case 'READ':
                return <span className="message-status-read">{t('chat.read')}</span>;
            case 'FAILED':
                return <span className="message-status-failed">{t('chat.failed')}</span>;
            default:
                return null;
        }
    };
    
    /**
     * 연결 상태 아이콘 렌더링
     * @returns {JSX.Element} 연결 상태 아이콘
     */
    const renderConnectionStatus = () => {
        switch (connectionStatus) {
            case 'connected':
                return <span className="status-connected">{t('chat.connected')}</span>;
            case 'connecting':
                return <span className="status-connecting">{t('chat.connecting')}</span>;
            case 'disconnected':
            case 'error':
                return <span className="status-disconnected">{t('chat.disconnected')}</span>;
            default:
                return null;
        }
    };
    
    return (
        <div className="enhanced-chat">
            <div className="chat-header">
                <h3>{t('chat.title')}</h3>
                <div className="online-users">
                    {onlineUsers.length > 0 && (
                        <span>{onlineUsers.length} {t('chat.onlineUsers')}</span>
                    )}
                </div>
                <div className="connection-status">
                    {renderConnectionStatus()}
                </div>
            </div>
            
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>{t('chat.noMessages')}</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div 
                            key={msg.clientMessageId || msg.id} 
                            className={`message ${msg.senderId === currentUser.id ? 'own-message' : 'other-message'}`}
                        >
                            {msg.senderId !== currentUser.id && (
                                <div className="message-sender">{msg.senderName}</div>
                            )}
                            <div className="message-content">{msg.content}</div>
                            <div className="message-meta">
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.senderId === currentUser.id && (
                                    <span className="message-status">
                                        {renderMessageStatus(msg.status)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
                
                {typingUsers.length > 0 && (
                    <div className="typing-indicator">
                        {typingUsers.length === 1 ? (
                            <span>{typingUsers[0].username} {t('chat.isTyping')}</span>
                        ) : (
                            <span>{typingUsers.length} {t('chat.areTyping')}</span>
                        )}
                    </div>
                )}
            </div>
            
            <div className="chat-input">
                <textarea
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder={t('chat.inputPlaceholder')}
                    disabled={connectionStatus !== 'connected'}
                />
                <button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || connectionStatus !== 'connected'}
                >
                    {t('chat.send')}
                </button>
            </div>
        </div>
    );
};

export default EnhancedChat;