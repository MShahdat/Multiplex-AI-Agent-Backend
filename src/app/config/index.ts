import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const config = {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  app_name: process.env.APP_NAME,

  database_url: process.env.DATABASE_URL,

  bakend_url: process.env.BACKEND_URL,
  frontend_url: process.env.FRONTEND_URL,

  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,

  radis_name: process.env.RADIS_NAME!,
  radis_password: process.env.RADIS_PASSWORD!,
  radis_host: process.env.RADIS_HOST!,
  radis_port: process.env.RADIS_PORT!,

  smtp_user: process.env.SMTP_USER!,
  smtp_sender: process.env.SMTP_SENDER!,
  smtp_password: process.env.SMTP_PASSWORD!,

  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY!,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET!,

  tester_admin_name: process.env.TESTER_ADMIN_NAME!,
  tester_admin_email: process.env.TESTER_ADMIN_EMAIL!,
  tester_admin_password: process.env.TESTER_ADMIN_PASSWORD!,



};

export default config;
