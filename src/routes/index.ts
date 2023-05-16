import { Application, Router } from "express";
import fs from "fs";
import { RouteType } from "../../types";
import { authenticateJWT } from "../jwt";

const isPublic = (url: string) => {
    let res = false;
    ["sign", "reset", "request-password", "views", "videos"].forEach(endpoint => {
        if (url.includes(endpoint)) res = true;
    });
    return res;
};

export default (app: Application, router: Router) => {
    // read the files of the current directory
    fs.readdirSync(__dirname)
        .filter((filename: string) => !/index\.(ts|js)$/.test(filename))// avoid index file
        .forEach((filename: string) => {
            // load routes array and register them
            import("./" + filename).then((routes) => {
                routes.default.forEach((r: RouteType) => {
                    const funcs = [];
                    if (!isPublic(r.url))
                        funcs.push(authenticateJWT)

                    Array.isArray(r.func)
                        ? funcs.push(...r.func)
                        : funcs.push(r.func);

                    router[r.method](r.url, funcs);
                });
            })
        });
    app.use("/api/", router);
};
