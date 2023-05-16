import dotenv from "dotenv";
process.env.NODE_ENV === "local" && dotenv.config();

import { Room } from "./schema";
import { User } from "./schema";
import express from "express";
import cors from "cors";
import NodeMediaServer from "node-media-server"
import mongoose, { ConnectOptions } from "mongoose";
import ApiError from "./src/helpers/api-error";
import type { ErrorRequestHandler, Handler } from "express";
import * as mockDataController from "./src/controllers/mock-data-controller";
import loadRoutes from "./src/routes";
import path from "path";

const config: any = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        allow_origin: '*'
    }
};

const nms = new NodeMediaServer(config)

// Middleware pour vérifiez si le stream demandé existe
// nms.on('prePlay', async (id, StreamPath, args) => {
//     const streamName = StreamPath.split("/")[2]
//     const session = nms.getSession(id) as any

//     const room = await Room.findOne({ views: streamName })
//     const user = await User.findOne({ views: streamName })
//     const streamExists = room || user

//     if (!streamExists)
//         session.reject()
// });

nms.run();

mongoose.connect(process.env.MONGO_URL as string, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASS,
    dbName: process.env.MONGO_DB_NAME
} as ConnectOptions);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("db connected"));

const app = express();
app.use(express.json());
app.use(cors());

// serve postman page intead if possible
// app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use("/api/resources", express.static(path.join(__dirname, process.env.NODE_ENV !== "local" ? ".." : "", "public")));

app.get("/api", ((req, res) => {
    res.send({ message: "Welcome to the Crakotte API!" });
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
if (process.env.NODE_ENV === "local" || process.env.NODE_ENV === "development") {
    mockDataController.insertIfNotExist();
}

export default app.listen(process.env.SERVER_PORT, function () {
    console.log(`Server running on port: ${this.address().port}`);
});
