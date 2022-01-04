process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let mockCompany;

beforeEach(async function () {
  let result = await db.query(
    `INSERT INTO companies (code, name, description) 
    VALUES ("vrbo", "VRBO", "vacation rental")
    RETURNING code, name, description`
  );
  mockCompany = result.rows[0];
});

describe("GET /companies", function () {
  test("Gets a list of a company", () => {
    console.log(mockCompany)
  }
)}
);

afterEach(async function () {
  await db.query("DELETE FROM companies");
});

afterAll(async function () {
  await db.end();
});
