# Lecturer Defense Questions & Answers Guide

Use this guide to prepare for your academic presentation and defense. Each answer is formulated using clear, confident engineering language.

---

### Q1: What is authentication?
> **Answer**: Authentication answers the question: *"Who are you?"* It is the process of verifying a user's claimed identity using credentials—in our system, a unique **Username + Password**, supplemented by a **Time-Based One-Time Password (TOTP)** when 2FA is active.

---

### Q2: What is authorization?
> **Answer**: Authorization answers the question: *"What are you permitted to do?"* It evaluates whether an authenticated user has permission to perform an action. Our system enforces **Role-Based Access Control (RBAC)** on the Node.js backend with three distinct tiers: `GUEST`, `USER`, and `ADMIN`.

---

### Q3: What is a salt?
> **Answer**: A salt is a cryptographically random sequence of bytes generated individually for each user during password hashing. It ensures that two users with identical passwords will produce completely different hashes, neutralizing **Rainbow Table attacks** and batch dictionary attacks.

---

### Q4: What is a pepper?
> **Answer**: A pepper is an additional secret key combined with passwords before hashing. Unlike a salt (which is stored in the database alongside the hash), a pepper is **kept strictly outside the database** in the backend's environment secrets.

---

### Q5: Where is your pepper stored?
> **Answer**: It is stored in server-side environment variables (`process.env.ARGON2_PEPPER`) on the Node.js host. It is **never** written to Firestore, committed to Git, or sent to client applications.

---

### Q6: Why did you use Argon2id?
> **Answer**: Argon2 won the international Password Hashing Competition (PHC). Argon2id is a hybrid combining **Argon2d** (resistant to GPU cracking farms) and **Argon2i** (resistant to side-channel cache-timing attacks). It is a **memory-hard** algorithm requiring 64 MB of RAM per hash, making parallel hardware attacks computationally and financially impractical.

---

### Q7: Why are passwords hashed instead of encrypted?
> **Answer**: Encryption is a **two-way** function: if someone obtains the decryption key, they can recover all plaintext passwords. Hashing is a **one-way** mathematical trapdoor function: you can verify a candidate password by hashing it and comparing, but you cannot mathematically reverse a hash back to the original plaintext.

---

### Q8: What cryptographic technique did you implement?
> **Answer**: We implemented **AES-256-GCM (Authenticated Encryption with Associated Data)** to encrypt sensitive Two-Factor Authentication (TOTP) Base32 secrets before saving them to the database.

---

### Q9: Why AES-256-GCM?
> **Answer**: AES-256 is the gold-standard symmetric block cipher with a 256-bit key ($2^{256}$ keyspace). The **Galois/Counter Mode (GCM)** provides **Authenticated Encryption (AEAD)**: it produces both ciphertext and a 16-byte authentication tag. If an attacker tampers with even a single bit of the encrypted secret in Firestore, GCM integrity verification fails instantly and prevents decryption.

---

### Q10: What is TOTP?
> **Answer**: Time-Based One-Time Password (RFC 6238). It generates dynamic 6-digit codes based on a shared secret and the current 30-second Unix time counter. Compatible with Google Authenticator and Microsoft Authenticator.

---

### Q11: How does 2FA work in your system?
> **Answer**:
> 1. User submits Username + Password.
> 2. Backend verifies password hash.
> 3. If 2FA is active, the backend **does not issue access tokens**. It issues a restricted, short-lived `2FA_PENDING` temporary token.
> 4. The user enters their 6-digit authenticator code (or emergency recovery code).
> 5. The backend decrypts the user's TOTP secret using AES-256-GCM and verifies the code.
> 6. Only upon verification are full access and refresh tokens issued.

---

### Q12: How does the mobile application communicate with the backend?
> **Answer**: The Expo mobile application makes HTTPS REST requests to the same Node.js API that serves the web application. When logging in, it saves the long-lived refresh token in **Expo SecureStore** (hardware-backed Apple Keychain / Android KeyStore) and sends the short-lived access token in the `Authorization: Bearer` header.

---

### Q13: Why did you use Node.js?
> **Answer**: Node.js allows us to use **TypeScript across the entire stack** (Backend, React Web, and Expo Mobile) with shared data models. Its native `crypto` module provides production-grade AES-256-GCM primitives, and its native C-bindings support high-performance Argon2id hashing.

---

### Q14: Why did you use Expo?
> **Answer**: Expo allows building cross-platform native iOS and Android apps with React Native using a single TypeScript codebase, providing access to device security hardware through `expo-secure-store`.

---

### Q15: Why did you choose Firebase / Firestore?
> **Answer**: Firestore provides a cloud-hosted, highly available NoSQL document database with ACID atomic transaction support. We interface with it exclusively via the **Firebase Admin SDK** on our Node.js backend.

---

### Q16: What happens if the database is deleted?
> **Answer**: Our automated disaster recovery engine restores the database from a backup snapshot. Snapshots contain all collection documents with an authoritative **SHA-256 checksum**. Running `npm run restore` restores the data and logs the recovery event in the audit trail.

---

### Q17: How does your automatic backup work?
> **Answer**: The backup service exports all Firestore collections (`users`, `usernames`, `twoFactor`, `sessions`, `auditLogs`), serializes them with timestamps and document counts, calculates a SHA-256 integrity checksum, stores the archive, and logs a `BACKUP_CREATED_SUCCESS` event in `backupLogs`.

---

### Q18: What happens if someone steals the database?
> **Answer**:
> 1. **Passwords**: Cannot be cracked using rainbow tables or offline dictionary attacks because the attacker lacks the **server-side pepper** stored outside the database.
> 2. **TOTP Secrets**: Cannot be used because they are encrypted with **AES-256-GCM** and the encryption key resides strictly in server environment secrets.
> 3. **Recovery Codes**: Stored as one-way **SHA-256 hashes**, not plaintext.
> 4. **Refresh Tokens**: Stored as SHA-256 hashes.

---

### Q19: How do you stop a normal user from accessing admin functionality?
> **Answer**: Through **server-side RBAC middleware** (`requireRole(['ADMIN'])`). Even if a malicious user alters the client-side React or Expo code or directly calls `/api/admin/users` with `curl` or Postman, the Node.js backend inspects the cryptographically signed JWT access token, detects that their role is `USER`, rejects the request with HTTP **403 Forbidden**, and records an unauthorized attempt in the security audit log.
