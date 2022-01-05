const express = require("express");
const router = new express.Router();
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
    const companies = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: companies.rows });
  } catch (e) {
    next(e);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    const companies = await db.query(
      `SELECT * FROM companies WHERE code = $1`,
      [req.params.code]
    );
    checkData(companies, req);
    const invoices = await db.query(
      `SELECT * FROM invoices WHERE comp_code = $1`,
      [req.params.code]
    );
    companies.rows[0].invoices = invoices.rows;
    return res.json({ company: companies.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;
    const comapnies = await db.query(
      `INSERT INTO companies (code, name, description) 
           VALUES ($1, $2, $3) 
           RETURNING code, name, description`,
      [code, name, description]
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
