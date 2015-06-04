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

    .factory('atlasServiceFactory', ['atlasServiceTypes', 'atlasConfig', 'atlasRequest', function (atlasServiceTypes, atlasConfig, atlasRequest) {
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
                            atlas[identifier] = atlasServiceFactory.create(item.type, atlasServiceTypes[type], item.options);
                            break;
                        }
                    }
                    if (!atlas[identifier])
                        throw new Error('atlas.$get: invalid service type ' + item.type);
                }
            }
            else {
                for (var type in atlasServiceTypes) {
                    atlas[type] = atlasServiceFactory.create(type, atlasServiceTypes[type], {});
                };
            }
            return atlas;
        }];
    }])
