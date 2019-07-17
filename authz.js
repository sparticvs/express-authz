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



// FIXME EntitlementsConnector might be a more accurate name for this class
class Authz {

    constructor(config) {
        this.config = config;

        // TODO check the configuration has the minimum legal parameters
        
        this.connector = {
            'json': {
                getEntitlements: this._getJsonEntitlements.bind(this),
                insertEntitlement: this._insertJsonEntitlement.bind(this),
                removeEntitlement: this._removeJsonEntitlement.bind(this)
            },
        };
    }

    _getJsonEntitlements(user) {
        if(this.config.db.instance.hasOwnProperty(user)) {
            return this.config.db.instance[user];
        } else {
            return this.config.default;
        }
    }

    _insertJsonEntitlement(user, entitlement) {
        if(!(entitlement in this.config.db.instance[user])) {
            this.config.db.instance[user].push(entitlement);
        }
    }

    _removeJsonEntitlement(user, entitlement) {
    }


    /**
     * Should return an Array of entitlements in the entitlement format
     */
    getEntitlements(user) {
        return this.connector[this.config.db.type].getEntitlements(user);
    }

    insertEntitlement(user, entitlement) {
        return this.connector[this.config.db.type].insertEntitlement(user, entitlement);
    }

    removeEntitlement(user, entitlement) {
        return this.connector[this.config.db.type].removeEntitlement(user, entitlement);
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
    if(null === _authz) {
        throw new Error('express-authz was not initialized yet. make sure to call `authz()`');
    }

    return function(req, res, next) {
        let userEnts = null;
        let epEnts = null;
        if(typeof(req.session.user) === 'string' || req.session.user === undefined) {
            userEnts = parseEntitlementsString(_authz.getEntitlements(req.session.user));
        } else {
            throw 'Authenticated User is not a String. Are you using express-authn?';
        }

        // TODO This can be move outside this anon function
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
    if(null === _authz) {
        throw new Error('express-authz was not initialized yet. make sure to call `authz()`');
    }

    // 1. Validate the argument types are expected
    // 2. Return a Promise to execute the Authz.grant
}

authz.revoke = function(user, entitlements) {
    if(null === _authz) {
        throw new Error('express-authz was not initialized yet. make sure to call `authz()`');
    }

}

authz.revokeNow = function(user, entitlements) {
    if(null === _authz) {
        throw new Error('express-authz was not initialized yet. make sure to call `authz()`');
    }

}

authz.temp = function(user, timeout, entitlements) {
    if(null === _authz) {
        throw new Error('express-authz was not initialized yet. make sure to call `authz()`');
    }

}

authz.expire = function(user) {
    if(null === _authz) {
        throw new Error('express-authz was not initialized yet. make sure to call `authz()`');
    }

}

authz.expireNow = function(user) {
    if(null === _authz) {
        throw new Error('express-authz was not initialized yet. make sure to call `authz()`');
    }

}

module.exports = authz;
