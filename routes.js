/** Routes for Lunchly */
const express = require("express");
const Customer = require("./models/customer");
const Reservation = require("./models/reservation");
const router = new express.Router();

/** Homepage: show list of customers. */
router.get("/", async function (req, res, next) {
  try {
    const customers = await Customer.all();
    return res.render("customer/list.html", { customers });
  } catch (err) {
    return next(err);
  }
});

/** Form to add a new customer. */
router.get("/add/", async function (req, res, next) {
  try {
    return res.render("customer/newForm.html");
  } catch (err) {
    return next(err);
  }
});

/** Show the top ten with most res */
router.get("/top-ten/", async function (req, res, next) {
  try {
    const customers = await Customer.getTopTenCustomerWithMostRes();
    return res.render("customer/topTen.html", { customers });
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new customer. */
router.post("/add/", async function (req, res, next) {
  try {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phone = req.body.phone;
    const notes = req.body.notes;

    const customer = new Customer({ firstName, lastName, phone, notes });
    await customer.save();

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

/** Show a customer, given their ID. */
router.get("/:id/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);
    const reservations = await customer.getReservations();

    return res.render("customer/detail.html", { customer, reservations });
  } catch (err) {
    return next(err);
  }
});

/** Show form to edit a customer. */
router.get("/:id/edit/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);

    res.render("customer/editForm.html", { customer });
  } catch (err) {
    return next(err);
  }
});

/** Handle editing a customer. */
router.post("/:id/edit/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);
    customer.firstName = req.body.firstName;
    customer.lastName = req.body.lastName;
    customer.phone = req.body.phone;
    customer.notes = req.body.notes;
    await customer.save();
    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new reservation. */
router.post("/:id/add-reservation/", async function (req, res, next) {
  try {
    const customerId = req.params.id;
    const startAt = new Date(req.body.startAt);
    const numGuests = req.body.numGuests;
    const notes = req.body.notes;
    const reservation = new Reservation({
      customerId,
      startAt,
      numGuests,
      notes,
    });
    await reservation.save();
    return res.redirect(`/${customerId}/`);
  } catch (err) {
    return next(err);
  }
});

/**Search customer by name */
router.post("/search/", async function (req, res, next) {
  try {
    const name = req.body.name;
    const customers = await Customer.find(name);
    return res.render("customer/searchResults.html", { customers });
  } catch (err) {
    return next(err);
  }
});

/**Show reservation detail */
router.get("/edit-reservation/:id", async function (req, res, next) {
  try {
    const reservation = await Reservation.get(req.params.id);
    const customer = await Customer.get(reservation.customerId);
    return res.render("reservation/editForm.html", { reservation, customer });
  } catch (err) {
    return next(err);
  }
});

/**Edit reservation  */
router.post("/edit-reservation/:id", async function (req, res, next) {
  try {
    const reservation = await Reservation.get(req.params.id);
    reservation.numGuests = req.body.numGuests;
    reservation.startAt = new Date(req.body.startAt);
    reservation.notes = req.body.notes;
    await reservation.save();

    const customer = await Customer.get(reservation.customerId);

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
