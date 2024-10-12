Backend for a video streaming service with all functionalities like user authentication, video upload, subscriptions, etc.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Cloudinary
- JWT
- Mongoose

## Installation

1. Clone the repository
2. Install the required dependencies using `npm install`
3. Create a `.env` file in the root directory and add the following environment variables:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@cluster<>.mongodb.net/<database>?retryWrites=true&w=majority
ACCESS_TOKEN_SECRET=<your_secret_key>
REFRESH_TOKEN_SECRET=<your_secret_key>
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=1d
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
```

4. Run the server using `npm run dev`