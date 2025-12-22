import type { NextFunction, Request } from "express";
import type { ObjectSchema } from "joi";
import type { BaseResponse } from "../interfaces";

const validate =
    <TSchema = unknown>(schema: ObjectSchema<TSchema>) =>
    (req: Request, res: BaseResponse, next: NextFunction) => {
        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                ok: false,
                error: error.message,
            });
        }

        next();
    };

export default validate;