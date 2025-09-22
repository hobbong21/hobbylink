package com.hobbylink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 메시지 포맷팅 서비스
 */
@Service
public class MessageFormattingService {
    
    private static final Logger logger = LoggerFactory.getLogger(MessageFormattingService.class);
    
    // 포맷팅 패턴들
    private static final Pattern BOLD_PATTERN = Pattern.compile("\\*\\*(.*?)\\*\\*");
    private static final Pattern ITALIC_PATTERN = Pattern.compile("\\*(.*?)\\*");
    private static final Pattern CODE_PATTERN = Pattern.compile("`(.*?)`");
    private static final Pattern URL_PATTERN = Pattern.compile(
        "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+[\\w\\-_~/#@$*+=]"
    );
    
    // HTML 태그 패턴 (보안을 위한 제거용)
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]+>");
    
    // 최대 메시지 길이
    private static final int MAX_MESSAGE_LENGTH = 2000;
    
    /**
     * 메시지 내용을 포맷팅하여 HTML로 변환
     * @param content 원본 메시지 내용
     * @return 포맷팅된 HTML 내용
     */
    public String formatMessage(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "";
        }
        
        try {
            // 길이 제한 확인
            if (content.length() > MAX_MESSAGE_LENGTH) {
                content = content.substring(0, MAX_MESSAGE_LENGTH) + "...";
            }
            
            // HTML 이스케이프 (XSS 방지)
            String formatted = HtmlUtils.htmlEscape(content);
            
            // 기본 포맷팅 적용
            formatted = applyBasicFormatting(formatted);
            
            // URL 링크 변환
            formatted = convertUrlsToLinks(formatted);
            
            return formatted;
            
        } catch (Exception e) {
            logger.error("Error formatting message: {}", e.getMessage());
            // 오류 발생 시 원본 내용을 HTML 이스케이프만 적용하여 반환
            return HtmlUtils.htmlEscape(content);
        }
    }
    
    /**
     * 메시지 내용 검증 및 정화
     * @param content 원본 메시지 내용
     * @return 정화된 메시지 내용
     */
    public String sanitizeMessage(String content) {
        if (content == null) {
            return "";
        }
        
        try {
            // HTML 태그 제거
            String sanitized = HTML_TAG_PATTERN.matcher(content).replaceAll("");
            
            // 길이 제한
            if (sanitized.length() > MAX_MESSAGE_LENGTH) {
                sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
            }
            
            // 연속된 공백 정리
            sanitized = sanitized.replaceAll("\\s+", " ").trim();
            
            return sanitized;
            
        } catch (Exception e) {
            logger.error("Error sanitizing message: {}", e.getMessage());
            return content.trim();
        }
    }
    
    /**
     * 기본 텍스트 포맷팅 적용
     */
    private String applyBasicFormatting(String content) {
        // 볼드 텍스트 (**text** -> <strong>text</strong>)
        content = BOLD_PATTERN.matcher(content).replaceAll("<strong>$1</strong>");
        
        // 이탤릭 텍스트 (*text* -> <em>text</em>)
        // 볼드 처리 후에 남은 단일 * 처리
        content = ITALIC_PATTERN.matcher(content).replaceAll("<em>$1</em>");
        
        // 인라인 코드 (`code` -> <code>code</code>)
        content = CODE_PATTERN.matcher(content).replaceAll("<code>$1</code>");
        
        // 줄바꿈 처리 (\n -> <br>)
        content = content.replaceAll("\\n", "<br>");
        
        return content;
    }
    
    /**
     * URL을 클릭 가능한 링크로 변환
     */
    private String convertUrlsToLinks(String content) {
        Matcher matcher = URL_PATTERN.matcher(content);
        StringBuffer result = new StringBuffer();
        
        while (matcher.find()) {
            String url = matcher.group();
            String displayUrl = url;
            
            // URL이 너무 길면 축약
            if (displayUrl.length() > 50) {
                displayUrl = displayUrl.substring(0, 47) + "...";
            }
            
            String replacement = String.format(
                "<a href=\"%s\" target=\"_blank\" rel=\"noopener noreferrer\">%s</a>",
                url, displayUrl
            );
            
            matcher.appendReplacement(result, replacement);
        }
        
        matcher.appendTail(result);
        return result.toString();
    }
    
    /**
     * 포맷팅된 메시지에서 플레인 텍스트 추출
     * @param formattedContent 포맷팅된 HTML 내용
     * @return 플레인 텍스트
     */
    public String extractPlainText(String formattedContent) {
        if (formattedContent == null || formattedContent.trim().isEmpty()) {
            return "";
        }
        
        try {
            // HTML 태그 제거
            String plainText = HTML_TAG_PATTERN.matcher(formattedContent).replaceAll("");
            
            // HTML 엔티티 디코딩
            plainText = HtmlUtils.htmlUnescape(plainText);
            
            // <br> 태그를 줄바꿈으로 변환
            plainText = plainText.replaceAll("<br>", "\n");
            
            // 연속된 공백 정리
            plainText = plainText.replaceAll("\\s+", " ").trim();
            
            return plainText;
            
        } catch (Exception e) {
            logger.error("Error extracting plain text: {}", e.getMessage());
            return formattedContent;
        }
    }
    
    /**
     * 메시지 미리보기 생성 (알림용)
     * @param content 메시지 내용
     * @param maxLength 최대 길이
     * @return 미리보기 텍스트
     */
    public String generatePreview(String content, int maxLength) {
        if (content == null || content.trim().isEmpty()) {
            return "";
        }
        
        try {
            // 플레인 텍스트 추출
            String plainText = extractPlainText(content);
            
            // 길이 제한
            if (plainText.length() > maxLength) {
                plainText = plainText.substring(0, maxLength - 3) + "...";
            }
            
            // 줄바꿈을 공백으로 변환
            plainText = plainText.replaceAll("\\n", " ");
            
            return plainText;
            
        } catch (Exception e) {
            logger.error("Error generating preview: {}", e.getMessage());
            return content.length() > maxLength ? content.substring(0, maxLength - 3) + "..." : content;
        }
    }
    
    /**
     * 메시지 포맷팅 유효성 검사
     * @param content 메시지 내용
     * @return 유효성 검사 결과
     */
    public ValidationResult validateMessage(String content) {
        if (content == null) {
            return new ValidationResult(false, "메시지 내용이 없습니다.");
        }
        
        if (content.trim().isEmpty()) {
            return new ValidationResult(false, "빈 메시지는 전송할 수 없습니다.");
        }
        
        if (content.length() > MAX_MESSAGE_LENGTH) {
            return new ValidationResult(false, 
                String.format("메시지가 너무 깁니다. (최대 %d자)", MAX_MESSAGE_LENGTH));
        }
        
        // 악성 패턴 검사
        if (containsMaliciousContent(content)) {
            return new ValidationResult(false, "허용되지 않는 내용이 포함되어 있습니다.");
        }
        
        return new ValidationResult(true, "유효한 메시지입니다.");
    }
    
    /**
     * 악성 콘텐츠 검사
     */
    private boolean containsMaliciousContent(String content) {
        // 기본적인 악성 패턴 검사
        String lowerContent = content.toLowerCase();
        
        // 스크립트 태그 검사
        if (lowerContent.contains("<script") || lowerContent.contains("javascript:")) {
            return true;
        }
        
        // 기타 위험한 태그들
        String[] dangerousTags = {"<iframe", "<object", "<embed", "<form", "<input"};
        for (String tag : dangerousTags) {
            if (lowerContent.contains(tag)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 유효성 검사 결과 클래스
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String message;
        
        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }
        
        public boolean isValid() {
            return valid;
        }
        
        public String getMessage() {
            return message;
        }
    }
    
    /**
     * 포맷팅된 메시지 응답 클래스
     */
    public static class FormattedMessageResponse {
        private String originalContent;
        private String formattedContent;
        private String plainTextContent;
        private String preview;
        private boolean hasFormatting;
        
        public FormattedMessageResponse(String originalContent, String formattedContent, 
                                      String plainTextContent, String preview, boolean hasFormatting) {
            this.originalContent = originalContent;
            this.formattedContent = formattedContent;
            this.plainTextContent = plainTextContent;
            this.preview = preview;
            this.hasFormatting = hasFormatting;
        }
        
        // Getters and Setters
        public String getOriginalContent() { return originalContent; }
        public void setOriginalContent(String originalContent) { this.originalContent = originalContent; }
        
        public String getFormattedContent() { return formattedContent; }
        public void setFormattedContent(String formattedContent) { this.formattedContent = formattedContent; }
        
        public String getPlainTextContent() { return plainTextContent; }
        public void setPlainTextContent(String plainTextContent) { this.plainTextContent = plainTextContent; }
        
        public String getPreview() { return preview; }
        public void setPreview(String preview) { this.preview = preview; }
        
        public boolean isHasFormatting() { return hasFormatting; }
        public void setHasFormatting(boolean hasFormatting) { this.hasFormatting = hasFormatting; }
    }
}