//middleware for determining which client type is calling the request: web or mobile
const clientValidation = (req, res, next) => {

    //CONDITION: The X-Client-Type header is mandatory. If not present, the caller shall receive a 400 error.

    //get the client header type
    const clientType = req.headers['x-client-type'] || req.headers['X-Client-Type'] || req.headers['x-Client-Type'];

    //if there's no client
    if (!clientType) {
        return res.status(401).json({error: 'Client type absent'});
    }

    // For Mobile BFF, only accept iOS and Android client types
    // Convert to lowercase for case-insensitive comparison
    const clientTypeLower = clientType.toLowerCase();

    // For Mobile BFF, accept iOS, Android, and mobile client types
    if (clientTypeLower === 'ios' || clientTypeLower === 'android' || clientTypeLower === 'mobile') {
        // Valid client type, proceed
        next();
    } else {
        return res.status(401).json({error: 'Invalid client type for Mobile BFF'});
    }
}

module.exports = clientValidation;