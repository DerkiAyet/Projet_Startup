package com.example.ms_gateway.filters;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.util.Date;
import java.util.List;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${jwt.access-secret}")
    private String accessSecret;

    @Value("${jwt.refresh-secret}")
    private String refreshSecret;

    private final List<String> PUBLIC_PATHS = List.of("/auth/");

    @PostConstruct
    public void debug() {
        System.out.println("=================================");
        System.out.println("ACCESS SECRET  : [" + accessSecret + "]");
        System.out.println("REFRESH SECRET : [" + refreshSecret + "]");
        System.out.println("=================================");
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (exchange.getRequest().getMethod().name().equals("OPTIONS")) {
            return chain.filter(exchange);
        }

        if (PUBLIC_PATHS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        // ── Extract tokens (cookie for web, header for mobile) ──
        HttpCookie accessCookie  = exchange.getRequest().getCookies().getFirst("accessToken");
        HttpCookie refreshCookie = exchange.getRequest().getCookies().getFirst("refreshToken");

        String authHeader        = exchange.getRequest().getHeaders().getFirst("Authorization");
        String refreshHeader     = exchange.getRequest().getHeaders().getFirst("X-Refresh-Token");

        String accessTokenValue  = null;
        String refreshTokenValue = null;
        boolean isMobile         = false;

        // Determine source — cookie (web) or header (mobile)
        if (accessCookie != null) {
            accessTokenValue  = accessCookie.getValue();
            refreshTokenValue = refreshCookie != null ? refreshCookie.getValue() : null;
            isMobile          = false;
        } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
            accessTokenValue  = authHeader.substring(7);
            refreshTokenValue = refreshHeader;
            isMobile          = true;
        }

        System.out.println("CLIENT TYPE   : " + (isMobile ? "MOBILE" : "WEB"));
        System.out.println("ACCESS TOKEN  : " + (accessTokenValue  != null ? "PRESENT" : "NULL"));
        System.out.println("REFRESH TOKEN : " + (refreshTokenValue != null ? "PRESENT" : "NULL"));

        // ── Case 1 : accessToken present and valid ──
        if (accessTokenValue != null) {
            try {
                Claims claims = parseToken(accessTokenValue, accessSecret);
                System.out.println("ACCESS TOKEN VALID — userId: " + claims.get("userId"));
                return chain.filter(injectHeaders(exchange, claims));
            } catch (ExpiredJwtException e) {
                System.out.println("ACCESS TOKEN EXPIRED → trying refresh");
            } catch (Exception e) {
                System.out.println("ACCESS TOKEN ERROR: " + e.getMessage());
                return unauthorized(exchange, "Invalid access token");
            }
        }

        // ── Case 2 : renew with refreshToken ──
        if (refreshTokenValue != null) {
            try {
                Claims claims = parseToken(refreshTokenValue, refreshSecret);
                System.out.println("REFRESH TOKEN VALID — userId: " + claims.get("userId"));

                String newAccessToken = Jwts.builder()
                        .setSubject(claims.getSubject())
                        .claim("userId",   claims.get("userId"))
                        .claim("userName", claims.get("userName"))
                        .claim("userRole", claims.get("userRole"))
                        .setExpiration(new Date(System.currentTimeMillis() + 900_000))
                        .signWith(getKey(accessSecret), SignatureAlgorithm.HS256)
                        .compact();

                if (isMobile) {
                    // ── Mobile : return new access token in response header ──
                    exchange.getResponse().getHeaders().add("X-New-Access-Token", newAccessToken);
                } else {
                    // ── Web : set new access token as cookie ──
                    exchange.getResponse().addCookie(
                            ResponseCookie.from("accessToken", newAccessToken)
                                    .maxAge(Duration.ofMinutes(15))
                                    .httpOnly(true)
                                    .path("/")
                                    .build()
                    );
                }

                return chain.filter(injectHeaders(exchange, claims));

            } catch (ExpiredJwtException e) {
                System.out.println("REFRESH TOKEN EXPIRED");
                return unauthorized(exchange, "Session expired, please log in again");
            } catch (SignatureException e) {
                System.out.println("REFRESH TOKEN BAD SIGNATURE");
                return unauthorized(exchange, "Invalid signature");
            } catch (Exception e) {
                System.out.println("REFRESH TOKEN ERROR: " + e.getClass().getName() + " — " + e.getMessage());
                return unauthorized(exchange, "Invalid refresh token");
            }
        }

        return unauthorized(exchange, "No token provided");
    }

    private Key getKey(String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return new SecretKeySpec(keyBytes, SignatureAlgorithm.HS256.getJcaName());
    }

    private Claims parseToken(String token, String secret) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey(secret))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private ServerWebExchange injectHeaders(ServerWebExchange exchange, Claims claims) {
        return exchange.mutate().request(r -> r
                .header("X-User-Id",   String.valueOf(claims.get("userId")))
                .header("X-User-Name", String.valueOf(claims.get("userName")))
                .header("X-User-Role", String.valueOf(claims.get("userRole")))
        ).build();
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String msg) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add("Content-Type", "application/json");
        byte[] bytes = ("{\"errorToken\": \"" + msg + "\"}").getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() { return -1; }
}