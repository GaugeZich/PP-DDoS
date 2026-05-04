import { Router } from "express";
import { validate } from "../../middlewares/validator.middlewares.js";
import { createUser } from "./schema/user.schema.js";
import { userController } from "./user.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const userRouter = Router(); // Cambié el nombre para ser consistente

/* userRouter.post('/user', validate(createUser), (req, res) => {         
    res.status(200).json({message: "validator user"});
}); */

userRouter.post('/user', validate(createUser), userController.register)

userRouter.post('/user/login', userController.login)

userRouter.get('/users', authMiddleware ,userController.findAll)

export default userRouter;