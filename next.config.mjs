import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load env from monorepo root (pos-lv2/.env) so Frontend can read it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
