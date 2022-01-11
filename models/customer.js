/** Customer for Lunchly */
const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */
class Customer {
  constructor({ id, firstName, middleName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** check if falsy notes */
  set notes(value) {
    if (value) {
      this._notes = value;
    } else {
      this._notes = "";
    }
  }

  /** get notes value */
  get notes() {
    return this._notes;
  }

  /** find all customers. */
  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         middle_name AS "middleName",
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );

    return results.rows.map(customer => new Customer(customer));
  }

  /** get a customer by ID. */
  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         middle_name AS "middleName",
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );
    const customer = results.rows[0];
    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }
    return new Customer(customer);
  }

  /** get all reservations for this customer. */
  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /**get top ten customers with most res */
  static async getTopTenCustomerWithMostRes() {
    const results = await db.query(`
    SELECT COUNT(r.id) AS "times", c.id, c.first_name, c.last_name, c.phone, c.notes
      FROM customers AS c
      LEFT JOIN reservations AS r
      ON c.id = r.customer_id
      GROUP BY c.id
      ORDER BY times DESC
      LIMIT 10`);
    return results.rows.map(customer => {
      const topTenCustomer = new Customer({
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        notes: customer.notes,
      });
      topTenCustomer.times = customer.times;
      return topTenCustomer;
    });
  }

  /** save this customer. */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  /**get full name of a customer */
  get fullName() {
    if (!this.middleName) {
      this.middleName = "";
    }
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }

  /**find a customer from user's input */
  static async find(name) {
    const results = await db.query(
      `SELECT id, 
        first_name AS "firstName",  
        last_name AS "lastName", 
        middle_name AS "middleName",
        phone, 
        notes 
        FROM customers 
        WHERE first_name ILIKE '%' || $1 || '%' 
        OR last_name ILIKE '%' || $1 || '%' 
        OR middle_name ILIKE '%' || $1 || '%'`,
      [name]
    );
    const customers = results.rows;
    if (!customers[0]) {
      const err = new Error(`No such customer: ${name}`);
      err.status = 404;
      throw err;
    }
    return customers.map(customer => new Customer(customer));
  }
}

module.exports = Customer;