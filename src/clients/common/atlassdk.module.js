angular.module('atlassdk', [
	])

    .config([function () {
    }])

    .constant('atlasServiceTypes', {
        'appsettings': {
            operations: [],
        },
        'identity': {
            operations: [],
        }
    })

    .factory('atlasLogin', [function atlasLogin() {
        var clientAppId = null;

        var service = {
            getClientId: getClientId,
            setClientId: setClientId,
            authorize: authorize,
            logout: logout,
        };
        return service;

        function throwError(msg) {
            throw new Error(msg);
        }

        function getClientId() {
            // Gets the client identifier that will be used to request authorization.
            // You must call setClientId before calling this function.
            clientAppId == null && throwError('client id is not set.');
            return clientAppId;
        }
        function setClientId(appId) {
            // Sets the client identifier that will be used to request authorization.
            // You must call this function before calling authorize.
            typeof appId != "string" && throwError('client id should be string');
            clientAppId = appId;
        }

        function authorize(options, next) {
            // Requests authorization according to options then redirects or calls next.
            // Depending on the options set,
            //      - a popup window will open to allow the user to login, or
            //      - the window will redirect to the login page.
            // You must call setClientId prior to calling authorize.
            // You must call authorize prior to calling retrieveProfile.
            //
            // options can contain the following properties:
            // * interactive - (String) Specifies to when to show a login screen to the user.  Defaults to auto.
            //      auto    will attempt to use a cached token.
            //              If the cached token fails or does not exist, the user will be presented with a login screen.
            //      always  does not use the cached token and always presents a login screen
            //      never   will used the cached token; if the token does not work, authorize will return invalid_grant.
            // * popup - (Boolean) true to use a popup window for login, false to redirect the current browser
            //              window to the authorization dialog. Defaults to true. If false, the next parameter MUST be a
            //              redirect URL.
            // * response_type - (String) The grant type requested. Defaults to token. Specify
            //      token   to request an Implicit grant or
            //      code    to request an Authorization Code grant.
            // * scope - required - (String or Array[String]) The access scope requested. Must be profile,
            //      profile:user_id, postal_code, or some combination.
            // * state - (String) A state parameter. An opaque value used by the client to maintain state between
            //      this request and the response. The Login with Atlas authorization service will include this value
            //      when redirecting the user back to the client. It is also used to prevent cross-site request forgery.
            // * next (Function or String) A URI to redirect the browser response, or a JavaScript function to call
            //      with the authorization response

            arguments.length != 2 && throwError('authorize expects two arguments (options, next)');
            clientAppId == null && throwError('client id is not set');
            /*
            options && "object" != typeof options && v("authorize expects options parameter to be an object");
        	next != h && ("function"!=typeof next && "string"!=typeof next) && v("authorize expects next parameter to be a function or a string");
        	var c = aa({
        		interactive: $.i,
        		popup:g,
        		response_type:"token",
        		response_mode:f,
        		direct_post_uri:f,
        		state:f,
        		scope:f,
        		scope_data:f
        	}, options || {});
        	x("options.response_type", c.response_type, "string");
        	c.scope || v("missing options.scope");
        	c.scope.constructor !== Array && "string" != typeof c.scope && v("expected options.scope to be a string or array");
        	c.scope = new p(c.scope);
        	c.response_mode && x("options.response_mode", c.response_mode,"string");
        	c.direct_post_uri && x("options.direct_post_uri", c.direct_post_uri,"string");
        	c.scope_data && (c.scope_data=ja(c.scope_data));
        	c.interactive==h
        		? c.interactive = $.i
        		: c.interactive != $.i
        			&& (c.interactive != $.ALWAYS && c.interactive != $.NEVER)
        			&& v("expected options.scope to be one of '" + $.i + "', '" + $.ALWAYS + "', or '" + $.NEVER + "'");
        	var a=c, d=new Ja(a), c=d.a;
        	d.o(Z.A);
        	if (next!=h)
        		c.onComplete(next);
        	a.popup
        		? Ha(d)
        		: ("string"!=typeof next && v("next must be redirect URI if !options.popup"),d=Ba(a,M(next+""),h).toString(),window.top.location.href=d);
        	return c
            */

        }

        function logout() {
            // Logs out the current user after a call to authorize.
        }

        function retrieveProfile(accessToken, callback) {
            // Retrieves the customer profile and passes it to a callback function.
            // Uses an access token provided by authorize.
            // Parameters:
            // * accessToken - optional - (String) An access token. If this parameter is omitted, retrieveProfile
            //      will call authorize, requesting the profile scope.
            // * callback: Called with the profile data or an error string.
            //      response
            //      * success - (Boolean) true if the request was successful, otherwise false.
            //      * error - (String) Included if the request failed, and contains an error message
            //      * profile - (Object) Included if the request was successful, and contains profile information
            //          * CustomerId - (String) An identifier that uniquely identifies the logged-in user for this caller. Only
            //              present if the profile or profile:user_id scopes are requested and granted.
            //          * Name - (String) The customer's name. Only present if the profile scope is requested and granted.
            //          * PostalCode - (String) The postal code of the customer's primary address. Only present if the
            //              postal_code scope is requested and granted.
            //          * PrimaryEmail - (String) The primary email address for the customer. Only present if the
            //              profile scope is requested and granted.
        }
    }])

    .factory('atlasConfig', [function atlasConfig() {
        var defaults = this.defaults = {
            /* the region for requests */
            region: 'azure',
            /* the credentials object that contains authentication keys */
            credentials: null,
            /* whether SSL is enabled or not */
            sslEnabled: true,
            /* the number of retries for a request */
            maxRetries: 3,
            /* a logger object to write debug information to. Set to console to get logging information about service requests. */
            logger: null,
        };

        return {
            defaults: defaults,
            create: create,
        };

        function create(options) {
            return angular.extend({}, defaults, options);
        }
    }])

    .factory('atlasServiceFactory', ['atlasServiceTypes', 'atlasConfig', 'atlasRequest', function atlasServiceFactory(atlasServiceTypes, atlasConfig, atlasRequest) {
        var factory = {
            create: create,
        };
        for (var type in atlasServiceTypes) {
            var metadata = atlasServiceTypes[type];
            factory[type] = createFactoryMethod(type, metadata)
        }
        return factory;

        function createFactoryMethod(type, metadata) {
            return function(options) {
                return create(type, metadata, options);
            };
        }

        function create(type, metadata, options) {
            var service = {};
            service.config = atlasConfig.create(options);
            attachOperations(service, metadata.operations);
            return service;
        }

        function attachOperations(service, operations) {
            for (var operation in operations) {
                if (!service[operation]) {
                    service[operation] = createOperationFunction(operation);
                }
            }
        }

        function createOperationFunction(operation) {
            return function(params, success, error, notify) {
                params = params || {};
                return makeRequest(operation, params, success, error, notify);
            };
        }

        function makeRequest(operation, params, success, error, notify) {
            var request = atlasRequest.create(operation, params);
            if (success || error) {
                request.then(success, error, notify);
            }
            return request;
        }
    }])

    .factory('atlasRequest', ['$q', function ($q) {
        return {
            create: create
        };

        function create(operation, params) {
            var deferred = $q.defer();
            deferred.resolve('result data');
            return deferred.promise;
        }
    }])

    .provider('atlas', [function atlasProvider() {
        var services = [];

        this.attachService = function(identifier, type, options) {
            services.push({ identifier: identifier, type: type, options: options });
        }

        this.$get = ['atlasConfig', 'atlasServiceTypes', 'atlasServiceFactory', function atlasFactory(atlasConfig, atlasServiceTypes, atlasServiceFactory) {
            var atlas = {
                config:  atlasConfig.defaults,
            };
            if (angular.isArray(services) && services.length) {
                for (var identifier in services) {
                    var item = services[identifier];
                    for (var type in atlasServiceTypes) {
                        if (item.type == type) {
                            atlas[identifier] = serviceFactoryMethod(item.type, atlasServiceTypes[type], item.options);
                            break;
                        }
                    }
                    if (!atlas[identifier])
                        throw new Error('atlas.$get: invalid service type ' + item.type);
                }
            }
            else {
                for (var type in atlasServiceTypes) {
                    atlas[type] = serviceFactoryMethod(type, atlasServiceTypes[type], {});
                };
            }
            return atlas;

            function serviceFactoryMethod(type, metadata, setupOptions) {
                return function serviceFactory(userOptions) {
                    var options = angular.extend({}, userOptions, setupOptions);
                    return atlasServiceFactory.create(type, metadata, options);
                }
            }
        }];
    }])
