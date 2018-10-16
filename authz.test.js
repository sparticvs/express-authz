/**
 * Copyrgiht (c) 2018 - Charles `sparticvs` Timko, popebp.com
 **/
const authz = require('./authz.js');

// TODO Configuration will hold the anonymous access permissions via `default`.

/**
 * This needs some thought on how it will work...
 *
 * Permission grouping might be useful, but it should only be used as an alias
 * to an array of permissions. The groups would allow everyone to get
 * permission changes as they are created.
 **/
/**
const authz = require('./authz.js');

const AUTHZ_CONFIG = {
    default: ['page:read'],
    db: {
        type: 'json',
        instance: null,
    }
};

app.use(authz(AUTHZ_CONFIG));

app.get('/', authz.needs(['page:read']), (req, res) => {
    // Grant permissions to a user
    authz.grant('someOtherUser', ['page:write']);
    // Revoke a user's permissions
    authz.revoke('differentUser', ['page:read']);
    // Grant temporary permissions to a user
    authz.temp('admin', 3600, ['admin:elevated']);
    // Forcefully expire temporary permissions for a user
    authz.expire('admin');
});
**/

const AUTHZ_CONFIG = {
    default: ['page:read'],
    db: {
        type: 'json',
        instance: null,
    }
};

// Assumption: Username is a Unique value that can be used as a Key without
// other dat
var req = {};
var res = {};

beforeAll(() => {
    AUTHZ_CONFIG.db.instance = {
        'admin': ['page:*', 'admin:admin'],
        'multiClassUser': ['page:read', 'anotherPage:read'],
        'goodUser': ['page:read', 'page:write'],
        'badUser': ['page:write'],
        'wildcardUser': ['page:*'],
        'badEntitlements': [1, 2, 3],
        'badEntitlement': 123,
    };
    authz(AUTHZ_CONFIG);
});

beforeEach(() => {
    req['session'] = {};
    res = {
        body: "",
        code: 200,
        status: (code) => { res.code = code; return res; },
        send: (str) => { res.body = str; return res; },
        end: () => {}
    };
});

test('anonymous user accessing public page', () => {
    delete req.session['user'];
    const route = authz.needs();
    var nextCalled = false;
    
    route(req, res, () => { nextCalled = true; }); 
    
    //expect(res.code).toBe(200);
    expect(nextCalled).toBe(true);
});

test('anonymous user accessing public page using default entitlements', () => {
    delete req.session['user'];
    const route = authz.needs(['page:read']);
    var nextCalled = false;
    
    route(req, res, () => { nextCalled = true; }); 
    
    //expect(res.code).toBe(200);
    expect(nextCalled).toBe(true);
});

test('anonymous user accessing protected page', () => {
    delete req.session['user'];
    const route = authz.needs('protectedPage:read');
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    //expect(res.code).toBe(401);
    //expect(res.body).toBe('Unauthorized');
    expect(nextCalled).toBe(false);
});

test('accessing a public page as user', () => {
    req.session['user'] = 'goodUser';
    const route = authz.needs();
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    //expect(res.code).toBe(200);
    expect(nextCalled).toBe(true);
});

test('user with correct entitlements accessing a protected page', () => {
    req.session['user'] = 'goodUser';
    const route = authz.needs('page:read');
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    //expect(res.code).toBe(200);
    expect(nextCalled).toBe(true);
});

test('user with wrong entitlements accessing a protected page', () => {
    req.session['user'] = 'badUser';
    req.session.entitlements = ['page:write'];
    const route = authz.needs('page:read');
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    //expect(res.code).toBe(401);
    //expect(res.body).toBe('Unauthorized');
    expect(nextCalled).toBe(false);
});

test('user with many entitlements, in the same object class', () => {
    req.session['user'] = 'goodUser';
    const route = authz.needs('page:read');
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    //expect(res.code).toBe(200);
    expect(nextCalled).toBe(true);
});

test('user with many entitlements, in different object classes', () => {
    req.session['user'] = 'multiClassUser';
    const route = authz.needs('page:read');
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    //expect(res.code).toBe(200);
    expect(nextCalled).toBe(true);
});

test('user with wildcard entitlements making a legal access', () => {
    req.session['user'] = 'wildcardUser';
    const route = authz.needs('page:read');
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    //expect(res.code).toBe(200);
    expect(nextCalled).toBe(true);
});

test('user with wildcard entitlements making an illegal access', () => {
    req.session['user'] = 'wildcardUser';
    const route = authz.needs('admin:admin');
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    //expect(res.code).toBe(401);
    //expect(res.body).toBe('Unauthorized');
    expect(nextCalled).toBe(false);
});

test('user with less entitlements than required', () => {
    req.session['user'] = 'badUser';
    const route = authz.needs(['page:write', 'page:delete']);
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
});

test('user with wildcard on page with many needs', () => {
    req.session['user'] = 'wildcardUser';
    const route = authz.needs(['page:read', 'page:delete']);
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
});

test('user with single wildcard and additional entitlement', () => {
    req.session['user'] = 'admin';
    const route = authz.needs(['page:read', 'page:delete', 'admin:admin']);
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
});

test('page with additional need outside wildcard', () => {
    req.session['user'] = 'wildcardUser';
    const route = authz.needs(['page:read', 'page:delete', 'admin:admin']);
    var nextCalled = false;

    route(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
});

test('wrong format of the needed entitlements, numbers', () => {
    req.session['user'] = 'wildcardUser';
    const route = authz.needs(123);
    var exception = false;
    try {
        route(req, res, () => { });
    } catch (e) {
        exception = true;
    }
    
    expect(exception).toBe(true);
});

test('wrong format of the needed entitlements, string', () => {
    req.session['user'] = 'wildcardUser';
    const route = authz.needs('something');
    var exception = false;
    try {
        route(req, res, () => { });
    } catch (e) {
        exception = true;
    }

    expect(exception).toBe(true);
});

test('wrong data type of session entitlements, array of nums', () => {
    req.session['user'] = 'badEntitlements';
    const route = authz.needs(['page:read']);
    var exception = false;
    try {
        route(req, res, () => { });
    } catch (e) {
        exception = true;
    }

    expect(exception).toBe(true);
});

test('wrong data type of session entitlements, numbers', () => {
    req.session['user'] = 'badEntitlement';
    const route = authz.needs(['page:read']);
    var exception = false;
    try {
        route(req, res, () => { });
    } catch (e) {
        exception = true;
    }

    expect(exception).toBe(true);
});
