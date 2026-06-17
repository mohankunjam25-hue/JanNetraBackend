const { Router } = require("express");
const { createReport } = require("../controllers/report.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = Router();

router.use(verifyJWT);

router.route("/").post(createReport);

module.exports = router;
