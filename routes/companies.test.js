process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let mockCompany;

beforeEach(async function () {
  let company = await db.query(
    `INSERT INTO companies (code, name, description) 
    VALUES ('vrbo', 'VRBO', 'vacation rental') 
    RETURNING code, name, description`
  );
  mockCompany = company.rows[0];
});

afterEach(async function () {
  await db.query("DELETE FROM companies");
});

afterAll(async function () {
  await db.end();
});

describe("GET /companies", function () {
  test("Gets a list of a company", async function () {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ companies: [mockCompany] });
  });
});

describe("GET /companies/:id", function () {
  test("Gets a single company", async function () {
    const response = await request(app).get(`/companies/${mockCompany.code}`);
    mockCompany.invoices = [];
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ company: mockCompany });
  });

  test("Responds with 404 if can't find company", async function () {
    const response = await request(app).get(`/companies/dksjng`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /companies", function () {
  test("Creates a newcompanie", async function () {
    const response = await request(app).post(`/companies`).send({
      code: "evolve",
      name: "Evolve",
      description: "VCR management",
    });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {
        code: "evolve",
        name: "Evolve",
        description: "VCR management",
      },
    });
  });
});

describe("PUT /companies/:id", function () {
  test("Updates a single company", async function () {
    const response = await request(app)
      .put(`/companies/${mockCompany.code}`)
      .send({
        name: "Booking.com",
        description: "vacation rental",
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {
        code: "vrbo",
        name: "Booking.com",
        description: "vacation rental",
      },
    });
  });

  test("Responds with 404 if can't find company", async function () {
    const response = await request(app).patch(`/companies/gsjkgf`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/:id", function () {
  test("Deletes a single a company", async function () {
    const response = await request(app).delete(
      `/companies/${mockCompany.code}`
    );
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 if can't find company", async function () {
    const response = await request(app).patch(`/companies/dgdf`);
    expect(response.statusCode).toEqual(404);
  });
});
