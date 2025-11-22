import authRouters from './auth';
import userRouters from './user';
import customerRouters from './customer';
import contractRouters from './contract';
import publicRouters from './public';
import contractBRouters from './contractB';
import requestRouters from './request';
import publicBRouters from './publicb';
import taskRouters from './task';
const initRoutes = (app) => {
    app.use('/api/auth', authRouters)
    app.use('/api/user', userRouters)
    app.use('/api/customer', customerRouters)
    app.use('/api/contract', contractRouters)
    app.use('/api/contractb', contractBRouters)
    app.use('/api/request', requestRouters);
    app.use('/api/public', publicRouters)
    app.use('/api/publicb', publicBRouters)
    app.use('/api/task', taskRouters);
    return app.use('/', (req, res) => {
        res.send(`Server is running. You requested: ${req.originalUrl} with method ${req.method}`);
    })
}

export default initRoutes;