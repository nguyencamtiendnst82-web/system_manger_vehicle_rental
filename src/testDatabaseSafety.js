function parseMySqlTarget(value, variableName) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} phải là URL MySQL hợp lệ`);
  }

  if (url.protocol !== "mysql:" || !url.hostname) {
    throw new Error(`${variableName} phải là URL MySQL hợp lệ`);
  }

  let database;
  try {
    database = decodeURIComponent(url.pathname.slice(1)).replace(/\/+$/, "");
  } catch {
    throw new Error(`${variableName} phải là URL MySQL hợp lệ`);
  }

  if (!database) {
    throw new Error(`${variableName} phải chỉ rõ tên database`);
  }

  let hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    hostname = "<loopback>";
  }

  return {
    hostname,
    port: url.port || "3306",
    database: database.toLowerCase(),
  };
}

function isSameDatabase(first, second) {
  return (
    first.hostname === second.hostname &&
    first.port === second.port &&
    first.database === second.database
  );
}

export function getIsolatedTestDatabaseUrl({
  testUrl = process.env.TEST_DATABASE_URL,
  applicationUrl = process.env.DATABASE_URL,
  allowDestructive = process.env.ALLOW_DESTRUCTIVE_TEST_DB,
} = {}) {
  if (!testUrl) {
    throw new Error("Thiếu TEST_DATABASE_URL; từ chối thao tác xóa dữ liệu");
  }
  if (!applicationUrl) {
    throw new Error("Thiếu DATABASE_URL để đối chiếu database ứng dụng");
  }
  if (allowDestructive !== "YES") {
    throw new Error("Cần xác nhận ALLOW_DESTRUCTIVE_TEST_DB=YES cho database kiểm thử");
  }

  const testTarget = parseMySqlTarget(testUrl, "TEST_DATABASE_URL");
  const applicationTarget = parseMySqlTarget(applicationUrl, "DATABASE_URL");

  if (!/(^|[_-])test($|[_-])/i.test(testTarget.database)) {
    throw new Error('Tên database kiểm thử phải có token "test"');
  }
  if (isSameDatabase(testTarget, applicationTarget)) {
    throw new Error("TEST_DATABASE_URL trỏ cùng database với DATABASE_URL; từ chối thao tác xóa");
  }

  return testUrl;
}
