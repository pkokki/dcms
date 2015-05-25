describe('atlas.sdk', function() {

    it("contains spec with an expectation", function() {
        expect(true).toBe(true);
    });

    describe('atlasCredentials provider', function() {
        var provider;

        beforeEach(module('atlas.sdk', function(atlasCredentialsFactoryProvider) {
            provider = atlasCredentialsFactoryProvider;
        }));

        it('should have expiryWindow static property', inject(function() {
            expect(provider.expiryWindow).toBeTruthy();
        }));

        it('expiryWindow property should be breater than 0', inject(function() {
            expect(provider.expiryWindow).toBeGreaterThan(0);
        }));
    });

    describe('atlasCredentialsFactory ::', function() {
        beforeEach(module('atlas.sdk'));

        describe('create ::', function() {
            it('should expose a create method', inject(function(atlasCredentialsFactory) {
                expect(atlasCredentialsFactory.create).toBeDefined();
            }));

            it('should allow setting of credentials with keys', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create('theKey', 'theSecret', 'theSession');
                validateCredentials(creds);
            }));

            it('should allow setting of credentials as object', inject(function(atlasCredentialsFactory) {
                var obj = {
                    accessKeyId: 'theKey',
                    secretAccessKey: 'theSecret',
                    sessionToken: 'theSession'
                };
                var creds = atlasCredentialsFactory.create(obj);
                validateCredentials(creds);
            }));

            it('defaults credentials to undefined when not passed', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create();
                expect(creds.accessKeyId).toBeUndefined();
                expect(creds.secretAccessKey).toBeUndefined();
                expect(creds.sessionToken).toBeUndefined();
            }));
        });

        describe('needsRefresh ::', function() {
            it('needs refresh if credentials are not set', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create();
                expect(creds.needsRefresh()).toEqual(true);
                creds = atlasCredentialsFactory.create('theKey');
                expect(creds.needsRefresh()).toEqual(true);
            }));
            it('does not need refresh if credentials are set', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create('theKey', 'theSecret');
                expect(creds.needsRefresh()).toEqual(false);
            }));
            it('needs refresh if creds are expired', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create('theKey', 'theSecret');
                creds.expired = true;
                expect(creds.needsRefresh()).toEqual(true);
            }));
            it('can be expired based on expireTime', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create('theKey', 'theSecret');
                creds.expired = false;
                creds.expireTime = new Date(0);
                expect(creds.needsRefresh()).toEqual(true);
            }));
            it('needs refresh if expireTime is within expiryWindow secs from now', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create('theKey', 'theSecret');
                creds.expired = false;
                creds.expireTime = new Date((new Date()).getTime() + 1000);
                expect(creds.needsRefresh()).toEqual(true);
            }));
            it('does not need refresh if expireTime outside expiryWindow', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create('theKey', 'theSecret');
                creds.expired = false;
                creds.expireTime = new Date((new Date()).getTime() + (creds.expiryWindow + 5) * 1000);
                expect(creds.needsRefresh()).toEqual(false);
            }));
        });

        describe('get ::', function() {
            it('does not call refresh if not needsRefresh', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create('theKey', 'theSecret');
                spyOn(creds, 'refresh').and.callThrough();
                var callback = jasmine.createSpy('callback');
                creds.get(callback);

                expect(creds.refresh.calls.any()).toEqual(false);
                expect(callback).toHaveBeenCalled();
                expect(callback.arguments).toBeNull();
                expect(creds.expired).toEqual(false);
            }));
            it('calls refresh only if needsRefresh', inject(function(atlasCredentialsFactory) {
                var creds = atlasCredentialsFactory.create('theKey', 'theSecret');
                spyOn(creds, 'refresh').and.callThrough();
                creds.expired = true;
                var callback = jasmine.createSpy('callback');
                creds.get(callback);

                expect(creds.refresh.calls.any()).toEqual(true);
                expect(callback).toHaveBeenCalled();
                expect(callback.arguments).toBeNull();
                expect(creds.expired).toEqual(false);
            }));
        });



        function validateCredentials(creds, key, secret, session) {
            expect(creds.accessKeyId).toEqual(key || 'theKey');
            expect(creds.secretAccessKey).toEqual(secret || 'theSecret');
            expect(creds.sessionToken).toEqual(session || 'theSession');
        }
    });

    describe('atlas provider', function() {
        var provider;

        beforeEach(module('atlas.sdk', function(atlasProvider) {
            provider = atlasProvider;
        }));

        it('should have $get method', inject(function() {
            expect(provider.$get).toBeTruthy();
        }));

        it('should have globalConfig property', inject(function() {
            expect(provider.globalConfig).toBeTruthy();
        }));
    });
});
