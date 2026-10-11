# System Architecture & Cryptographic Security Specification

> **Project Title**: Secure Role-Based Authentication System with Two-Factor Authentication, Cryptographic Protection, and Automated Database Backups  
> **Author**: Information Technology Student  
> **Target Audience**: Cybersecurity Lecturer & System Evaluator

---

## 1. System Overview & The BFF Pattern

The system employs the **Backend-For-Frontend (BFF)** architectural pattern. Both the React Web application and the Expo Mobile application communicate strictly through a single centralized Node.js REST API.

```text
[ React Web App (Vite) ]               [ Expo Mobile App (React Native) ]
(In-Memory Access Token)               (Expo SecureStore Keychain/Keystore)
(HttpOnly Cookie Refresh)              (Bearer Access + Refresh Token)
           │                                          │
           └──────────────────┬───────────────────────┘
                              │ HTTPS / REST API
                              ▼
        ┌───────────────────────────────────────────┐
        │        Node.js + Express + TypeScript     │
        │  ┌─────────────────────────────────────┐  │
        │  │ Security Perimeter:                 │  │
        │  │ Helmet, CORS, Rate Limit, Zod       │  │
        │  └─────────────────────────────────────┘  │
        │  ┌─────────────────────────────────────┐  │
        │  │ Cryptographic & Auth Engine:        │  │
        │  │ Argon2id (Salt + External Pepper)   │  │
        │  │ AES-256-GCM (TOTP Secret Encryption)│  │
        │  │ TOTP Engine (RFC 6238 Base32)       │  │
        │  │ RBAC Middleware (GUEST/USER/ADMIN)  │  │
        │  │ Security Audit Logger               │  │
        │  │ Automated Backup & Restore Engine   │  │
        │  └─────────────────────────────────────┘  │
        └─────────────────────┬─────────────────────┘
                              │ Firebase Admin SDK
                              ▼
        ┌───────────────────────────────────────────┐
        │          Google Cloud Firestore           │
        │  /users       /usernames      /twoFactor  │
        │  /sessions    /auditLogs      /backupLogs │
        └───────────────────────────────────────────┘
```

---

## 2. Password Security: Argon2id + Salt + Pepper

### The Vulnerability of Plaintext & Weak Hashes
Storing passwords in plaintext is a catastrophic security failure. Using fast hashes (such as MD5 or SHA-256) is also obsolete because modern GPUs can compute over 10 billion SHA-256 hashes per second, making dictionary attacks trivial.

### Why Argon2id?
Argon2 won the international **Password Hashing Competition (PHC)**:
* **Argon2d**: Maximizes resistance against GPU/ASIC cracking.
* **Argon2i**: Uses data-independent memory access to prevent side-channel timing attacks.
* **Argon2id**: A hybrid providing the best defense against both GPU farms and cache-timing side-channels.
* **Memory-Hard Parameter**: In our system, Argon2id requires **64 MB of RAM** per verification, making large-scale offline parallel cracking computationally infeasible.

### Unique Per-User Salt
* Generated using `crypto.randomBytes(16)` (128 bits of cryptographic entropy).
* Precludes **Rainbow Tables** (precomputed hash lookup tables) and ensures that two users with identical passwords will never produce identical hashes.

### Server-Side Pepper
* A 256-bit secret stored in the server's `.env` configuration, **strictly outside the Firestore database**.
* Before hashing, the password is combined with the pepper using HMAC-SHA256:
  $$\text{Input} = \text{HMAC-SHA256}(\text{Password}, \text{Pepper})$$
* **Defense in Depth**: Even if an attacker completely exfiltrates the Firestore database (via database backup leak or insider threat), they **cannot crack any user passwords** because they do not have the server-side pepper.

---

## 3. Cryptographic Technique: AES-256-GCM

### Symmetric Encryption
The lecturer required a distinct cryptographic technique beyond password hashing. We implemented **AES-256-GCM** to protect TOTP secrets at rest.

### Why AES-256-GCM?
1. **AES-256**: National Institute of Standards and Technology (NIST) FIPS 197 standard using a 256-bit key. Immune to brute-force attacks ($2^{256}$ keyspace).
2. **GCM (Galois/Counter Mode) - Authenticated Encryption (AEAD)**:
   - Older modes (like CBC) only provide *confidentiality*, requiring a separate HMAC for integrity (Encrypt-then-MAC). Without MAC, CBC is vulnerable to padding oracle attacks.
   - GCM simultaneously calculates both ciphertext and a **16-byte Authentication Tag**.
   - If an attacker tampers with even a single bit in the Firestore database, decryption fails immediately with an authentication error.
3. **Initialization Vector (IV / Nonce)**:
   - A unique 12-byte (96-bit) cryptographically random IV is generated for *every single encryption operation*.
   - Never reused with the same key.

---

## 4. Multi-Factor Authentication: RFC 6238 TOTP

1. **Secret Generation**: A 160-bit Base32 secret is generated and stored *only after AES-256-GCM encryption*.
2. **Time-Based Code**:
   $$T = \left\lfloor \frac{\text{Current Unix Timestamp}}{30} \right\rfloor$$
   $$\text{Code} = \text{Truncate}(\text{HMAC-SHA1}(\text{Secret}, T)) \pmod{10^6}$$
3. **Clock Skew Tolerance**: Accommodates $\pm 30$ seconds of clock drift.
4. **Emergency Recovery Codes**: 8 one-time alphanumeric codes hashed with SHA-256 before storage in Firestore. Consumed and deleted immediately upon first use.

---

## 5. Token Architecture: Web vs. Mobile

| Security Vector | Web Browser Context | Mobile Context (Expo) |
| :--- | :--- | :--- |
| **Primary Threat** | Cross-Site Scripting (XSS) can read `localStorage`. | Physical extraction or unauthorized app sandbox inspection. |
| **Mitigation** | Refresh tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies. | Refresh tokens stored in **Apple Keychain** (iOS) and **Android KeyStore** (Android). |
| **Access Token** | Short-lived (15 min) in React memory. | Short-lived (15 min) in application state. |
| **Rotation** | Every refresh rotates the refresh token and invalidates the previous token. | Identical rotation on mobile. |

---

## 6. Disaster Recovery & Automated Database Backups

1. **Automated Snapshots**: Full export of all Firestore collections (`users`, `usernames`, `twoFactor`, `sessions`, `auditLogs`).
2. **Integrity Checksums**: Every snapshot calculates an authoritative **SHA-256 hash** of the exported payload.
3. **Restoration Verification**: An automated restoration engine tests the snapshot and verifies the restored document count against the archive manifest.
4. **Audit Trail**: Every backup and restoration triggers a recorded event in `auditLogs` and `backupLogs`.
