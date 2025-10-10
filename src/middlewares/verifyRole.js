// middleware/verifyRole.js
const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({ err: 1, msg: 'User role not found!' });
        }
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ err: 1, msg: 'You do not have permission!' });
        }
        next();
    };
};
export default verifyRole;