import authRouters from './auth';

const initRoutes = (app) => {
    app.use('/api/auth', authRouters)

    return app.use('/', (req, res) => {
        res.send('Server is running');
    })
}

export default initRoutes;