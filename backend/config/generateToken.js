const jwt = require('jsonwebtoken');
const JwtKey = 'e-comm';
const generateToken = (id) => {
    return jwt.sign({ id }, JwtKey, {
        expiresIn : "30d",
    });
};

module.exports = generateToken;