angular.module('atlas.sdk', [
	])

    .config([function () {

    }])

    .service('atlasGlobalConfig', [function() {
		var keys = {
			credentials: null,
			credentialProvider: null,
			region: undefined,
			logger: null,
			apiVersions: {},
			apiVersion: null,
			endpoint: undefined,
			httpOptions: {
			  timeout: 120000
			},
			maxRetries: undefined,
			maxRedirects: 10,
			paramValidation: true,
			/* whether SSL is enabled for requests */
			sslEnabled: true,
			computeChecksums: true,
			/** [Number] an offset value in milliseconds to apply to all signing
             *  times. Use this to compensate for clock skew when your system may be
             *  out of sync with the service time. Note that this configuration option
             *  can only be applied to the global `atlasGlobalConfig` object and cannot be
             *  overridden in service-specific configuration. Defaults to 0 milliseconds.
             */
			systemClockOffset: 0,
			signatureVersion: null,
			//convertResponseTypes: true,
			//dynamoDbCrc32: true,
			//s3ForcePathStyle: false,
			//s3BucketEndpoint: false,
		};
        return keys;
    }])

    .service('atlasUtil', ['atlasGlobalConfig', function(atlasGlobalConfig) {
        /* Date and time utility functions. */
        var dateUtil = {
            /**
             * @return [Date] the current JavaScript date object.
             */
            getDate: function() {
                if (atlasGlobalConfig.systemClockOffset) {
                    return new Date(new Date().getTime() + atlasGlobalConfig.systemClockOffset);
                }
                else {
                    return new Date();
                }
            },
            /**
             * @return [String] the date in ISO-8601 format
             */
            iso8601: function iso8601(date) {
                if (date === undefined) {
                    date = dateUtil.getDate();
                }
                return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
            },
            /**
             * @return [String] the date in ISO-8601 format
             */
            rfc822: function rfc822(date) {
                 if (date === undefined) {
                     date = dateUtil.getDate();
                 }
                 return date.toUTCString();
             },
        };
        var util = {
            date: dateUtil,
            inherit: inherit,
            isEmpty: function isEmpty(obj) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        return false;
                    }
                }
                return true;
            },
            /* Abort constant */
            abort: {},
            each: function each(object, iterFunction) {
                for (var key in object) {
                    if (object.hasOwnProperty(key)) {
                        var ret = iterFunction.call(this, key, object[key]);
                        if (ret === util.abort) break;
                    }
                }
            },
			error: function error(err, options) {
				var originalError = null;
				if (typeof err.message === 'string' && err.message !== '') {
					if (typeof options === 'string' || (options && options.message)) {
						originalError = angular.extend({}, err);
						originalError.message = err.message;
					}
				}
				err.message = err.message || null;
				if (typeof options === 'string') {
					err.message = options;
				} else {
					angular.extend(err, options);
				}

				if (typeof Object.defineProperty === 'function') {
					Object.defineProperty(err, 'name', {writable: true, enumerable: false});
					Object.defineProperty(err, 'message', {enumerable: true});
				}

				err.name = err.name || err.code || 'Error';
				err.time = new Date();

				if (originalError) err.originalError = originalError;

				return err;
			},
        }
        return util;


        function inherit(klass, features) {
            var newObject = null;
            if (features === undefined) {
                features = klass;
                klass = Object;
                newObject = {};
            }
            else {
                var ctor = function ConstructorWrapper() {};
                ctor.prototype = klass.prototype;
                newObject = new ctor();
            }
            // constructor not supplied, create pass-through ctor
            if (features.constructor === Object) {
                features.constructor = function() {
                    if (klass !== Object) {
                        return klass.apply(this, arguments);
                    }
                };
            }
            features.constructor.prototype = newObject;
            angular.extend(features.constructor.prototype, features);
            features.constructor.__super__ = klass;
            return features.constructor;
        }
    }])

    .provider('atlasCredentialsFactory', [function () {
        /* (Integer) */
        var expiryWindow = this.expiryWindow = 15;

        this.$get = ['atlasUtil', 'atlasSecurityTokenService', function (atlasUtil, atlasSecurityTokenService) {
            return new atlasCredentialsFactory();

            function atlasCredentialsFactory () {
                return {
                    create: create,
                    createWebIdentityCredentials: createWebIdentityCredentials,
                }

                function create() {
                    var credentials = {
                        /* (Integer) the window size in seconds to attempt refreshing of
                         * credentials before the expireTime occurs
                         */
                        expiryWindow: expiryWindow,
                        /* (void) Gets the existing credentials, refreshing them if they
                         * are not yet loaded or have expired. Users should call
                         * this method before using refresh(), as this will not
                         * attempt to reload credentials when they are already
                         * loaded into the object.
                         */
                        get : get,
                        /*
                         * (Boolean) Returns whether the credentials object should call refresh()
                         */
                        needsRefresh: needsRefresh,
                        /*
                         * (void) Refreshes the credentials. Users should call get() before
                         * attempting to forcibly refresh credentials.
                         */
                        refresh: refresh,
                    };
                    /* (Boolean) Returns whether the credentials have been expired and require a refresh. */
                    credentials.expired = false;
                    /* (Date) Returns a time when credentials should be considered expired. */
                    credentials.expireTime = null;

                    if (arguments.length === 1 && typeof arguments[0] === 'object') {
                        var arg = arguments[0];
                        /* (String) — the atlas access key ID */
                        credentials.accessKeyId = arg.accessKeyId;
                        /* (String) — the atlas secret access key */
                        credentials.secretAccessKey = arg.secretAccessKey;
                        /* (String) — the optional atlas session token */
                        credentials.sessionToken = arg.sessionToken;
                    }
                    else {
                        credentials.accessKeyId = arguments[0];
                        credentials.secretAccessKey = arguments[1];
                        credentials.sessionToken = arguments[2];
                    }
                    return credentials;


                    function get(callback) {
                        if (this.needsRefresh()) {
                            this.refresh(function(err) {
                                if (!err) {
                                    this.expired = false; // reset expired flag
                                }
                                if (callback) callback(err);
                            });
                        }
                        else if (callback) {
                            callback();
                        }
                    }

                    function needsRefresh() {
                        var currentTime = atlasUtil.date.getDate().getTime();
                        var adjustedTime = new Date(currentTime + this.expiryWindow * 1000);
                        if (this.expireTime && adjustedTime > this.expireTime) {
                            return true;
                        }
                        else {
                            return this.expired || !this.accessKeyId || !this.secretAccessKey;
                        }
                    }

                    function refresh(callback) {
                        this.expired = false;
                        callback();
                    }
                }

                /**
                  * Creates a new credentials object.
                  * @param (see atlasSecurityTokenService.assumeRoleWithWebIdentity)
                  * @example Creating a new credentials object
                  *   atlasGlobalConfig.credentials = atlasCredentialsFactory.createWebIdentityCredentials({
                  *     RoleArn: 'arn:atlas:iam::<ATLAS_ACCOUNT_ID>:role/<WEB_IDENTITY_ROLE_NAME>',
                  *     WebIdentityToken: 'ACCESS_TOKEN',       // token from identity service
                  *     RoleSessionName: 'web'                  // optional name, defaults to web-identity
                  *   });
                  * @see atlasSecurityTokenService.assumeRoleWithWebIdentity
                  */
                function createWebIdentityCredentials(params) {
                    if (typeof params === 'object') {
                        var credentials = create(params);
                        credentials.expired = true;
                        credentials.params = params;
                        credentials.params.RoleSessionName = credentials.params.RoleSessionName || 'web-identity';
                        credentials.data = null;
                        credentials.refresh = refresh;
                        credentials.createClients = createClients;
                        return credentials;
                    }
                    throw 'Trying to create WebIdentityCredentials without params';

                    /** Refreshes credentials using atlasSecurityTokenService.assumeRoleWithWebIdentity
                     * @callback callback function(err)
                     *      Called when the STS service responds (or fails). When
                     *      this callback is called with no error, it means that the credentials
                     *      information has been loaded into the object (as the `accessKeyId`,
                     *      `secretAccessKey`, and `sessionToken` properties).
                     *      @param err [Error] if an error occurred, this value will be filled
                     */
                    function refresh(callback) {
                        var self = this;
                        self.createClients();
                        if (!callback)
                            callback = function(err) { if (err) throw err; };
                        self.service.assumeRoleWithWebIdentity(function (err, data) {
                            if (!err) {
                                self.expired = false;
                                self.data = data;
                                self.service.credentialsFrom(data, self);
                            }
                            else {
                                self.data = null;
                            }
                            callback(err);
                        });
                    }


                    function createClients() {
                        this.service = this.service || atlasSecurityTokenService({params: this.params});
                    }
                }
            }
        }];
    }])

    .factory('atlasRegionConfig', ['atlasUtil', function(atlasUtil) {
        var regionConfig = { /* from region_config.json */
            rules: {},
            patterns: {}
        };
        return configureEndpoint;

        function configureEndpoint(service) {
            service.isGlobalEndpoint = false;
            applyConfig(service, {
                endpoint: '',

            });
			return;
            /***************/
            var keys = derivedKeys(service);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (!key) continue;
                if (regionConfig.rules.hasOwnProperty(key)) {
                    var config = regionConfig.rules[key];
                    if (typeof config === 'string') {
                        config = regionConfig.patterns[config];
                    }
                    // set global endpoint
                    service.isGlobalEndpoint = !!config.globalEndpoint;
                    // signature version
                    if (!config.signatureVersion) config.signatureVersion = 'v4';
                    // merge config
                    applyConfig(service, config);
                }
            }
        }

        function derivedKeys(service) {
            var region = service.config.region;
            var regionPrefix = generateRegionPrefix(region);
            var endpointPrefix = service.api.endpointPrefix;

            return [
                [region, endpointPrefix],
                [regionPrefix, endpointPrefix],
                [region, '*'],
                [regionPrefix, '*'],
                ['*', endpointPrefix],
                ['*', '*']
            ].map(function(item) {
                return item[0] && item[1] ? item.join('/') : null;
            });
        }

        function generateRegionPrefix(region) {
            if (!region) return null;

            var parts = region.split('-');
            if (parts.length < 3) return null;
            return parts.slice(0, parts.length - 2).join('-') + '-*';
        }

        function applyConfig(service, config) {
            atlasUtil.each(config, function(key, value) {
                if (key === 'globalEndpoint') return;
                if (service.config[key] === undefined || service.config[key] === null) {
                    service.config[key] = value;
                }
            });
        }
    }])

	.factory('atlasServiceFactory', ['atlasUtil', 'atlasGlobalConfig', 'atlasRegionConfig', function(atlasUtil, atlasGlobalConfig, atlasRegionConfig) {
        var _serviceMap = {};
        /* The service class representing an atlas service. */
		var emptyService = {
			api: {},
            defaultRetryCount: 3,
            validateService: function validateService() {
            },
            getLatestServiceClass: function getLatestServiceClass(version) {
                throw 'getLatestServiceClass: Not implemented!';
            },
            getLatestServiceVersion: function getLatestServiceVersion(version) {
                throw 'getLatestServiceVersion: Not implemented!';
            },
            makeRequest: function makeRequest(operation, params, callback) {
                throw 'makeRequest: Not implemented!';
            },
            /**
             * Calls an operation on a service with the given input parameters, without
             * any authentication data. This method is useful for "public" API operations.
             *      @param operation [String] the name of the operation to call on the service.
             *      @param params [map] a map of input options for the operation
             *      @callback callback function(err, data)
             *          If a callback is supplied, it is called when a response is returned
             *          from the service.
             *          @param err [Error] the error object returned from the request.
             *              Set to `null` if the request is successful.
             *          @param data [Object] the de-serialized data returned from
             *              the request. Set to `null` if a request error occurs.
             */
            makeUnauthenticatedRequest: function (operation, params, callback) {
                if (typeof params === 'function') {
                    callback = params;
                    params = {};
                }
                var request = this.makeRequest(operation, params).toUnauthenticated();
                return callback ? request.send(callback) : request;
            },
            waitFor: function waitFor(state, params, callback) {
                throw 'waitFor: Not implemented!';
            },
            addAllRequestListeners: function addAllRequestListeners(request) {
                throw 'addAllRequestListeners: Not implemented!';
            },
            setupRequestListeners: function setupRequestListeners() {
                // Override this method to setup any custom request listeners for each
                // new request to the service.
            },
            getSignerClass: function getSignerClass() {
                throw 'getSignerClass: Not implemented!';
            },
            serviceInterface: function serviceInterface() {
                throw 'serviceInterface: Not implemented!';
            },
            successfulResponse: function successfulResponse(resp) {
                throw 'successfulResponse: Not implemented!';
            },
            numRetries: function numRetries() {
                throw 'numRetries: Not implemented!';
            },
            retryDelays: function retryDelays() {
                throw 'retryDelays: Not implemented!';
            },
            retryableError: function retryableError(error) {
                throw 'retryableError: Not implemented!';
            },
            networkingError: function networkingError(error) {
                throw 'networkingError: Not implemented!';
            },
            expiredCredentialsError: function expiredCredentialsError(error) {
                throw 'expiredCredentialsError: Not implemented!';
            },
            throttledError: function throttledError(error) {
                throw 'throttledError: Not implemented!';
            },
            endpointFromTemplate: function endpointFromTemplate(endpoint) {
                throw 'endpointFromTemplate: Not implemented!';
            },
            setEndpoint: function setEndpoint(endpoint) {
                throw 'setEndpoint: Not implemented!';
            },
            paginationConfig: function paginationConfig(operation, throwException) {
                throw 'paginationConfig: Not implemented!';
            },
        };

        return {
            create: create,
            defineService: defineService,
            hasService: hasService,
        };

        function hasService(identifier) {
            return _serviceMap.hasOwnProperty(identifier);
        }

        function create(features) {
            var instance = angular.extend(emptyService, features || {});
            var serviceClass = loadServiceClass(instance, config || {});
            if (serviceClass)
                return new ServiceClass(config);
			initialize(instance, config);
			return instance;
        }

		function loadServiceClass(instance, serviceConfig) {
			var config = serviceConfig;
			if (!atlasUtil.isEmpty(instance.api)) {
				return null;
			}
			else if (config.apiConfig) {
				return AWS.Service.defineServiceApi(instance.constructor, config.apiConfig);
			}
			else if (!instance.constructor.services) {
				return null;
			}
			else {
				config = new AWS.Config(AWS.config);
				config.update(serviceConfig, true);
				var version = config.apiVersions[instance.constructor.serviceIdentifier];
				version = version || config.apiVersion;
				return this.getLatestServiceClass(version);
			}
		}

		function initialize(instance, config) {
			var svcConfig = atlasGlobalConfig[instance.serviceIdentifier];
			instance.config = angular.extend({}, atlasGlobalConfig, svcConfig, config);
			instance.validateService();
			if (!instance.config.endpoint)
				atlasRegionConfig(instance);

			//instance.config.endpoint = instance.endpointFromTemplate(instance.config.endpoint);
			//instance.setEndpoint(instance.config.endpoint);
		}

        /**
          * Defines a new Service class using a service identifier and list of versions
          * including an optional set of features (functions) to apply to the class
          * prototype.
          *
          * @param serviceIdentifier [String] the identifier for the service
          * @param versions [Array<String>] a list of versions that work with this service
          * @param features [Object] an object to attach to the prototype
          * @return [Class<Service>] the service class defined by this function.
          */
        function defineService(serviceIdentifier, versions, features) {
            _serviceMap[serviceIdentifier] = true;
            if (!angular.isArray(versions)) {
                features = versions;
                versions = [];
            }
            var svc = atlasUtil.inherit(emptyService, features || {});

            if (typeof serviceIdentifier === 'string') {
                addVersions(svc, versions);
                var identifier = svc.serviceIdentifier || serviceIdentifier;
                svc.serviceIdentifier = identifier;
            }
            else { // defineService called with an API
                svc.prototype.api = serviceIdentifier;
                defineMethods(svc);
            }
            return svc;
        }

        function addVersions(svc, versions) {
            if (!angular.isArray(versions))
                versions = [versions];
            svc.services = svc.services || {};
            for (var i = 0; i < versions.length; i++) {
                if (svc.services[versions[i]] === undefined) {
                    svc.services[versions[i]] = null;
                }
            }
            svc.apiVersions = Object.keys(svc.services).sort();
        }

        function defineServiceApi(superclass, version, apiConfig) {
            throw 'defineServiceApi: Not implemented!';
        }

        function defineMethods(svc) {
            atlasUtil.each(svc.prototype.api.operations, function iterator(method) {
                if (svc.prototype[method]) return;
                svc.prototype[method] = function (params, callback) {
                    return this.makeRequest(method, params, callback);
                };
            });
        }


    }])

    .factory('atlasSecurityTokenService', ['atlasServiceFactory', function(atlasServiceFactory) {
        var factory = function create(params) {
            var instance = atlasServiceFactory.create(params);
            instance.assumeRoleWithWebIdentity = function (params, callback) {
                this.makeUnauthenticatedRequest('assumeRoleWithWebIdentity', params, callback);
            };
            /**
             * Creates a credentials object from STS response data containing
             * credentials information. Useful for quickly setting atlas credentials.
             *
             * @note This is a low-level utility function. If you want to load temporary
             *     credentials into your process for subsequent requests to atlas resources,
             *     you should use {atlasCredentialsFactory.createTemporaryCredentials} instead.
             *  @param data [map] data retrieved from a call to {getFederatedToken},
             *     {getSessionToken}, {assumeRole}, or {assumeRoleWithWebIdentity}.
             *  @param credentials [atlasCredentials] an optional credentials object to
             *     fill instead of creating a new object. Useful when modifying an
             *     existing credentials object from a refresh call.
             *  @return [atlasTemporaryCredentials] the set of temporary credentials
             *     loaded from a raw STS operation response.
             */
            instance.credentialsFrom = function credentialsFrom(data, credentials) {
                if (!data) return null;
                if (!credentials) {
                    //credentials = new atlas.TemporaryCredentials();
                    throw 'credentialsFrom: Not implemented!';
                }
                credentials.accessKeyId = data.Credentials.AccessKeyId;
                credentials.secretAccessKey = data.Credentials.SecretAccessKey;
                credentials.sessionToken = data.Credentials.SessionToken;
                credentials.expireTime = data.Credentials.Expiration;
            };
            return instance;
        };
        return factory;
    }])

	.factory('atlasSequentialExecutor', [function() {
		var _events = {};
		return {
			on: on,
			addListener: on,
			/** Adds or copies a set of listeners from another list of
			 * listeners or SequentialExecutor object.
			 *
			 * @param listeners [map<String, Array<Function>>]
			 * @return [atlasSequentialExecutor] the emitter object, for chaining.
			 * @example Adding listeners from a map of listeners
			 *   emitter.addListeners({
			 *     event1: [function() { ... }, function() { ... }],
			 *     event2: [function() { ... }]
			 *   });
			 *   emitter.emit('event1'); // emitter has event1
			 */
			addListeners: addListeners,
			/**
			 * Registers an event with {on} and saves the callback handle function
			 * as a property on the emitter object using a given `name`.
			 * @param name [String] the property name to set on this object containing
			 *   the callback function handle so that the listener can be removed in
			 *   the future.
			 * @example Adding a named listener DATA_CALLBACK
			 *   var listener = function() { doSomething(); };
			 *   emitter.addNamedListener('DATA_CALLBACK', 'data', listener);
			 *
			 *   // the following prints: true
			 *   console.log(emitter.DATA_CALLBACK == listener);
			 */
			addNamedListener: addNamedListener,
			/**
			 * Helper method to add a set of named listeners using
			 * {addNamedListener}. The callback contains a parameter
			 * with a handle to the `addNamedListener` method.
			 *
			 * @callback callback function(add)
			 *   The callback function is called immediately in order to provide
			 *   the `add` function to the block. This simplifies the addition of
			 *   a large group of named listeners.
			 *   @param add [Function] the {addNamedListener} function to call
			 *     when registering listeners.
			 * @example Adding a set of named listeners
			 *   emitter.addNamedListeners(function(add) {
			 *     add('DATA_CALLBACK', 'data', function() { ... });
			 *     add('OTHER', 'otherEvent', function() { ... });
			 *     add('LAST', 'lastEvent', function() { ... });
			 *   });
			 *
			 *   // these properties are now set:
			 *   emitter.DATA_CALLBACK;
			 *   emitter.OTHER;
			 *   emitter.LAST;
			 */
			addNamedListeners: addNamedListeners,
			removeListener: removeListener,
			removeAllListeners: removeAllListeners
		}

		function on(eventName, listener) {
			if (_events[eventName]) {
				_events[eventName].push(listener);
			}
			else {
				_events[eventName] = [listener];
			}
			return this;
		}

		function onAsync(eventName, listener) {
			listener._isAsync = true;
			return on(eventName, listener);
		}

		function listeners(eventName) {
    		return _events[eventName] ? _events[eventName].slice(0) : [];
		}

		function addNamedListener(name, eventName, callback) {
			this[name] = callback;
			addListener(eventName, callback);
			return this;
		}

		function addNamedAsyncListener(name, eventName, callback) {
			callback._isAsync = true;
			return addNamedListener(name, eventName, callback);
		}

		function addNamedListeners(callback) {
			var self = this;
			callback(
				function() {
					self.addNamedListener.apply(self, arguments);
				},
				function() {
					self.addNamedAsyncListener.apply(self, arguments);
				}
			);
			return this;
		}

		function addListeners(listeners) {
			var self = this;
			// extract listeners if parameter is an SequentialExecutor object
			if (listeners._events) listeners = listeners._events;

			atlasUtil.each(listeners, function(event, callbacks) {
				atlasUtil.arrayEach(callbacks, function(callback) {
					self.on(event, callback);
				});
			});
			return self;
		}

		function removeListener(eventName, listener) {
			var listeners = _events[eventName];
			if (listeners) {
				var length = listeners.length;
				var position = -1;
				for (var i = 0; i < length; ++i) {
					if (listeners[i] === listener) {
						position = i;
					}
				}
				if (position > -1) {
					listeners.splice(position, 1);
				}
			}
			return this;
		}
		function removeAllListeners(eventName) {
			if (eventName) {
				delete _events[eventName];
			}
			else {
				_events = {};
			}
			return this;
		}
		function emit(eventName, eventArgs, doneCallback) {
			if (!doneCallback) doneCallback = function() { };
			var listeners = listeners(eventName);
			var count = listeners.length;
			callListeners(listeners, eventArgs, doneCallback);
			return count > 0;
		}
		function callListeners(listeners, args, doneCallback) {
			var self = this;
			function callNextListener(err) {
				if (err) {
					doneCallback.call(self, err);
				}
				else {
					self.callListeners(listeners, args, doneCallback);
				}
			}

			while (listeners.length > 0) {
				var listener = listeners.shift();
				if (listener._isAsync) { // asynchronous listener
					listener.apply(self, args.concat([callNextListener]));
					return; // stop here, callNextListener will continue
				}
				else { // synchronous listener
					listener.apply(self, args);
				}
			}
			doneCallback.call(self);
		}
	}])

	.factory('atlasConfigFactory', ['atlasUtil', 'atlasGlobalConfig', 'atlasServiceFactory', 'atlasCredentialsFactory', function (atlasUtil, atlasGlobalConfig, atlasServiceFactory, atlasCredentialsFactory) {

		var factory = {
			create: create,
		};
		return factory;


		function create(options) {
			if (options === undefined) options = {};
			options = extractCredentials(options);

			var config = {
				set : function set(property, value, defaultValue) {
					if (value === undefined) {
						if (defaultValue === undefined) {
							defaultValue = atlasGlobalConfig[property];
						}
						if (typeof defaultValue === 'function') {
							this[property] = defaultValue.call(this);
						}
						else {
							this[property] = defaultValue;
						}
					}
					else if (property === 'httpOptions' && this[property]) {
						// deep merge httpOptions
						this[property] = angular.extend(this[property], value);
					}
					else {
						this[property] = value;
					}
				},
				update: function(options, allowUnknownKeys) {
					allowUnknownKeys = allowUnknownKeys || false;
					options = extractCredentials(options);
					for (var key in options) {
						if (allowUnknownKeys || atlasGlobalConfig.hasOwnProperty(key) || hasService(key)) {
							this.set(key, options[key]);
						}
					};
				},
				clear: function clear() {
					for (var key in atlasGlobalConfig) {
						delete this[key];
					};

					// reset credential provider
					this.set('credentials', undefined);
					this.set('credentialProvider', undefined);
				},
				getCredentials: function getCredentials(callback) {
					var self = this;
					if (self.credentials) {
						if (typeof self.credentials.get === 'function') {
							getAsyncCredentials();
						}
						else { // static credentials
							getStaticCredentials();
						}
					}
					else if (self.credentialProvider) {
						self.credentialProvider.resolve(function(err, creds) {
							if (err) {
								err = credError('Could not load credentials from any providers', err);
							}
							self.credentials = creds;
							finish(err);
						});
					}
					else {
						finish(credError('No credentials to load'));
					}

					function finish(err) {
				      callback(err, err ? null : self.credentials);
				    }
					function credError(msg, err) {
						return atlasUtil.error(err || new Error(), {
							code: 'CredentialsError', message: msg
						});
				    }
					function getAsyncCredentials() {
						self.credentials.get(function(err) {
							if (err) {
								var msg = 'Could not load credentials from ' +
									self.credentials.constructor.name;
          						err = credError(msg, err);
        					}
        					finish(err);
      					});
    				}
					function getStaticCredentials() {
						var err = null;
						if (!self.credentials.accessKeyId || !self.credentials.secretAccessKey) {
							err = credError('Missing credentials');
						}
						finish(err);
					}
				},
			};
			for (var key in atlasGlobalConfig) {
				config.set(key, options[key], config[key]);
			}
			return config;
		}

		function hasService(serviceIdentifier) {
			return atlasServiceFactory.hasService(serviceIdentifier);
		}

		/* Extracts accessKeyId, secretAccessKey and sessionToken from a configuration hash. */
		function extractCredentials(options) {
    		if (options.accessKeyId && options.secretAccessKey) {
				options = angular.extend({}, options);
				options.credentials = atlasCredentialsFactory.create(options);
			}
    		return options;
		}
	}])

	.factory('atlasApiLoader', ['atlasUtil', function (atlasUtil) {
		var __dirname = '__dirname';
		var files = {
			'__dirname/../apis/metadata.json': {
				//'cloudwatchlogs': {
				//	'prefix': 'logs',
				//	'name': 'CloudWatchLogs',
				//	'versions': [],
				//},
				'identity': {
					'name': 'Identity Service',
					'versions': [ '5.0' ],
				},
				'appsettings': {
					'name': 'Application Settings Service',
					'versions': [ '5.0' ],
				},
				'orgmodel': {
					'name': 'Organizational Model Service',
					'versions': [ '5.0' ],
				},
				'case': {
					'name': 'Case Service',
					'versions': [ '5.0' ],
				},
				'task': {
					'name': 'Human Task Service',
					'versions': [ '5.0' ],
				},
				'cmis': {
					'name': 'Content Management Service',
					'versions': [ '5.0' ],
				},
				'template': {
					'name': 'Template Service',
					'versions': [ '5.0' ],
				},
				'rule': {
					'name': 'Business Rule Service',
					'versions': [ '5.0' ],
				},
				'data': {
					'name': 'Business Data Service',
					'versions': [ '5.0' ],
				},
			},
			'__dirname/../apis/sts-2011-06-16.min.json': {
				version: '5.0',
				metadata: {
					apiVersion: '2011-06-16',
					endpointPrefix: 'sts',
					globalEndpoint: 'sts.amazonaws.com',
					serviceAbbreviation: 'AWS STS',
					serviceFullName: 'AWS Security Token Service',
					signatureVersion: 'v4',
					xmlNamespace: 'https://sts.amazonaws.com/doc/2011-06-15/',
					protocol: 'query'
				},
				operations: {
					"GetSessionToken": {
						input: {},
						output: {},
					},
				},
				shapes: {
				}
			}
		};
		var fs = {
			readdirSync: function(apiRoot) {
				return files.keys;
			},
			existsSync: function(path) {
				return files[path] ? true : false;
			}
		};
		function require(path) {
			var json = files[path];
			if (json)
				return json;
			throw path + ' not found!'
		}
		var path = {
			join: function() {
				var s = arguments[0];
				for (var i = 1; i < arguments.length; i++)
					s += '/' + arguments[i];
				return s;
			}
		};

		var apiRoot = path.join(__dirname, '..', 'apis');
		var serviceMap = null;
		var serviceIdentifiers = [];
		var serviceNames = [];

		var service = {
			serviceVersions: serviceVersions,
			serviceName: serviceName,
			serviceIdentifier: serviceIdentifier,
			serviceFile: serviceFile,
			load: load,
		};
		Object.defineProperty(service, 'services', {
			enumerable: true, get: getServices
		});
		Object.defineProperty(service, 'serviceNames', {
			enumerable: true, get: getServiceNames
		});
		return service;

		function buildServiceMap() {
			if (serviceMap !== null) return;

			// load info file for API metadata:
			serviceMap =  require(path.join(apiRoot, 'metadata.json'));

			var prefixMap = {};
			Object.keys(serviceMap).forEach(function(identifier) {
				serviceMap[identifier].prefix = serviceMap[identifier].prefix || identifier;
				prefixMap[serviceMap[identifier].prefix] = identifier;
			});

			/*
			fs.readdirSync(apiRoot).forEach(function (file) {
				var match = file.match(/^(.+?)-(\d+-\d+-\d+)\.(normal|min)\.json$/);
				if (match) {
					var id = prefixMap[match[1]], version = match[2];
					if (serviceMap[id]) {
						serviceMap[id].versions = serviceMap[id].versions || [];
						if (serviceMap[id].versions.indexOf(version) < 0) {
							serviceMap[id].versions.push(version);
						}
					}
				}
			});
			*/

			Object.keys(serviceMap).forEach(function(identifier) {
				serviceMap[identifier].versions = serviceMap[identifier].versions.sort();
				serviceIdentifiers.push(identifier);
				serviceNames.push(serviceMap[identifier].name);
			});
		}
		function getServices() {
			buildServiceMap();
			return serviceIdentifiers;
		}
		function getServiceNames() {
			buildServiceMap();
			return serviceNames;
		}
		function serviceVersions(svc) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			return serviceMap[svc] ? serviceMap[svc].versions : null;
		}
		function serviceName(svc) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			return serviceMap[svc] ? serviceMap[svc].name : null;
		}
		function serviceFile(svc, version) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			if (!serviceMap[svc]) return null;

			var prefix = serviceMap[svc].prefix || svc;
			var filePath;
			//['min', 'api', 'normal'].some(function(testSuffix) {
				var testSuffix = 'min';
				filePath = apiRoot + '/' + prefix.toLowerCase() + '-' + version + '.' + testSuffix + '.json';
			//	return fs.existsSync(filePath);
			//});
			return filePath;
		}

		function paginatorsFile(svc, version) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			if (!serviceMap[svc]) return null;

			var prefix = serviceMap[svc].prefix || svc;
			return apiRoot + '/' + prefix + '-' + version + '.paginators.json';
		}
		function waitersFile(svc, version) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			if (!serviceMap[svc]) return null;

			var prefix = serviceMap[svc].prefix || svc;
			return apiRoot + '/' + prefix + '-' + version + '.waiters.json';
		}

		function load(svc, version) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			if (version === 'latest') version = null;
			version = version || serviceMap[svc].versions[serviceMap[svc].versions.length - 1];
			if (!serviceMap[svc]) return null;

			var api = require(serviceFile(svc, version));

			// Try to load paginators
			if (fs.existsSync(paginatorsFile(svc, version))) {
				var paginators = require(paginatorsFile(svc, version));
				api.paginators = paginators.pagination;
			}

			// Try to load waiters
			if (fs.existsSync(waitersFile(svc, version))) {
				var waiters = require(waitersFile(svc, version));
				api.waiters = waiters.waiters;
			}

			return api;
		}
		function serviceIdentifier(svc) {
			return svc.toLowerCase();
		}
	}])

	.provider('atlasCore', [function() {
		this.$get = [
			'atlasUtil',
			'atlasConfigFactory',
			'atlasServiceFactory',
			'atlasCredentialsFactory',
			'atlasSequentialExecutor',
			function (
				atlasUtil,
				atlasConfigFactory,
				atlasServiceFactory,
				atlasCredentialsFactory,
				atlasSequentialExecutor) {
			var core = {
				/**
				* CONSTANT
				*/
				VERSION: '0.1',
				/**
				* A set of utility methods for use with the atlas SDK.
				*/
				util: atlasUtil,
				/* @api private */
				apiLoader: function() { throw new Error('atlas.$get: No API loader set'); },
				/* @api private */
				//Signers: {},
				/* @api private */
				//Protocol: {
				//	Json: require('./protocol/json'),
				//	Query: require('./protocol/query'),
				//	Rest: require('./protocol/rest'),
				//	RestJson: require('./protocol/rest_json'),
				//	RestXml: require('./protocol/rest_xml')
				//},
				/* @api private */
				//XML: {
				//	Builder: require('./xml/builder'),
				//	Parser: null // conditionally set based on environment
				//},
				/* @api private */
				//JSON: {
				//	Builder: require('./json/builder'),
				//	Parser: require('./json/parser')
				//},
				/* @api private */
				//Model: {
				//	Api: require('./model/api'),
				//	Operation: require('./model/operation'),
				//	Shape: require('./model/shape'),
				//	Paginator: require('./model/paginator'),
				//	ResourceWaiter: require('./model/resource_waiter')
				//},
			};

			// DONE: require('./service');
			core.service = atlasServiceFactory;

			// DONE: require('./credentials');
			core.credentials = atlasCredentialsFactory;

			//require('./credentials/credential_provider_chain');
			//require('./credentials/temporary_credentials');
			//require('./credentials/web_identity_credentials');
			//require('./credentials/cognito_identity_credentials');
			//require('./credentials/saml_credentials');

			/**
			* The main configuration class used by all service objects to set
			* the region, credentials, and other options for requests.
			*/
			// DONE: require('./config');
			core.config = atlasConfigFactory.create();

			//require('./http');

			/**
			* @readonly
			* @return [atlasSequentialExecutor] a collection of global event listeners that
			*   are attached to every sent request.
			* @see atlasRequest for a list of events to listen for
			* @example Logging the time taken to send a request
			*   atlas.events.on('send', function startSend(resp) {
			*     resp.startTime = new Date().getTime();
			*   }).on('complete', function calculateTime(resp) {
			*     var time = (new Date().getTime() - resp.startTime) / 1000;
			*     console.log('Request took ' + time + ' seconds');
			*   });
			*
			*   atlas.<serviceName>.<operationName>(); // prints 'Request took 0.285 seconds'
			*/
			// DONE: require('./sequential_executor');
			core.events = atlasSequentialExecutor;

			//require('./event_listeners');
			//require('./request');
			//require('./response');
			//require('./resource_waiter');
			//require('./signers/request_signer');
			//require('./param_validator');
			return core;
		}];
	}])

	.provider('atlas', [function () {
        this.$get = [
			'atlasCore',
			'atlasApiLoader',
			function atlasFactory(
				atlasCore,
				atlasApiLoader) {

			/********************* core **********************/
			var atlas = angular.extend({}, atlasCore)

			/********************* atlas **********************/
			// Use default API loader function
			// DONE: require('./api_loader').load;
			atlas.apiLoader = atlasApiLoader.load;

			// Load the xml2js XML parser
			// AWS.XML.Parser = require('./xml/node_parser');

			// Load Node HTTP client
			// require('./http/node');

			// Load all service classes
			// DONE: require('./services');
			atlasApiLoader.services.forEach(function(identifier) {
				var name = atlasApiLoader.serviceName(identifier);
				var versions = atlasApiLoader.serviceVersions(identifier);
				this[name] = atlas.service.defineService(identifier, versions);
				// load any customizations from lib/services/<svcidentifier>.js
				//var svcFile = path.join(__dirname, 'services', identifier + '.js');
				//if (fs.existsSync(svcFile)) require('./services/' + identifier);
			});

			// Load custom credential providers
			// require('./credentials/ec2_metadata_credentials');
			// require('./credentials/environment_credentials');
			// require('./credentials/file_system_credentials');
			// require('./credentials/shared_ini_file_credentials');

			// Setup default chain providers
			// AWS.CredentialProviderChain.defaultProviders = [
			//   function () { return new AWS.EnvironmentCredentials('AWS'); },
			//   function () { return new AWS.EnvironmentCredentials('AMAZON'); },
			//   function () { return new AWS.SharedIniFileCredentials(); },
			//   function () { return new AWS.EC2MetadataCredentials(); }
			// ];

			// Update configuration keys
			// AWS.util.update(AWS.Config.prototype.keys, {
			// 	credentials: function () {
			// 		var credentials = null;
			// 		new AWS.CredentialProviderChain([
			// 			function () { return new AWS.EnvironmentCredentials('AWS'); },
			// 			function () { return new AWS.EnvironmentCredentials('AMAZON'); },
			// 			function () { return new AWS.SharedIniFileCredentials(); }
			// 		]).resolve(function(err, creds) {
			// 			if (!err) credentials = creds;
			// 		});
			// 		return credentials;
			// 	},
			// 	credentialProvider: function() {
			// 		return new AWS.CredentialProviderChain();
			// 	},
			// 	region: function() {
			// 		return process.env.AWS_REGION || process.env.AMAZON_REGION;
			// 	}
			// });

			// Reset configuration
			// AWS.config = new AWS.Config();

            return atlas;
        }];
    }])
    ;
