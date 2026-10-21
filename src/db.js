// db.js - Kiểm tra kết nối CSDL và đọc thử bảng bao_tri
//
// Dùng chung kết nối Prisma trong prismaClient.js (đọc DATABASE_URL trong .env),
// nên không cần mysql2 và các biến DB_HOST, DB_USER, DB_PASSWORD, DB_NAME nữa.
//
// Chạy bằng: node src/db.js
import { prisma } from "./prismaClient.js";
import { baoTri } from "./crud/index.js";

// =====================================================
// KIỂM TRA
// =====================================================

// Thử kết nối bằng một truy vấn đơn giản
async function checkConnection() {
  console.log("Đang kết nối MySQL...");
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    throw new Error(`Kết nối thất bại: ${e.message}`);
  }
  console.log("Kết nối MySQL thành công!");
}

// Đọc toàn bộ bảng bao_tri
async function showMaintenance() {
  let rows;
  try {
    rows = await baoTri.getAll();
  } catch (e) {
    throw new Error(`Lỗi truy vấn: ${e.message}`);
  }
  console.log("Dữ liệu bảng bao_tri:");
  console.log(rows);
}

// =====================================================
// CHẠY
// =====================================================

async function main() {
  await checkConnection();
  await showMaintenance();
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());