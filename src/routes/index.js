import authRouters from './auth';
import userRouters from './user';
import customerRouters from './customer';
import contractRouters from './contract';
import publicRouters from './public';
import contractBRouters from './contractB';
const initRoutes = (app) => {
    app.use('/api/auth', authRouters)
    app.use('/api/user', userRouters)
    app.use('/api/customer', customerRouters)
    app.use('/api/contract', contractRouters)
    app.use('/api/contractB', contractBRouters)
    app.use('/api/public', publicRouters)
    return app.use('/', (req, res) => {
        res.send('Server is running');
    })
}

export default initRoutes;