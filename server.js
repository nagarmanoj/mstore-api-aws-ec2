const bodyParser = require("body-parser");
const express = require("express");
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();
const dotenv = require("dotenv").config();
const logger = require('./utils/logger');
const PORT = process.env.PORT || 4000;
const responseTime = require('response-time');

const { restResponseTimeHistogram, startMetricsServer } = require("./utils/metrics");
const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");
const mediaRouter = require("./routes/mediaRoute");
const blogRouter = require("./routes/blogRoute");
const categoryRouter = require("./routes/productcategoryRoute");
const blogcategoryRouter = require("./routes/blogcategoryRoute");
const brandRouter = require("./routes/brandRoute");
const couponRouter = require("./routes/couponRoute");
const colorRouter = require("./routes/colorRoute");
const enqRouter = require("./routes/enqRoute");
const paymentRouter = require("./routes/paymentRoute");

const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");


app.use(morgan("dev"));
app.use(cors());
app.use('/public', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:false }));
app.use(cookieParser());
app.use("/api/user",authRouter);
app.use("/api/product",productRouter);
app.use("/api/media",mediaRouter);
app.use("/api/blog",blogRouter);
app.use("/api/category",categoryRouter);
app.use("/api/blogcategory", blogcategoryRouter);
app.use("/api/brand", brandRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/color", colorRouter);
app.use("/api/enquiry", enqRouter);
app.use("/api/payments",paymentRouter);

app.use(notFound);
app.use(errorHandler);

// app.use(responseTime((req, res, time) => {
//     if (req?.route?.path) {
//       restResponseTimeHistogram.observe(
//         {
//           method: req.method,
//           route: req.route.path,
//           status_code: res.statusCode,
//         },
//         time * 1000
//       );
//     }
//   })
// );
app.listen(PORT,async()=>{
    logger.info(`Server is running at http://localhost:${PORT}`);

    await dbConnect();

    

    //startMetricsServer();

});
