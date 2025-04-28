//middleware for determining the validity of a JWT token based on certain parameters
const jwt = require('jsonwebtoken');

const jwtValidation = {

    validateJWT(req, res, next) {

        //get the authorization header from the request
        const authHeader = req.headers.authorization;

        //if the header is absent, return 401:
        //CONDITION: If the JWT token is not present, not valid, or doesn’t satisfy the conditions above,
        // the service must respond with status code 401.

        if (!authHeader) {
            return res.status(401).json({error: 'Missing authHeader in request'});
        }

        //just so I can see, what does an auth header look like
        console.log(authHeader);

        //if the header is present, split it and validate each section
        const token = authHeader.split(' ')[1];

        //use a try catch to validate the payload
        try {
            //decode the jwt token
            const base64Payload = token.split('.')[1];      //get the base 64 payload
            const decoded = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));

            //check the conditions for jwt validation
            //if there's no name in the subject or it doesn't match any of the expected values
            if (!decoded.sub || !['starlord', 'gamora', 'drax', 'rocket', 'groot'].includes(decoded.sub)) {
                return res.status(401).json({error: 'Invalid subject in token'});
            }

            //if there isn't an expiry field or if the expiry has passed. compare received date to current date
            if (!decoded.exp || new Date (decoded.exp * 1000) <= new Date()) {
                return res.status(401).json({error: 'Token expired'});
            }

            if (!decoded.iss || decoded.iss !== 'cmu.edu' ) {
                return res.status(401).json({error: 'Invalid issuer of token'});
            }

            req.user = decoded;
            next();

        } catch (error){
            return res.status(401).json({error: 'Invalid token '});    //return 401 based on condition
        }

    }

}

module.exports = jwtValidation