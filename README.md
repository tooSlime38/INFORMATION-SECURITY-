# Secure Role-Based Authentication System

> **Academic Project Title**: Secure Role-Based Authentication System with Two-Factor Authentication, Cryptographic Protection, and Automated Database Backups  
> **Course**: Information Technology / Cybersecurity

---

## 1. Project Overview

This system is an enterprise-grade academic demonstration of modern secure authentication and disaster recovery. It implements a centralized Node.js/TypeScript backend API serving both a React web application and an Expo mobile application, backed by Google Cloud Firestore.

### Core Security & Technical Capabilities
1. **User Identification**: Custom username-only registration and authentication (no email or phone numbers required).
2. **Password Security**: Argon2id password hashing with cryptographically random per-user salts and a server-side pepper stored strictly outside the database.
3. **Cryptographic Protection**: AES-256-GCM authenticated encryption for sensitive TOTP secrets.
4. **Two-Factor Authentication (2FA)**: RFC 6238 TOTP-based authentication compatible with Google Authenticator and Microsoft Authenticator, paired with hashed emergency recovery codes.
5. **Role-Based Access Control (RBAC)**: Fine-grained backend-enforced authorization with `GUEST`, `USER`, and `ADMIN` roles.
6. **Token Architecture**: Short-lived JWT access tokens with secure refresh token rotation (HttpOnly cookies for web, hardware Keychain/KeyStore via Expo SecureStore for mobile).
7. **Security Audit Logging**: Structured audit trail tracking authentication, authorization, and administrative events without logging sensitive credentials.
8. **Automated Database Backups**: Scheduled and automated Firestore snapshot exports with complete restoration and recovery verification.

---

## 2. Architecture Layout

```text
INFORMATION SECURITY/
├── backend/       # Node.js + TypeScript + Express REST API
├── frontend/      # React + Vite + Tailwind CSS Web Client
├── mobile/        # React Native + Expo Mobile Client
├── docs/          # Architecture documentation & presentation notes
└── .gitignore     # Git protection preventing secret leakage
```

---

## 3. Technology Stack

* **Backend**: Node.js, TypeScript, Express.js, Zod, Firebase Admin SDK
* **Database**: Google Cloud Firestore
* **Security**: Argon2id, Node.js `crypto` (AES-256-GCM), Speakeasy (TOTP), Helmet, CORS, Express-Rate-Limit
* **Web Frontend**: React, TypeScript, Vite, Tailwind CSS
* **Mobile Client**: React Native, Expo, Expo SecureStore
* **Testing**: Vitest, Supertest
