/**
 * Copyright (c) 2018 - Charles `sparticvs` Timko, popebp.com
 *
 * See license.md for License
 **/
'use strict';

function parseEntitlementsString(ents) {
    const entsRegex = /^[A-Za-z0-9_-]+:([A-Za-z0-9_-]+|\*)$/;

    if(Array.isArray(ents)) {
        let parsedObj = {};
        ents.map(function(ent) {
            let newEnts = parseEntitlementsString(ent);
            Object.keys(newEnts).map(function(newEnt) {
                if(Array.isArray(parsedObj[newEnt])) {
                    parsedObj[newEnt].push(newEnts[newEnt][0]);
                } else {
                    parsedObj[newEnt] = newEnts[newEnt];
                }
            });
        });
        return parsedObj;
    } else if(typeof(ents) === 'string') {
        if(!entsRegex.test(ents)) {
            throw "Entitlement " + ents + " does not match the format"; 
        }
        // Split the string
        const split = ents.split(':');
        let parsedObj = {};
        parsedObj[split[0]] = [ split[1] ];

        return parsedObj;
    } else {
        throw "Entitlements are not of the correct data types";
    }
}

class Authz {
    constructor(config) {
        this.config = config;

        // TODO check the configuration has the minimum legal parameters
    }

    _getJsonEntitlements(user) {
        if(this.config.db.instance.hasOwnProperty(user)) {
            return this.config.db.instance[user];
        } else {
            return this.config.default;
        }
    }

    getEntitlements(user) {
        if(this.config.db.type === 'json') {
            return this._getJsonEntitlements(user);
        }

        throw new Error("Unsupported Database Type");
    }

}

let _authz = null;

function authz(config) {
    if(null != _authz) {
        console.warn("express-authz was already initialized");
    } else {
        _authz = new Authz(config);
        console.log('initializing express-authz');
    }
    return function(req, res, next) {
        next();
    }
}

// TODO Move the Type checking of the Entitlements into the parent, this will
// prevent extra testing during runtime, and only during compiling. This should
// also make testing the "jest" way easier.
authz.needs = function(entitlements) {
        return function(req, res, next) {
            let userEnts = null;
            let epEnts = null;
            if(typeof(req.session.user) === 'string' || req.session.user === undefined) {
                userEnts = parseEntitlementsString(_authz.getEntitlements(req.session.user));
            } else {
                throw 'Authenticated User is not a String. Are you using express-authn?';
            }

            if(typeof(entitlements) === 'string' || Array.isArray(entitlements)) {
                epEnts = parseEntitlementsString(entitlements);
            } else {
                if(entitlements === undefined) {
                    return next();
                }
                throw 'Entitlments for the "needs" are the incorrect data type.';
            }

            let result = true;
            // For each required entitlement, the user must have it
            Object.keys(epEnts).map(function(entitlement) {
                // This doesn't ultimately work... each item in the array needs to
                // be checked
                if(Array.isArray(userEnts[entitlement])) {
                    if(userEnts[entitlement].includes('*')) {
                        result &= true;
                    } else {
                        epEnts[entitlement].map(function(epEnt) {
                            result &= userEnts[entitlement].includes(epEnt);
                        });
                    }
                } else {
                    result = false;
                }
            });

            if(result) {
                return next();
            } else {
                return res.status(401).send('Unauthorized').end();
            }
        };
}

authz.grant = function(user, entitlements) {
}

authz.revoke = function(user, entitlements) {
}

authz.revokeNow = function(user, entitlements) {
}

authz.temp = function(user, timeout, entitlements) {
}

authz.expire = function(user) {
}

authz.expireNow = function(user) {
}

module.exports = authz;
