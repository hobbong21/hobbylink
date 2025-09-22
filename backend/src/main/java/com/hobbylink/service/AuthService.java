package com.hobbylink.service;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.text.ParseException;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final CognitoIdentityProviderClient cognitoClient;

    @Value("${aws.cognito.userPoolId}")
    private String userPoolId;

    @Value("${aws.cognito.clientId}")
    private String clientId;

    public AuthService(CognitoIdentityProviderClient cognitoClient) {
        this.cognitoClient = cognitoClient;
    }

    public Map<String, Object> signUp(String username, String password, String email) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            AttributeType emailAttr = AttributeType.builder()
                    .name("email")
                    .value(email)
                    .build();

            SignUpRequest signUpRequest = SignUpRequest.builder()
                    .clientId(clientId)
                    .username(username)
                    .password(password)
                    .userAttributes(emailAttr)
                    .build();

            SignUpResponse signUpResponse = cognitoClient.signUp(signUpRequest);
            
            response.put("success", true);
            response.put("userSub", signUpResponse.userSub());
            response.put("message", "User registered successfully");
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        
        return response;
    }

    public Map<String, Object> signIn(String username, String password) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, String> authParams = new HashMap<>();
            authParams.put("USERNAME", username);
            authParams.put("PASSWORD", password);

            InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
                    .clientId(clientId)
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                    .authParameters(authParams)
                    .build();

            InitiateAuthResponse authResponse = cognitoClient.initiateAuth(authRequest);
            
            if (authResponse.authenticationResult() != null) {
                response.put("success", true);
                response.put("accessToken", authResponse.authenticationResult().accessToken());
                response.put("idToken", authResponse.authenticationResult().idToken());
                response.put("refreshToken", authResponse.authenticationResult().refreshToken());
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        
        return response;
    }

    public Map<String, Object> validateToken(String token) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();
            
            response.put("valid", true);
            response.put("username", claimsSet.getClaim("cognito:username"));
            response.put("email", claimsSet.getClaim("email"));
            
        } catch (ParseException e) {
            response.put("valid", false);
            response.put("message", "Invalid token");
        }
        
        return response;
    }
}