import authRouters from './auth';
import userRouters from './user';
import customerRouters from './customer';
import contractRouters from './contract';
const initRoutes = (app) => {
    app.use('/api/auth', authRouters)
    app.use('/api/user', userRouters)
    app.use('/api/customer', customerRouters)
    app.use('/api/contract', contractRouters)
    return app.use('/', (req, res) => {
        res.send('Server is running');
    })
}

export default initRoutes;