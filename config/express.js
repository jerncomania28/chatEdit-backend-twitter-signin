var express = require("express"),
    morgan = require("morgan"),
    passport = require("passport"),
    cors = require("cors"),
    methodOverride = require("method-override"),
    // path = require("path"),
    routers = require("./routers");

module.exports = () => {

    var app = express();    

    app.use(express.json());
    app.use(express.urlencoded({
        extended: true
    }));
    app.use(cors());
    app.use(morgan("dev"));
    app.use(methodOverride());

    app.use(passport.initialize());
    // app.use(passport.session());

    routers.map(router => {
        if (router === "auth") app.use(`/${router}`, require(`../routers/${router}.router`));
        else app.use(`/api/${router}`, require(`../routers/${router}.router`));
    });

    // app.use(express.static(path.resolve(__dirname, "../views")));
    // app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "../views", "index.html")));

    return app;
}