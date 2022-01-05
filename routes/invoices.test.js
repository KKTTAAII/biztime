process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let mockInvoice;
let mockCompany;

beforeEach(async function () {
  let company = await db.query(
    `INSERT INTO companies (code, name, description) 
    VALUES ('vrbo', 'VRBO', 'vacation rental') 
    RETURNING code, name, description`
  );
  let invoice = await db.query(
    `INSERT INTO invoices (comp_Code, amt, paid, paid_date, add_date)
    VALUES ('vrbo', 100, false, null, '2022-01-04')
    RETURNING id, comp_code, amt, paid, paid_date, add_date`
  );
  mockInvoice = invoice.rows[0];
  mockCompany = company.rows[0];
});

afterEach(async function () {
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
});

afterAll(async function () {
  await db.end();
});

describe("GET /invoices", function () {
  test("Gets a list of a invoice", async function () {
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoices: [
        {
          add_date: "2022-01-04T07:00:00.000Z",
          amt: 100,
          comp_code: "vrbo",
          id: mockInvoice.id,
          paid: false,
          paid_date: null,
        },
      ],
    });
  });
});

describe("GET /invoices/:id", function () {
  test("Gets a single invoice", async function () {
    const response = await request(app).get(`/invoices/${mockInvoice.id}`);
    expect(response.statusCode).toEqual(200);
    const { id, amt, paid, add_date, paid_date } = mockInvoice;
    const company = mockCompany;
    expect(response.body).toEqual({
      invoice: {
        id,
        amt,
        paid,
        add_date: "2022-01-04T07:00:00.000Z",
        paid_date,
        company,
      },
    });
  });

  test("Responds with 404 if can't find company", async function () {
    const response = await request(app).get(`/companies/56`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /invoices", function () {
  test("Creates a new invoice", async function () {
    const response = await request(app).post(`/invoices`).send({
      comp_code: "vrbo",
      amt: 500,
      paid: false,
      add_date: "2022-01-02",
    });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      invoice: {
        comp_code: "vrbo",
        amt: 500,
        paid: false,
        add_date: "2022-01-02T07:00:00.000Z",
        id: expect.any(Number),
        paid_date: null,
      },
    });
  });
});

describe("PUT /invoices/:id", function () {
  test("Updates a single invoice", async function () {
    const response = await request(app)
      .put(`/invoices/${mockInvoice.id}`)
      .send({
        amt: 900,
        paid: true
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {
        comp_code: "vrbo",
        amt: 900,
        paid: true,
        add_date: "2022-01-04T07:00:00.000Z",
        id: expect.any(Number),
        paid_date: "2022-01-04T07:00:00.000Z",
      },
    });
  });

  test("Responds with 404 if can't find invoice", async function () {
    const response = await request(app).put(`/invoices/98`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /invoices/:id", function () {
  test("Deletes a single a invoice", async function () {
    const response = await request(app).delete(
      `/invoices/${mockInvoice.id}`
    );
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 if can't find company", async function () {
    const response = await request(app).patch(`/invoices/87`);
    expect(response.statusCode).toEqual(404);
  });
});