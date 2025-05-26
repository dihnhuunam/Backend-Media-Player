# Backend Media Player

Backend Media Player is an API server built with **Node.js** and **Express**, designed for managing and streaming music online. The project supports features such as adding songs, streaming music with HTTP Range support, searching songs by title/artist/genre, managing playlists, and user authentication (admin and regular users).

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Project Structure](#project-structure)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication)
   - [Songs](#songs)
   - [Playlists](#playlists)
6. [Usage](#usage)

## System Requirements

- **Node.js**: v16.x or higher
- **MySQL**: v8.0 or higher
- **npm**: v8.x or higher
- Operating System: Linux, macOS, or Windows

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/dihnhuunam/Backend-Media-Player.git
   cd Backend-Media-Player
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up MySQL**:

   - Install MySQL server and create a database:

     ```sql
     CREATE DATABASE IF NOT EXISTS media_player;
     USE media_player;

     -- Users table
     CREATE TABLE IF NOT EXISTS users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       email VARCHAR(255) NOT NULL UNIQUE,
       password VARCHAR(255) NOT NULL,
       name VARCHAR(100) NOT NULL,
       date_of_birth DATE NOT NULL,
       role ENUM('user', 'admin') DEFAULT 'user',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     -- Genres table
     CREATE TABLE IF NOT EXISTS genres (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(100) NOT NULL UNIQUE
     );

     -- Artists table
     CREATE TABLE IF NOT EXISTS artists (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(100) NOT NULL UNIQUE
     );

     -- Songs table (admin-uploaded songs)
     CREATE TABLE IF NOT EXISTS songs (
       id INT AUTO_INCREMENT PRIMARY KEY,
       title VARCHAR(255) NOT NULL,
       file_path VARCHAR(255) NOT NULL,
       uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     -- Song_genres table (many-to-many relationship between songs and genres)
     CREATE TABLE IF NOT EXISTS song_genres (
       song_id INT NOT NULL,
       genre_id INT NOT NULL,
       PRIMARY KEY (song_id, genre_id),
       FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
       FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
     );

     -- Song_artists table (many-to-many relationship between songs and artists)
     CREATE TABLE IF NOT EXISTS song_artists (
       song_id INT NOT NULL,
       artist_id INT NOT NULL,
       PRIMARY KEY (song_id, artist_id),
       FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
       FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
     );

     -- Playlists table (user-created playlists)
     CREATE TABLE IF NOT EXISTS playlists (
       id INT AUTO_INCREMENT PRIMARY KEY,
       user_id INT NOT NULL,
       name VARCHAR(100) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
     );

     -- Playlist_songs table (many-to-many relationship between playlists and songs)
     CREATE TABLE IF NOT EXISTS playlist_songs (
       playlist_id INT NOT NULL,
       song_id INT NOT NULL,
       PRIMARY KEY (playlist_id, song_id),
       FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
       FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
     );

     -- Indexes for faster lookup
     CREATE INDEX idx_email ON users(email);
     CREATE INDEX idx_user_id ON playlists(user_id);
     CREATE INDEX idx_title ON songs(title);
     CREATE INDEX idx_genre_name ON genres(name);
     CREATE INDEX idx_artist_name ON artists(name);
     ```

## Configuration

1. **Create a `.env` file**:
   Create a `.env` file in the root directory with the following content:

   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=media_player
   JWT_SECRET=your_jwt_secret
   ```

   - Replace `your_username`, `your_password`, and `your_jwt_secret` with your actual values.
   - `JWT_SECRET` should be a long, random string (e.g., `mysecretkey123456789`).

2. **Create the `uploads` directory**:
   The `uploads/` directory will be created automatically by `App.js`. If not, run:
   ```bash
   mkdir uploads
   chmod -R 755 uploads
   ```

## Project Structure

```
backend-media-player/
├── configs/                    # Directory for configuration files
│   └── Database.js             # MySQL connection configuration
├── controllers/                # Directory for API controllers
│   ├── AuthController.js       # Handles user registration/login/update
│   ├── PlaylistController.js   # Handles playlist-related APIs
│   └── SongController.js       # Handles song-related APIs
├── middleware/                 # Directory for middleware
│   ├── AdminMiddleware.js      # Checks for admin privileges
│   └── AuthMiddleware.js       # Verifies JWT tokens
├── models/                     # Directory for database models
│   ├── Playlist.js             # Model for the playlists table
│   ├── PlaylistSong.js         # Model for the playlist_songs table
│   ├── Song.js                 # Model for the songs table
│   └── User.js                 # Model for the users table
├── node_modules/               # Node.js libraries (auto-generated after npm install)
├── routes/                     # Directory for API route definitions
│   ├── AuthRoute.js            # Routes for authentication
│   ├── PlaylistRoute.js        # Routes for playlists
│   └── SongRoute.js            # Routes for songs
├── uploads/                    # Directory for storing music files
├── App.js                      # Main file, initializes the server
├── .env                        # Environment variables
├── .gitignore                  # Files/folders ignored by git
├── package-lock.json           # Dependency lock file
├── package.json                # Dependencies and scripts
├── schema.sql                  # Database schema
```

## API Endpoints

Below are the main API endpoints:

### Authentication

- **POST /api/auth/register**

  - Register a new user.
  - Body:
    ```json
    {
      "email": "user@gmail.com",
      "password": "1234",
      "name": "User Name",
      "dateOfBirth": "1990-01-01",
      "role": "user"
    }
    ```
  - Response (201):
    ```json
    {
      "message": "User registered successfully",
      "userId": 2
    }
    ```

- **POST /api/auth/login**

  - Log in and receive a JWT token.
  - Body:
    ```json
    {
      "email": "user@gmail.com",
      "password": "1234"
    }
    ```
  - Response (200):
    ```json
    {
      "message": "Login successful",
      "token": "<jwt>",
      "user": {
        "email": "user@gmail.com",
        "name": "User Name",
        "dateOfBirth": "1990-01-01",
        "role": "user"
      }
    }
    ```

- **PUT /api/auth/users/:id**

  - Update user information (name, date of birth, password).
  - Requires authentication.
  - Header: `Authorization: Bearer <token>`
  - Body:
    ```json
    {
      "name": "Updated Name",
      "dateOfBirth": "1995-01-01",
      "password": "newpassword123"
    }
    ```
  - Response (200):
    ```json
    {
      "message": "User updated successfully",
      "user": {
        "email": "user@gmail.com",
        "name": "Updated Name",
        "dateOfBirth": "1995-01-01",
        "role": "user"
      }
    }
    ```
  - Response (403):
    ```json
    {
      "message": "Unauthorized: You can only update your own account or must be an admin"
    }
    ```
  - Response (404):
    ```json
    {
      "message": "User not found"
    }
    ```

- **GET /api/auth/users**

  - Retrieve all users (requires authentication).
  - Header: `Authorization: Bearer <token>`
  - Response (200):
    ```json
    [
      {
        "id": 1,
        "email": "user@gmail.com",
        "name": "User Name",
        "date_of_birth": "1990-01-01",
        "created_at": "2025-05-16T10:00:00.000Z"
      }
    ]
    ```

- **GET /api/auth/users/:id**

  - Retrieve a user by ID (requires authentication).
  - Header: `Authorization: Bearer <token>`
  - Response (200):
    ```json
    {
      "id": 1,
      "email": "user@gmail.com",
      "name": "User Name",
      "date_of_birth": "1990-01-01",
      "created_at": "2025-05-16T10:00:00.000Z"
    }
    ```

### Songs

- **POST /api/songs/** (Admin)

  - Add a new song.
  - Body (form-data): `title`, `genres`, `artists`, `file` (mp3/wav/m4a).
  - Header: `Authorization: Bearer <token>`
  - Response (201):
    ```json
    {
      "message": "Song added successfully",
      "songId": 1
    }
    ```

- **GET /api/songs/**

  - Retrieve all songs.
  - Response (200):
    ```json
    [
      {
        "id": 1,
        "title": "ChamHoa",
        "artists": ["Mono"],
        "file_path": "/uploads/1747325319270-ChamHoa.mp3",
        "uploaded_at": "2025-05-16T10:00:00.000Z"
      }
    ]
    ```

- **GET /api/songs/stream/:id**

  - Stream a song by ID (supports HTTP Range).
  - Response (200/206): Audio stream (`Content-Type: audio/mpeg`)

- **GET /api/songs/search?q=<query>**

  - Search songs by title or artist.
  - Response (200):
    ```json
    [
      {
        "id": 1,
        "title": "ChamHoa",
        "artists": ["Mono"],
        "file_path": "/uploads/1747325319270-ChamHoa.mp3",
        "uploaded_at": "2025-05-16T10:00:00.000Z"
      }
    ]
    ```

- **GET /api/songs/search-by-genres?genres=<genres>**

  - Search songs by genre.
  - Response (200):
    ```json
    [
      {
        "id": 1,
        "title": "ChamHoa",
        "artists": ["Mono"],
        "file_path": "/Uploads/1747325319270-ChamHoa.mp3",
        "uploaded_at": "2025-05-16T10:00:00.000Z"
      }
    ]
    ```

- **PUT /api/songs/:id** (Admin)

  - Update song information.
  - Body:
    ```json
    {
      "title": "New Title",
      "genres": ["Pop"],
      "artists": ["Artist 1"]
    }
    ```
  - Header: `Authorization: Bearer <token>`
  - Response (200):
    ```json
    {
      "message": "Song updated successfully"
    }
    ```

- **DELETE /api/songs/:id** (Admin)

  - Delete a song.
  - Header: `Authorization: Bearer <token>`
  - Response (200):
    ```json
    {
      "message": "Song deleted successfully"
    }
    ```

### Playlists

- **GET /api/playlists/** (User/Admin)

  - Retrieve all playlists the user has access to.
  - Header: `Authorization: Bearer <token>`
  - Response (200):
    ```json
    [
      {
        "id": 1,
        "name": "Test1 Playlist",
        "created_at": "2025-05-15T16:46:33.000Z"
      },
      {
        "id": 4,
        "name": "Nhạc nhẹ",
        "created_at": "2025-05-21T17:34:56.000Z"
      }
    ]
    ```

- **POST /api/playlists/** (User/Admin)

  - Create a new playlist.
  - Body:
    ```json
    {
      "name": "My Playlist"
    }
    ```
  - Header: `Authorization: Bearer <token>`
  - Response (201):
    ```json
    {
      "message": "Playlist created successfully",
      "playlistId": 1
    }
    ```

- **GET /api/playlists/:playlistId/songs**

  - Retrieve songs in a playlist.
  - Response (200):
    ```json
    [
      {
        "id": 1,
        "title": "ChamHoa",
        "artists": ["Mono"],
        "genres": ["Pop"],
        "file_path": "/Uploads/1747325319270-ChamHoa.mp3",
        "uploaded_at": "2025-05-16T10:00:00.000Z"
      }
    ]
    ```

- **POST /api/playlists/songs** (User/Admin)

  - Add a song to a playlist.
  - Body:
    ```json
    {
      "playlistId": 1,
      "songId": 1
    }
    ```
  - Header: `Authorization: Bearer <token>`
  - Response (200):
    ```json
    {
      "message": "Song added to playlist successfully"
    }
    ```

- **DELETE /api/playlists/:playlistId/songs/:songId** (User/Admin)

  - Remove a song from a playlist.
  - Header: `Authorization: Bearer <token>`
  - Response (200):
    ```json
    {
      "message": "Song removed from playlist successfully"
    }
    ```

- **DELETE /api/playlists/:playlistId** (User/Admin)

  - Delete a playlist.
  - Header: `Authorization: Bearer <token>`
  - Response (200):
    ```json
    {
      "message": "Playlist deleted successfully"
    }
    ```

## Usage

1. **Start the server**:

   - Run the server with the following command:
     ```bash
     node --watch App.js
     ```
   - The server will run at `http://localhost:3000`. Check the console logs to confirm the server has started successfully.

2. **Log in to obtain a token**:

   - Use the `/api/auth/login` endpoint to obtain a JWT token.
   - **Request** (Postman or cURL):
     - **Method**: POST
     - **URL**: `http://localhost:3000/api/auth/login`
     - **Body** (application/json):
       ```json
       {
         "email": "admin@gmail.com",
         "password": "1234"
       }
       ```
     - **cURL Example**:
       ```bash
       curl -X POST http://localhost:3000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"admin@gmail.com","password":"1234"}'
       ```
   - **Expected Response** (HTTP 200):
     ```json
     {
       "message": "Login successful",
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NDY1ODcyOTcsImV4cCI6MTc0NjU5MDg5N30.w5PI1_zR1Hl2XxyXNqw-qMBFvO8Kz0ONKg9s57BbFC8",
       "user": {
         "email": "admin@gmail.com",
         "name": "Admin User",
         "dateOfBirth": "1980-01-01",
         "role": "admin"
       }
     }
     ```
   - Save the token for use in requests requiring authentication (add to the header as `Authorization: Bearer <token>`).

3. **Register a new user**:

   - Use the `/api/auth/register` endpoint to create a new user.
   - **Request** (Postman or cURL):
     - **Method**: POST
     - **URL**: `http://localhost:3000/api/auth/register`
     - **Body** (application/json):
       ```json
       {
         "email": "newuser@gmail.com",
         "password": "1234",
         "name": "New User",
         "dateOfBirth": "1990-01-01",
         "role": "user"
       }
       ```
     - **cURL Example**:
       ```bash
       curl -X POST http://localhost:3000/api/auth/register \
       -H "Content-Type: application/json" \
       -d '{"email":"newuser@gmail.com","password":"1234","name":"New User","dateOfBirth":"1990-01-01","role":"user"}'
       ```
   - **Expected Response** (HTTP 201):
     ```json
     {
       "message": "User registered successfully"
     }
     ```

4. **Update user information**:

   - Use the `/api/auth/users/:id` endpoint to update user details.
   - **Request** (Postman or cURL):
     - **Method**: PUT
     - **URL**: `http://localhost:3000/api/auth/users/2`
     - **Header**:
       ```
       Authorization: Bearer <token>
       Content-Type: application/json
       ```
     - **Body** (application/json):
       ```json
       {
         "name": "Updated User",
         "dateOfBirth": "1995-01-01",
         "password": "newpassword123"
       }
       ```
     - **cURL Example**:
       ```bash
       curl -X PUT http://localhost:3000/api/auth/users/2 \
       -H "Authorization: Bearer <token>" \
       -H "Content-Type: application/json" \
       -d '{"name":"Updated User","dateOfBirth":"1995-01-01","password":"newpassword123"}'
       ```
   - **Expected Response** (HTTP 200):
     ```json
     {
       "message": "User updated successfully",
       "user": {
         "email": "newuser@gmail.com",
         "name": "Updated User",
         "dateOfBirth": "1995-01-01",
         "role": "user"
       }
     }
     ```

5. **Add a new song** (Admin):

   - Use the `/api/songs/` endpoint to add a song.
   - **Request** (Postman or cURL):
     - **Method**: POST
     - **URL**: `http://localhost:3000/api/songs/`
     - **Header**:
       ```
       Authorization: Bearer <token>
       ```
     - **Body** (form-data):
       - `title`: `ChamHoa`
       - `genres`: `["Pop"]`
       - `artists`: `["Mono"]`
       - `file`: Select a music file (e.g., `/path/to/ChamHoa.mp3`, supported formats: mp3/wav/m4a)
     - **cURL Example**:
       ```bash
       curl -X POST http://localhost:3000/api/songs/ \
       -H "Authorization: Bearer <token>" \
       -F "title=ChamHoa" \
       -F "genres=[\"Pop\"]" \
       -F "artists=[\"Mono\"]" \
       -F "file=@/path/to/ChamHoa.mp3"
       ```
   - **Expected Response** (HTTP 201):
     ```json
     {
       "message": "Song added successfully",
       "songId": 1
     }
     ```
   - Verify the file in the `/uploads/` directory:
     ```bash
     ls uploads/
     ```
     - **Expected Output**: You should see a file (e.g., `1747325319270-ChamHoa.mp3`).

6. **Retrieve all songs**:

   - Use the `/api/songs/` endpoint to fetch all songs.
   - **Request** (Postman or cURL):
     - **Method**: GET
     - **URL**: `http://localhost:3000/api/songs/`
     - **cURL Example**:
       ```bash
       curl -X GET http://localhost:3000/api/songs/
       ```
   - **Expected Response** (HTTP 200):
     ```json
     [
       {
         "id": 1,
         "title": "ChamHoa",
         "artists": ["Mono"],
         "genres": ["Pop"],
         "file_path": "/Uploads/1747325319270-ChamHoa.mp3",
         "uploaded_at": "2025-05-16T10:00:00.000Z"
       }
     ]
     ```

7. **Stream a song**:

   - Use the `/api/songs/stream/:id` endpoint to stream a song.
   - **Request** (Postman or cURL):
     - **Method**: GET
     - **URL**: `http://localhost:3000/api/songs/stream/1`
     - **Header** (optional, for partial streaming): `Range: bytes=0-`
     - **cURL Example**:
       ```bash
       curl -X GET http://localhost:3000/api/songs/stream/1 -H "Range: bytes=0-"
       ```
   - **Expected Response** (HTTP 200 or 206):
     - Returns audio data (binary stream). Use tools like VLC or a browser to play.
     - Example headers:
       ```
       Content-Type: audio/mpeg
       Content-Length: 5242880
       Accept-Ranges: bytes
       Content-Range: bytes 0-5242879/5242880
       ```

8. **Search songs by title or artist**:

   - Use the `/api/songs/search?q=<query>` endpoint.
   - **Request** (Postman or cURL):
     - **Method**: GET
     - **URL**: `http://localhost:3000/api/songs/search?q=ChamHoa`
     - **cURL Example**:
       ```bash
       curl -X GET "http://localhost:3000/api/songs/search?q=ChamHoa"
       ```
   - **Expected Response** (HTTP 200):
     ```json
     [
       {
         "id": 1,
         "title": "ChamHoa",
         "artists": ["Mono"],
         "genres": ["Pop"],
         "file_path": "/Uploads/1747325319270-ChamHoa.mp3",
         "uploaded_at": "2025-05-16T10:00:00.000Z"
       }
     ]
     ```

9. **Search songs by genre**:

   - Use the `/api/songs/search-by-genres?genres=<genres>` endpoint.
   - **Request** (Postman or cURL):
     - **Method**: GET
     - **URL**: `http://localhost:3000/api/songs/search-by-genres?genres=Pop`
     - **cURL Example**:
       ```bash
       curl -X GET "http://localhost:3000/api/songs/search-by-genres?genres=Pop"
       ```
   - **Expected Response** (HTTP 200):
     ```json
     [
       {
         "id": 1,
         "title": "ChamHoa",
         "artists": ["Mono"],
         "genres": ["Pop"],
         "file_path": "/Uploads/1747325319270-ChamHoa.mp3",
         "uploaded_at": "2025-05-16T10:00:00.000Z"
       }
     ]
     ```

10. **Update song information** (Admin):

    - Use the `/api/songs/:id` endpoint.
    - **Request** (Postman or cURL):
      - **Method**: PUT
      - **URL**: `http://localhost:3000/api/songs/1`
      - **Header**:
        ```
        Authorization: Bearer <token>
        Content-Type: application/json
        ```
      - **Body** (application/json):
        ```json
        {
          "title": "ChamHoa Updated",
          "genres": ["Pop", "Rock"],
          "artists": ["Mono", "Artist 2"]
        }
        ```
      - **cURL Example**:
        ```bash
        curl -X PUT http://localhost:3000/api/songs/1 \
        -H "Authorization: Bearer <token>" \
        -H "Content-Type: application/json" \
        -d '{"title":"ChamHoa Updated","genres":["Pop","Rock"],"artists":["Mono","Artist 2"]}'
        ```
    - **Expected Response** (HTTP 200):
      ```json
      {
        "message": "Song updated successfully"
      }
      ```

11. **Delete a song** (Admin):

    - Use the `/api/songs/:id` endpoint.
    - **Request** (Postman or cURL):
      - **Method**: DELETE
      - **URL**: `http://localhost:3000/api/songs/1`
      - **Header**:
        ```
        Authorization: Bearer <token>
        ```
      - **cURL Example**:
        ```bash
        curl -X DELETE http://localhost:3000/api/songs/1 \
        -H "Authorization: Bearer <token>"
        ```
    - **Expected Response** (HTTP 200):
      ```json
      {
        "message": "Song deleted successfully"
      }
      ```

12. **Create a playlist** (User/Admin):

    - Use the `/api/playlists/` endpoint.
    - **Request** (Postman or cURL):
      - **Method**: POST
      - **URL**: `http://localhost:3000/api/playlists/`
      - **Header**:
        ```
        Authorization: Bearer <token>
        Content-Type: application/json
        ```
      - **Body** (application/json):
        ```json
        {
          "name": "My Playlist"
        }
        ```
      - **cURL Example**:
        ```bash
        curl -X POST http://localhost:3000/api/playlists/ \
        -H "Authorization: Bearer <token>" \
        -H "Content-Type: application/json" \
        -d '{"name":"My Playlist"}'
        ```
    - **Expected Response** (HTTP 201):
      ```json
      {
        "message": "Playlist created successfully",
        "playlistId": 1
      }
      ```

13. **Retrieve all playlists** (User/Admin):

    - Use the `/api/playlists/` endpoint to fetch all playlists the user has access to.
    - **Request** (Postman or cURL):
      - **Method**: GET
      - **URL**: `http://localhost:3000/api/playlists/`
      - **Header**:
        ```
        Authorization: Bearer <token>
        ```
      - **cURL Example**:
        ```bash
        curl -X GET http://localhost:3000/api/playlists/ \
        -H "Authorization: Bearer <token>"
        ```
    - **Expected Response** (HTTP 200):
      ```json
      [
        {
          "id": 1,
          "name": "Test1 Playlist",
          "created_at": "2025-05-15T16:46:33.000Z"
        },
        {
          "id": 4,
          "name": "Nhạc nhẹ",
          "created_at": "2025-05-21T17:34:56.000Z"
        }
      ]
      ```

14. **Retrieve songs in a playlist**:

    - Use the `/api/playlists/:playlistId/songs` endpoint.
    - **Request** (Postman or cURL):
      - **Method**: GET
      - **URL**: `http://localhost:3000/api/playlists/1/songs`
      - **cURL Example**:
        ```bash
        curl -X GET http://localhost:3000/api/playlists/1/songs
        ```
    - **Expected Response** (HTTP 200):
      ```json
      [
        {
          "id": 1,
          "title": "ChamHoa",
          "artists": ["Mono"],
          "genres": ["Pop"],
          "file_path": "/Uploads/1747325319270-ChamHoa.mp3",
          "uploaded_at": "2025-05-16T10:00:00.000Z"
        }
      ]
      ```

15. **Add a song to a playlist** (User/Admin):

    - Use the `/api/playlists/songs` endpoint.
    - **Request** (Postman or cURL):
      - **Method**: POST
      - **URL**: `http://localhost:3000/api/playlists/songs`
      - **Header**:
        ```
        Authorization: Bearer <token>
        Content-Type: application/json
        ```
      - **Body** (application/json):
        ```json
        {
          "playlistId": 1,
          "songId": 1
        }
        ```
      - **cURL Example**:
        ```bash
        curl -X POST http://localhost:3000/api/playlists/songs \
        -H "Authorization: Bearer <token>" \
        -H "Content-Type: application/json" \
        -d '{"playlistId":1,"songId":1}'
        ```
    - **Expected Response** (HTTP 200):
      ```json
      {
        "message": "Song added to playlist successfully"
      }
      ```

16. **Remove a song from a playlist** (User/Admin):

    - Use the `/api/playlists/:playlistId/songs/:songId` endpoint.
    - **Request** (Postman or cURL):
      - **Method**: DELETE
      - **URL**: `http://localhost:3000/api/playlists/1/songs/1`
      - **Header**:
        ```
        Authorization: Bearer <token>
        ```
      - **cURL Example**:
        ```bash
        curl -X DELETE http://localhost:3000/api/playlists/1/songs/1 \
        -H "Authorization: Bearer <token>"
        ```
    - **Expected Response** (HTTP 200):
      ```json
      {
        "message": "Song removed from playlist successfully"
      }
      ```

17. **Delete a playlist** (User/Admin):

    - Use the `/api/playlists/:playlistId` endpoint.
    - **Request** (Postman or cURL):
      - **Method**: DELETE
      - **URL**: `http://localhost:3000/api/playlists/1`
      - **Header**:
        ```
        Authorization: Bearer <token>
        ```
      - **cURL Example**:
        ```bash
        curl -X DELETE http://localhost:3000/api/playlists/1 \
        -H "Authorization: Bearer <token>"
        ```
    - **Expected Response** (HTTP 200):
      ```json
      {
        "message": "Playlist deleted successfully"
      }
      ```

18. **Default admin account**:
    - Log in with:
      ```json
      {
        "email": "admin@gmail.com",
        "password": "1234"
      }
      ```

````

<!-- ``` -->
````
