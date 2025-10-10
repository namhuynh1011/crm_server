import authRouters from './auth';
import userRouters from './user';
const initRoutes = (app) => {
    app.use('/api/auth', authRouters)
    app.use('/api/user', userRouters)

    return app.use('/', (req, res) => {
        res.send('Server is running');
    })
}

export default initRoutes;