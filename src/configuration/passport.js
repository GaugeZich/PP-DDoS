import { Strategy, ExtractJwt } from "passport-jwt";
import passport from "passport";
import { envs } from './envs.js'
import AppDatasource from "../providers/datasource.provider.js";

const repo = AppDatasource.getRepository('User');

const JWT_SECRET = envs.JWT_SECRET;

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
}

passport.use(
    new Strategy(opts, async (payload, done) => {
        try {
            const user = await repo.findOne({ where: { id: payload.id} })

            if(!user){
                return done(null,false);
            }

            return done(null, user)
        } catch (err) {
            return done(err, false)
        }
    })
);

export default passport;