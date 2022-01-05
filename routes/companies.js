const express = require("express");
const router = new express.Router();
const slugify = require("slugify");
const ExpressError = require("../expressError");
const db = require("../db");

function checkData(results, req) {
  if (results.rows.length === 0) {
    let notFoundError = new Error(
      `There is no company with code '${req.params.code}'`
    );
    notFoundError.status = 404;
    throw notFoundError;
  }
}

router.get("/", async function (req, res, next) {
  try {
    const companies = await db.query(`
    SELECT c.code, c.name, c.description, i.industry
    FROM companies AS c
    LEFT JOIN company_industries AS compi
    ON c.code = compi.comp_code
    LEFT JOIN industries AS i
    ON i.code = compi.industry_code;`);
    return res.json({ companies: companies.rows });
  } catch (e) {
    next(e);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    const companies = await db.query(
      `SELECT c.code, c.name, c.description, i.industry
      FROM companies AS c
      LEFT JOIN company_industries AS compi
      ON c.code = compi.comp_code
      LEFT JOIN industries AS i
      ON i.code = compi.industry_code 
      WHERE c.code = $1`,
      [req.params.code]
    );
    checkData(companies, req);
    const invoices = await db.query(
      `SELECT * FROM invoices WHERE comp_code = $1`,
      [req.params.code]
    );
    const industries = companies.rows.map((c) => c.industry);
    companies.rows[0].industry = industries;
    companies.rows[0].invoices = invoices.rows;
    return res.json({ company: companies.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const inputCode = req.body.code;
    const slugifiedCode = slugify(inputCode, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const { name, description } = req.body;
    const comapnies = await db.query(
      `INSERT INTO companies (code, name, description) 
           VALUES ($1, $2, $3) 
           RETURNING code, name, description`,
      [slugifiedCode, name, description]
    );
    return res.status(201).json({ company: comapnies.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.put("/:code", async function (req, res, next) {
  try {
    const { name, description } = req.body;
    const companies = await db.query(
      `UPDATE companies
      SET name= $1,
      description = $2
      WHERE code = $3
      RETURNING code, name, description`,
      [name, description, req.params.code]
    );
    checkData(companies, req);
    return res.json({ company: companies.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.delete("/:code", async function (req, res, next) {
  try {
    const comapnies = await db.query(
      `DELETE FROM companies WHERE code = $1 RETURNING code`,
      [req.params.code]
    );
    checkData(comapnies, req);
    return res.json({ status: "deleted" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;