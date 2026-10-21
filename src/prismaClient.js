// prismaClient.js - Kết nối Prisma 7 tới MySQL
// Đọc DATABASE_URL trong file .env, ví dụ:
//   DATABASE_URL="mysql://user:password@localhost:3306/ten_csdl"
//
// Cách dùng:
//   import { prisma } from "./prismaClient.js";
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";

// =====================================================
// HẰNG SỐ
// =====================================================

const DEFAULT_PORT = 3306;
const CONNECTION_LIMIT = 5;

// =====================================================
// CẤU HÌNH KẾT NỐI
// =====================================================

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong file .env");
}

const url = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || DEFAULT_PORT,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: CONNECTION_LIMIT,
});

// =====================================================
// KHỞI TẠO
// =====================================================

export const prisma = new PrismaClient({ adapter });