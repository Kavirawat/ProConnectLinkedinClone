import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log(
  process.env.CLOUDINARY_CLOUD_NAME ? 'cloud name success' : 'failed',
);
console.log(process.env.CLOUDINARY_API_KEY ? 'cloud key success' : 'failed');
console.log(
  process.env.CLOUDINARY_API_SECRET ? 'cloud secret success' : 'failed',
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(
  'Cloudinary config:',
  cloudinary.config().cloud_name,
  Boolean(cloudinary.config().api_key),
  Boolean(cloudinary.config().api_secret),
);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Linkedin_Photo',
    allowed_formats: ['png', 'jpg', 'jpeg', 'webp', 'PNG', 'JPG', 'JPEG'],
  },
});

export const uploadCloud = multer({ storage: storage });
