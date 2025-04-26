# API Test Cases for Media Player

This file contains test cases for the Media Player API, formatted for use with Thunder Client in VS Code. Each test case includes a cURL command and JSON body (if applicable) that can be copied and pasted into Thunder Client to test the `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/users` endpoints.

---

## Register Users

Test the `POST /api/auth/register` endpoint to create new users.

### Test Case 1: Register user with valid data (demo@gmail.com)
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "demo@gmail.com",
  "password": "123",
  "name": "Demo",
  "dateOfBirth": "2025-01-01"
}'
```
**Expected Response**:
```json
{
  "message": "User registered successfully"
}
```

### Test Case 2: Register user with valid data (nam@gmail.com)
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "nam@gmail.com",
  "password": "123",
  "name": "Nam",
  "dateOfBirth": "2003-07-21"
}'
```
**Expected Response** (if dateOfBirth is invalid, depends on MySQL validation):
```json
{
  "message": "User registered successfully"
}
```

### Test Case 3: Register user with valid data (test@gmail.com)
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "test@gmail.com",
  "password": "123",
  "name": "Test",
  "dateOfBirth": "2001-10-12"
}'
```
**Expected Response**:
```json
{
  "message": "User registered successfully"
}
```

### Test Case 4: Register user with missing fields (demo@gmail.com)
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "demo@gmail.com",
  "password": "123"
}'
```
**Expected Response**:
```json
{
  "message": "Email, password, name, and date of birth are required"
}
```

### Test Case 5: Register user with missing fields (nam@gmail.com)
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "nam@gmail.com",
  "password": "123"
}'
```
**Expected Response**:
```json
{
  "message": "Email, password, name, and date of birth are required"
}
```

### Test Case 6: Register user with missing fields (test@gmail.com)
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "test@gmail.com",
  "password": "123"
}'
```
**Expected Response**:
```json
{
  "message": "Email, password, name, and date of birth are required"
}
```

---

## Login Users

Test the `POST /api/auth/login` endpoint to authenticate users and obtain JWT tokens.

### Test Case 7: Login with demo@gmail.com
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "demo@gmail.com",
  "password": "123"
}'
```
**Expected Response** (if user exists and password is correct):
```json
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>",
  "user": {
    "email": "demo@gmail.com",
    "name": "Demo",
    "dateOfBirth": "2025-01-01"
  }
}
```

### Test Case 8: Login with nam@gmail.com
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "nam@gmail.com",
  "password": "123"
}'
```
**Expected Response** (if user exists and password is correct):
```json
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>",
  "user": {
    "email": "nam@gmail.com",
    "name": "Demo",
    "dateOfBirth": "2003-01-01"
  }
}
```

### Test Case 9: Login with test@gmail.com
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@gmail.com",
  "password": "123"
}'
```
**Expected Response** (if user exists and password is correct):
```json
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>",
  "user": {
    "email": "test@gmail.com",
    "name": "Demo",
    "dateOfBirth": "2003-01-01"
  }
}
```

---

## Get All Users

Test the `GET /api/auth/users` endpoint to retrieve the list of users. This endpoint requires a valid JWT token.

### Test Case 10: Get users with valid token
```bash
curl -X GET http://localhost:3000/api/auth/users \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkZW1vQGdtYWlsLmNvbSIsImlhdCI6MTc0NTUxODcwOSwiZXhwIjoxNzQ4MTEwNzA5fQ.cJJ7jaOD845801DeVVDT1mkF1b59OwXwlX_0HMtQtbk"
```
**Expected Response** (if token is valid):
```json
[
  {
    "id": 1,
    "email": "demo@gmail.com",
    "name": "Demo",
    "date_of_birth": "2025-01-01",
    "created_at": "2025-04-25T12:00:00.000Z"
  },
  {
    "id": 2,
    "email": "test@gmail.com",
    "name": "Demo",
    "date_of_birth": "2003-01-01",
    "created_at": "2025-04-25T12:01:00.000Z"
  }
]
```

### Test Case 11: Get users without token
```bash
curl -X GET http://localhost:3000/api/auth/users
```
**Expected Response**:
```json
{
  "message": "No token provided"
}
```

### Test Case 12: Get users with invalid token
```bash
curl -X GET http://localhost:3000/api/auth/users \
-H "Authorization: Bearer invalid_token"
```
**Expected Response**:
```json
{
  "message": "Invalid or expired token"
}
```

---

## Notes

1. **Setup**:
   - Ensure the server is running (`node App.js`).
   - Update `.env` with correct `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `JWT_SECRET`.
   - Run `schema.sql` to create the `media_player` database and `users` table.

2. **Thunder Client Usage**:
   - Open Thunder Client in VS Code.
   - Create a new request or collection.
   - Copy and paste each cURL command into the cURL Import field in Thunder Client.
   - Thunder Client will automatically parse the method, URL, headers, and body.

3. **Test Flow**:
   - Run Test Cases 1-6 to register users (note that Test Cases 4-6 will fail due to missing fields, and Test Case 2 may fail due to invalid `dateOfBirth`).
   - Run Test Cases 7-9 to login and obtain JWT tokens.
   - Use a fresh token from Test Cases 7-9 to replace the token in Test Case 10, as the provided token may be expired.
   - Run Test Cases 10-12 to test the `GET /api/auth/users` endpoint.

4. **Validation**:
   - Test Case 2 has an invalid `dateOfBirth` (`20003-01-01`). Consider adding validation in `AuthController.js` to handle this case.
   - Duplicate emails (e.g., `demo@gmail.com` in Test Cases 1 and 4) will cause an error (`Email already exists`).

5. **Token Expiry**:
   - The token in Test Case 10 has an expiration (`exp`) of `1748110709` (around October 2025). If expired, obtain a new token by running Test Case 7, 8, or 9.