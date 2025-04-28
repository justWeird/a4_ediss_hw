//middleware for determining which client type is calling the request: web or mobile
const clientValidation = (req, res, next) => {

    //CONDITION: The X-Client-Type header is mandatory. If not present, the caller shall receive a 400 error.

    //get the client header type
    const clientType = req.headers['x-client-type'] || req.headers['X-Client-Type'] || req.headers['x-Client-Type'];

    const blockedClientTypes = ['mobile', 'android', 'ios'];

    //if there's no client
    if (!clientType) {
        return res.status(401).json({error: 'Client type absent'});
    }

    if (blockedClientTypes.includes(clientType.toLowerCase())) {
        return res.status(401).json({error: 'Blocked client type: mobile'});
    }

    if (clientType.toLowerCase() !== 'web') {
        return res.status(401).json({error: 'Only web clients allowed'});
    }

    next();

}

module.exports = clientValidation;