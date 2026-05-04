import passport from "../configuration/passport.js";

function authMiddleware(req,res, next) {
    return passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err || !user){
            return res.status(401).json({message: 'Unauthorized'});
        }
        req.user = user;
        next();
    })(req, res, next);
}

export default authMiddleware;