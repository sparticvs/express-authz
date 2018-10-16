# express-authz

## notice

this module is currently under development. it is not recommended for
production systems at this time.

## about

express-authz is an authorization middleware module designed for express.js.
this uses a role-base access control system and works in conjunction with
an authorization middleware to provide a secure and simple interface for
express.js-based implementations.

## dependencies

currently this is minimal, but will eventually include sequelize and other
orms as folks complain abotu their system...

## role-based access controls

express-authz's rbac design follows the following format checking against
entitlements: `object:function`, where an 'object' is any string, and
'function' would be something like, create, read, update, or delete. The
'function' can be anything really, but remember that wildcarding (`*`) is
permitted.

create => POST
read => GET
update => PUT
delete => DELETE

express-authz checks against `req.session.user` for an
authenticated user. when a user is unauthenticated, this authorization
middleware will set `req.session.entitlements = []`.

for more information about how entitlements is populated, please see the
express-authn middleware.

## use

this example assumes that there is an authentication middleware being used tha
will set `req.session.user`. if you are looking for a middleware, we suggest
`express-authn`.

```
var express = require('express');
var authz = require('express-authz');
/* and some authentication middleware */
var app = express();

/* the authentication middleware must come before this middleware */
app.use(authz());

app.get('/login', function(req, res) {
    // login panel isn't sensitive
});

app.get('/admin/dashboard', authz.needs('admin:read'), function(req, res) {
    // admin dashboard is sensitive, we want to make sure that the entitlements
are correct.
});

app.post('/admin/newUser', authz.needs('admin:create'), function(req, res) {
    // create a new user account
});
```

## authz\_config

this will configure this middleware to understand where it will be obtaining
the entitlements.

supported sources: sequelize, json

## api

### `authz(config)`

Intializes the Authorization Middleware Singleton with the Configuration
Provided.

### `authz.needs(entitlements)`

Enforces the entitlements provided as the required set in order to access an
end-point.

### `authz.grant(user, entitlements)`

Gives the user the additional entitlements. Returns a promise.

### `authz.revoke(user, entitlements)`

Takes away entitlements from a user. Returns a promise.

### `authz.revokeNow(user, entitlements)`

Does the same thing as `authz.revoke` but will block execution until the
entitlements are certain to have been removed.

### `authz.temp(user, timeout, entitlements)`

Grants temporary entitlements to a user for the timeout period. This is an
effective method for briefly elevating privileges to administrator, and
ensuring they will be properly downgraded in the future. The intent is to
protect the user from dangerous actions that might be successful with cleverly
crafted Cross-Site Request Forgeries. This returns a Promise and there is no
way around that; this is 100% intentional, as it will help to protect against
the concerns noted in the Security Note.

Security Note: Entitlements should never be granted in the same request as they
are issued. The reason for this is that it would defeat the purpose of this
mechanism and enable poor design.

### `authz.expire(user)`

Automatically expire all temporary permissions for a user. This is not
selective. Returns a promise.

### `authz.expireNow(user)`

Same as `authz.expire` but will block further execution until the expiration
has been completed.

## audit logging

an audit log is created in the output of the server. this is critical, as it
will provide the "who, what, where, and when."

## security assumptions

it is assumed that the authentication middleware is providing the
`req.session.user` variable and ensuring that there are no conflicts
with its insertion. it is left to this api-user to ensure that the
authentication middleware is inserted (via `app.use`) prior to authorization
middleware being inserted. this will prevent errors in order of operations.

## license

see license.md

## support

see support.md

## vulnerability disclosure policy

see vulnpolicy.md
