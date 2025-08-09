import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose, { ConnectOptions } from "mongoose";
import ApiError from "./src/helpers/api-error";
import type { ErrorRequestHandler, Handler } from "express";
import * as mockDataController from "./src/controllers/mock-data-controller";
import loadRoutes from "./src/routes";
import path from "path";
import { activityChecker } from "./src/jobs/activity-checker";

mongoose.connect(process.env.MONGO_URL as string, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASS,
    dbName: process.env.MONGO_DB_NAME
} as ConnectOptions);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("db connected");
    // Démarrer le job de vérification d'activité après la connexion à la DB
    activityChecker.start();
});

const app = express();

// Middleware JSON pour toutes les autres routes
app.use(express.json());
app.use(cors());

// serve postman page intead if possible
// app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use("/api/resources", express.static(path.join(__dirname, process.env.NODE_ENV !== "local" ? ".." : "", "public")));

app.get("/api", ((req, res) => {
    res.send({ message: "Welcome to the CookEat API!" });
}) as Handler);

loadRoutes(app, express.Router());

// handle the 404 errors
app.use(((req, res, next) => {
    return next(new ApiError("Route not found", 404));
}) as Handler);

// handle all other kinds of error
app.use(((err, req, res, next) => {
    console.log("\x1b[31m", err);
    res.status(err.status || 500).send({
        message: err.message
    });
}) as ErrorRequestHandler);

// INSERT ALL MOCK DATA HERE
// if (process.env.NODE_ENV === "local" || process.env.NODE_ENV === "development") {
//     mockDataController.insertIfNotExist();
// }

export default app.listen(process.env.SERVER_PORT, function () {
    console.log(`Server running on port: ${this.address().port}`);
});
