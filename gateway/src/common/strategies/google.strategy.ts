import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { Profile } from 'passport'
import { Injectable } from "@nestjs/common";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['profile', 'email']
        })
    }

    validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback
    ) {
        if (!profile.emails?.length) return done(null);

        const user = {
            username: profile.emails?.[0].value.split("@")[0],
            email: profile.emails?.[0].value,
        };

        done(null, user);
    }
}