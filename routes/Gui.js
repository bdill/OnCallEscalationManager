module.exports = function (app) {

    app.get('/', ensureAuthenticated, function (req, res) {
        res.render('layout', { user: req.user });
    });

    app.get('/Applications/:appName', ensureAuthenticated, function (req, res) {
        res.render('layout', { user: req.user });
    });

    app.get('/Applications/:appName/history', ensureAuthenticated, function (req, res) {
        res.render('layout', { user: req.user });
    });

    app.get('/failure', function (req, res, next) {
        res.render('layout', { user: req.user });
    });

    app.get('/partials/detail', ensureAuthenticated, function (req, res) {
        res.render('detail', { user: req.user });
    })

    app.get('/partials/failure', function (req, res, next) {
        res.render('failure', { user: req.user });
    })

    app.get('/partials/Index', ensureAuthenticated, function (req, res) {
        res.render('Index', { user: req.user });
    })

    app.get('/partials/history', ensureAuthenticated, function (req, res) {
        res.render('history', { user: req.user });
    })

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        console.log("Not authenticated. Redirecting to login page.");
        res.redirect('/login');
    }
};