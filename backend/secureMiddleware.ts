import { Request, Response, NextFunction } from "express";
import { getUserById } from "./database";

export async function secureMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.user) {
        const freshUser = await getUserById(req.session.user._id!.toString());
        if (freshUser) {
            delete freshUser.passwordHash;
            req.session.user = freshUser;
            res.locals.user = freshUser;
        }
        next();
    } else {
        res.redirect("/login");
    }
}