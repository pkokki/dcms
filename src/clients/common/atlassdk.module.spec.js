describe('sdk', function() {
    it('contains spec with an expectation', function() {
        expect(true).toBeTruthy();
    });

    describe('atlasConfig', function() {
        beforeEach(module('atlassdk', function() {
        }));

        it('should create config with default options', inject(function(atlasConfig) {
            var config = atlasConfig.create();

            expect(config.region).toEqual('azure');
            expect(config.credentials).toBeNull();
            expect(config.sslEnabled).toEqual(true);
            expect(config.maxRetries).toEqual(3);
            expect(config.logger).toBeNull();
        }));
        it('should create config with overriden options', inject(function(atlasConfig) {
            var config = atlasConfig.create({ region:'xxxx', maxRetries: 10 });

            expect(config.region).toEqual('xxxx');
            expect(config.credentials).toBeNull();
            expect(config.sslEnabled).toEqual(true);
            expect(config.maxRetries).toEqual(10);
            expect(config.logger).toBeNull();
        }));
    });

    describe('atlasServiceFactory', function() {
        var mockServiceTypes;
        beforeEach(module('atlassdk', function($provide) {
            mockServiceTypes = {'svc1': { operations: { op1: {}, op2: {} } }, 'svc2': {}};
            $provide.constant('atlasServiceTypes', mockServiceTypes);
        }));

        it('should contain a factory method for each service type', inject(function(atlasServiceFactory) {
            expect(atlasServiceFactory.svc1).toBeDefined();
            expect(atlasServiceFactory.svc2).toBeDefined();
        }));
        it('should create service instance without options', inject(function(atlasServiceFactory) {
            var service = atlasServiceFactory.svc1();

            expect(service).toBeDefined();
            expect(service.config.region).toEqual('azure');
            expect(service.config.credentials).toBeNull();
            expect(service.config.sslEnabled).toEqual(true);
            expect(service.config.maxRetries).toEqual(3);
            expect(service.config.logger).toBeNull();
        }));
        it('should create service instance with options', inject(function(atlasServiceFactory) {
            var service = atlasServiceFactory.svc1({ region: 'ia2' });

            expect(service).toBeDefined();
            expect(service.config.region).toEqual('ia2');
            expect(service.config.credentials).toBeNull();
            expect(service.config.sslEnabled).toEqual(true);
            expect(service.config.maxRetries).toEqual(3);
            expect(service.config.logger).toBeNull();
        }));

        it('should attach operations to a service instance', inject(function(atlasServiceFactory) {
            var service = atlasServiceFactory.svc1();

            expect(service.op1).toBeDefined();
            expect(service.op2).toBeDefined();
        }));
    });

    describe('atlasService (any)', function() {
        var mockServiceTypes;
        beforeEach(module('atlassdk', function($provide) {
            mockServiceTypes = {'svc1': { operations: { op1: {}, op2: {} } }, 'svc2': {}};
            $provide.constant('atlasServiceTypes', mockServiceTypes);
        }));

        it('should perform asynchronous callbacks and callback on success', inject(function(atlasServiceFactory, atlasRequest, $q, $rootScope) {
            var observer = { success: function(data) {}};
            spyOn(observer, 'success');
            spyOn(atlasRequest, 'create').and.callFake(function() { return $q(function(resolve, reject) { resolve(); }); });

            var service = atlasServiceFactory.svc1();
            service.op1(null, observer.success);
            $rootScope.$apply();

            expect(observer.success).toHaveBeenCalled();
        }));
        it('should perform asynchronous callbacks and return data on success', inject(function(atlasServiceFactory, atlasRequest, $q, $rootScope) {
            var observer = { success: function(data) {}};
            spyOn(observer, 'success');
            spyOn(atlasRequest, 'create').and.callFake(function() { return $q(function(resolve, reject) { resolve('xyz'); }); });

            var service = atlasServiceFactory.svc1();
            service.op1(null, observer.success);
            $rootScope.$apply();

            expect(observer.success.calls.argsFor(0)).toEqual(['xyz']);
        }));
        it('should perform asynchronous callbacks and callback on error', inject(function(atlasServiceFactory, atlasRequest, $q, $rootScope) {
            var observer = { error: function(data) {}};
            spyOn(observer, 'error');
            spyOn(atlasRequest, 'create').and.callFake(function() { return $q(function(resolve, reject) { reject(); }); });

            var service = atlasServiceFactory.svc1();
            service.op1(null, null, observer.error);
            $rootScope.$apply();

            expect(observer.error).toHaveBeenCalled();
        }));
        it('should return a promise if callbacks are not specified', inject(function(atlasServiceFactory) {
            var service = atlasServiceFactory.svc1();
            var promise = service.op1(null);

            expect(promise.then).toBeDefined();
            expect(promise.catch).toBeDefined();
            expect(promise.finally).toBeDefined();
        }));
    });


    describe('atlasProvider', function() {
        var provider;
        beforeEach(module('atlassdk', function(atlasProvider) {
            provider = atlasProvider;
        }));

        it('should have attachService method', inject(function() {
            expect(provider.attachService).toBeDefined();
        }));

        it('should fail to keep service metadata with unknown type', inject(function($injector) {
            provider.attachService('instanceName', 'unknownType');
            var foo = function() {
                $injector.get('atlas');
            };
            expect(foo).toThrow();
        }));

        it('should keep service metadata of known type', inject(function(atlas) {
            provider.attachService('instanceName', 'appsettings');

            expect(atlas.instanceName).not.toBeNull();
        }));

        it('should have only user-attached services, if user attached at least one', inject(function($injector) {
            provider.attachService('instanceName', 'appsettings');

            var atlas = $injector.get('atlas');
            expect(atlas.instanceName).not.toBeNull();
            expect(atlas.appsettings).toBeUndefined();
            expect(atlas.identity).toBeUndefined();
        }));

        it('should have one instance per service, if user does not attach any', inject(function($injector) {
            var atlas = $injector.get('atlas');
            expect(atlas.appsettings).toBeDefined();
            expect(atlas.identity).toBeDefined();
        }));

    });

    describe('atlas', function() {
        var atlas = null;
        beforeEach(module('atlassdk'));
        beforeEach(inject(function($injector) {
            atlas = $injector.get('atlas');
        }));

        describe('config', function() {
            function assertDefaultValues(obj) {
                expect(obj.region).toEqual('azure');
                expect(obj.credentials).toBeNull();
                expect(obj.sslEnabled).toEqual(true);
                expect(obj.maxRetries).toEqual(3);
                expect(obj.logger).toBeNull();
            }

            it('should have initial default values', function() {
                assertDefaultValues(atlas.config);
            });

            it('should have initial service-specific default values', function() {
                assertDefaultValues(atlas.appsettings.config);
                assertDefaultValues(atlas.identity.config);
            });
        });

        describe('examples', function() {
            function preamble() {
                atlas.config.credentials = atlasWebIdentityCredentials.create({
                    RoleArn: 'arn:aws:iam::<AWS_ACCOUNT_ID>:role/<WEB_IDENTITY_ROLE_NAME>',
                    ProviderId: 'graph.facebook.com|www.amazon.com',
                    WebIdentityToken: ACCESS_TOKEN
                });
                atlas.config.region = 'azure';

                var service = atlas.appsettings();
                service.get(function(data) {

                });
            }
        });
    });
});
