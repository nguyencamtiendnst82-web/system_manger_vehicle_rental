import { describe, expect, test } from "@jest/globals";
import { getIsolatedTestDatabaseUrl } from "../testDatabaseSafety.js";

const confirmation = "YES";
const applicationUrl = "mysql://app:secret@localhost:3306/vehicle_rent";

describe("test database safety guard", () => {
  test("accepts a confirmed, separate test database", () => {
    const testUrl = "mysql://test:secret@127.0.0.1:3306/vehicle_rent_test";

    expect(
      getIsolatedTestDatabaseUrl({
        testUrl,
        applicationUrl,
        allowDestructive: confirmation,
      })
    ).toBe(testUrl);
  });

  test("rejects the application database even when credentials differ and its name contains test", () => {
    expect(() =>
      getIsolatedTestDatabaseUrl({
        testUrl: "mysql://other:secret@127.0.0.1:3306/vehicle_rent_test",
        applicationUrl: "mysql://app:secret@localhost:3306/vehicle_rent_test",
        allowDestructive: confirmation,
      })
    ).toThrow("cùng database");
  });

  test("rejects database names without a separate test token", () => {
    expect(() =>
      getIsolatedTestDatabaseUrl({
        testUrl: "mysql://test:secret@localhost:3306/vehicle_rent",
        applicationUrl,
        allowDestructive: confirmation,
      })
    ).toThrow('token "test"');
  });

  test("requires explicit destructive confirmation", () => {
    expect(() =>
      getIsolatedTestDatabaseUrl({
        testUrl: "mysql://test:secret@localhost:3306/vehicle_rent_test",
        applicationUrl,
        allowDestructive: "",
      })
    ).toThrow("ALLOW_DESTRUCTIVE_TEST_DB=YES");
  });

  test("requires the test database URL", () => {
    expect(() =>
      getIsolatedTestDatabaseUrl({
        testUrl: "",
        applicationUrl,
        allowDestructive: confirmation,
      })
    ).toThrow("TEST_DATABASE_URL");
  });

  test("requires the application database URL for comparison", () => {
    expect(() =>
      getIsolatedTestDatabaseUrl({
        testUrl: "mysql://test:secret@localhost:3306/vehicle_rent_test",
        applicationUrl: "",
        allowDestructive: confirmation,
      })
    ).toThrow("DATABASE_URL");
  });

  test("rejects malformed, non-MySQL, or undecodable database URLs", () => {
    for (const testUrl of [
      "not a URL",
      "https://test:secret@localhost/vehicle_rent_test",
      "mysql://test:secret@localhost/%E0%A4%A",
    ]) {
      expect(() =>
        getIsolatedTestDatabaseUrl({
          testUrl,
          applicationUrl,
          allowDestructive: confirmation,
        })
      ).toThrow("TEST_DATABASE_URL");
    }
  });

  test("rejects URLs without a database name", () => {
    expect(() =>
      getIsolatedTestDatabaseUrl({
        testUrl: "mysql://test:secret@localhost/",
        applicationUrl,
        allowDestructive: confirmation,
      })
    ).toThrow("tên database");
  });

  test("treats an omitted MySQL port as the default port when comparing targets", () => {
    expect(() =>
      getIsolatedTestDatabaseUrl({
        testUrl: "mysql://test:secret@db.example.com/vehicle_rent_test",
        applicationUrl: "mysql://app:secret@db.example.com:3306/vehicle_rent_test",
        allowDestructive: confirmation,
      })
    ).toThrow("cùng database");
  });

  test("uses environment values when called without arguments", () => {
    const previous = {
      testUrl: process.env.TEST_DATABASE_URL,
      applicationUrl: process.env.DATABASE_URL,
      allowDestructive: process.env.ALLOW_DESTRUCTIVE_TEST_DB,
    };
    const testUrl = "mysql://test:secret@db.example.com:3307/vehicle_rent_test";

    try {
      process.env.TEST_DATABASE_URL = testUrl;
      process.env.DATABASE_URL = "mysql://app:secret@db.example.com:3307/vehicle_rent";
      process.env.ALLOW_DESTRUCTIVE_TEST_DB = confirmation;
      expect(getIsolatedTestDatabaseUrl()).toBe(testUrl);
    } finally {
      if (previous.testUrl === undefined) delete process.env.TEST_DATABASE_URL;
      else process.env.TEST_DATABASE_URL = previous.testUrl;
      if (previous.applicationUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous.applicationUrl;
      if (previous.allowDestructive === undefined) delete process.env.ALLOW_DESTRUCTIVE_TEST_DB;
      else process.env.ALLOW_DESTRUCTIVE_TEST_DB = previous.allowDestructive;
    }
  });
});
