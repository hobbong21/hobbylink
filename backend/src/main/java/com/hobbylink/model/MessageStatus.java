package com.hobbylink.model;

/**
 * 메시지 상태를 나타내는 열거형
 */
public enum MessageStatus {
    SENDING,    // 전송 중
    DELIVERED,  // 전송됨
    READ,       // 읽음
    FAILED      // 전송 실패
}