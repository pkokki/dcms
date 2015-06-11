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

    .factory('atlasLoginWindow', ['$window', function atlasLoginWindow($window) {
        var IDS_SCHEME = 'https';
        var IDS_SCHEME = 'https';
        var _win = null;

        var service = {
            popup: popup,
            go: go,
        };
        return service;

        function go(options, next) {
            var location = prepareLocationUrl(options, parseUri(next + '')).toString();
            //$window.top.location.href = location;
            $window.location.replace(location);
        }

        function popup(request) {
            var nextUri = ta(function(b) {
                if (_win && typeof _win.close == 'function') {
                    _win.close();
                    _win = null;
                }
                Fa(request, b, g)
            });
            var url = prepareLocationUrl(request.options, nextUri, b);
            var popupName = 'atlasLoginPopup';
            var popupWidth = 760;
            var popupHeight = 540;
            var popupLeft = ($window.screenX !== void 0 ? $window.screenX : $window.screenLeft)
                + Math.floor((($window.outerWidth !== void 0 ? $window.outerWidth : $window.document.documentElement.clientWidth) - popupWidth) / 2);
            var popupTop = ($window.screenY !== void 0 ? $window.screenY : $window.screenTop)
                + Math.floor((($window.outerHeight !== void 0 ? $window.outerHeight : $window.document.documentElement.clientHeight)- popupHeight) / 2);


            var specs = 'left=' + (popupLeft < 0 ? 0 : popupLeft) + ',top=' + (popupTop < 0 ? 0 : popupTop) + ',width=' + popupWidth + ',height=' + popupHeight + ',location=1,scrollbars=1';
            _win = $window.open(url.toString(), popupName, specs);
        }


        function prepareLocationUrl(options, nextUri, exac) {
            params = {
                client_id: options.clientAppId,
                redirect_uri: nextUri,
                response_type: options.response_type,
                scope: options.scope.toString(),
                language: options.language,
                ui_locales: options.languageHint
            };

            if (options.response_mode)
                params.response_mode = options.response_mode;
            if (options.direct_post_uri)
                params.direct_post_uri = options.direct_post_uri;
            if (options.scope_data)
                params.scope_data = options.scope_data;
            if (options.state)
                params.state = options.state;
            if (exac)
                params.exac = exac;
            return new Url('http', 'atlasV5.azurewebsites.net', null, '/id', params, null);
        }

        function encodeURIComponents(obj) {
            var qs = '';
            for (var key in obj) {
                if (qs) qs += '&';
                qs += $window.encodeURIComponent(key) + '=' + $window.encodeURIComponent(obj[key] + '');
            }
            return qs;
        }

        function parseUri(uri) {
        	var div = window.document.createElement("div");
        	div.innerHTML="<a></a>";
        	div.firstChild.href = uri;
        	div.innerHTML = div.innerHTML;
        	var anchor = div.firstChild;
        	if (anchor.host == '')
        		anchor.href = anchor.href;
        	var port = anchor.port;
        	if (!port || port == '0')
        		port = null;
        	var path = anchor.pathname;
        	if (path)
        		if (path[0] != '/')
        			path = '/' + path;
        	else
        		path = '/';
        	return new Url(anchor.protocol, anchor.hostname, port, path, anchor.search.substring(1), anchor.href.split('#')[1] || '');
        }

        function Url(protocol, hostname, port, path, query, fragment) {
        	var matches;
        	if (typeof(protocol) != 'string' || !(matches = protocol.match(/^(https?)(:(\/\/)?)?$/i)))
        		throwError('missing or invalid scheme: ' + protocol);
        	var _scheme = (matches[1] == 'http') ? 'http' : 'https';

        	if (typeof(hostname) != 'string' || !hostname.match(/^[\w\.\-]+$/))
        		throwError('missing or invalid host: ' + hostname);
        	var _host = hostname;

        	if (port) {
        		if (!(port + '').match(/^\d+$/))
        			throwError('invalid port: ' + port);
        		if ((port == 80 && _scheme == 'http') || (port == 443 && _scheme == 'https'))
        			port = null;
        	}
        	var _port = port ? port + '' : null;

        	if (typeof path != 'string' || !path)
        		throwError('missing or invalid path: ' + path);
        	var _path = path;

        	if (typeof query == 'object')
        		query = encodeURIComponents(query);
        	if (query && typeof query != 'string')
        		throwError('invalid query: ' + query);
        	var _query = query || '';

        	if (typeof fragment == 'object')
        		fragment = encodeURIComponents(fragment);
        	if (fragment && typeof fragment != 'string')
        		throwError("invalid fragment: " + fragment);
        	var _fragment = fragment || '';

        	this.scheme = function() { return _scheme; };
        	this.host = function() { return _host; };
        	this.port = function() { return _port; };
        	this.path = function() { return _path; };
        	this.query = function() { return _query; }
        	this.fragment = function() { return _fragment; }
            this.toString = function() {
                var uri = _scheme + '://' + _host + (_port ? ':' + _port : '');
                uri += _path;
                uri += (_query ? '?' + _query : '');
                uri += _fragment ? '#' + _fragment : '';
                return uri;
            }
        }
    }])

    .factory('atlasLogin', ['atlasLoginWindow', function atlasLogin(atlasLoginWindow) {
        var clientAppId = null,
            language = null,
            languageHint = null;

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
            if (clientAppId == null)
                throwError('client id is not set.');
            return clientAppId;
        }
        function setClientId(appId) {
            // Sets the client identifier that will be used to request authorization.
            // You must call this function before calling authorize.
            if (typeof appId != "string")
                throwError('client id should be string');
            clientAppId = appId;
        }

        function authorize(userOptions, next) {
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

            if (arguments.length != 2)
                throwError('authorize expects two arguments (options, next)');
            if (clientAppId == null)
                throwError('client id is not set');
            if (userOptions && typeof userOptions != "object")
                throwError('authorize expects options parameter to be an object');
            if (next != null && (typeof next != 'function' && typeof next != 'string'))
                throwError('authorize expects next parameter to be a function or a string');

            var options = angular.extend({
                interactive: 'auto',
                popup: true,
                response_type: 'token',
                response_mode: void 0,
                direct_post_uri: void 0,
                state: void 0,
                scope: void 0,
                scope_data: void 0
            }, userOptions);

            if (options.response_type == null)
                throwError('missing options.response_type');
            if (typeof options.response_type != 'string')
                throwError('expected options.response_type to be a string');
            if (!options.scope)
                throwError('missing options.scope');
            if (options.scope.constructor !== Array && typeof options.scope != 'string')
                throwError('expected options.scope to be a string or array');

            if (typeof options.scope == 'string')
                options.scope = options.scope.split(/\s+/);

            if (options.response_mode == null)
                throwError('missing options.response_mode');
            if (typeof options.response_mode != 'string')
                throwError('expected options.response_mode to be a string');
            if (options.direct_post_uri == null)
                throwError('missing options.direct_post_uri');
            if (typeof options.direct_post_uri != 'string')
                throwError('expected options.direct_post_uri to be a string');

            if (options.scope_data)
                options.scope_data=ja(options.scope_data);

            if (options.interactive == null) {
                options.interactive = 'auto';
            }
            else {
                if (options.interactive != 'auto' && options.interactive != 'always' && options.interactive != 'never') {
                    throwError('expected options.interactive to be one of auto, always, or never');
                }
            }

            var request = new authRequest(options);
            request.setStatus('in_progress');

            if (next != null)
                request.handler.onComplete(next);

            if (options.popup) {
                //Ha(request);
                atlasLoginWindow.popup(request);
            }
            else {
                if (typeof next != 'string')
                    throwError('next must be redirect URI if options.popup is not true');
                options.clientAppId = clientAppId;
                options.language = language;
                options.languageHint = languageHint;
                atlasLoginWindow.go(options, next);
            }
            return request.handler;
        }

        function authRequest(options) {
            var self = this;

            this.options /*b*/ = options;
            this.next /*n*/ = null;
            this.handlers /*e*/ = [];
            this.c = null;
            this.handler/*a*/ = {
                status: null,
                onComplete: function(next) {
                    if (typeof next != 'function' && typeof next != 'string')
                        throwError('onComplete expects handler parameter to be a function or a string');
                    var isCompleted = (self.handler.status == "complete");
                    if (typeof next == 'string') {
                        if (isCompleted) {
                            Ia(self.c, next);
                        }
                        else {
                            self.next = next;
                        }
                    }
                    else {
                        if (isCompleted) {
                            setTimeout(function() {
                                next(self.handler);
                            }, 0);
                        }
                        else {
                            self.handlers.push(next);
                        }
                    }
                    return self.handler;
                }
            };
            this.u = function(a) {
                self.c = a;
                aa(self.handler, a);
                self.setStatus('complete');
                for (var i = 0; i < self.handler.length; i++) {
                    self.handlers[i](self.handler);
                }
                if (self.next != null) {
                    Ia(self.c, self.next);
                }
            };
            this.setStatus = function(status) {
                self.handler.status = status;
            };

        }

        function logout() {
            // Logs out the current user after a call to authorize.
            $cookies.put('atlasLoginStateCache', 'null', 0);
            $cookies.put('atlasLoginAccessToken', 'null', 0);
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
