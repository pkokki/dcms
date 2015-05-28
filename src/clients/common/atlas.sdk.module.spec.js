describe('atlas.sdk', function() {

    it("contains spec with an expectation", function() {
        expect(true).toBe(true);
    });

    describe('atlasConfigFactory', function() {
        // configure = (options) -> atlasConfigFactory.create(options)
        var configFactory = null;
        beforeEach(module('atlas.sdk'));
        beforeEach(inject(function($injector) {
            configFactory = $injector.get('atlasConfigFactory');
        }));

        describe('create', function() {
            it('should be able to pass in a Config object as parameter', function() {
                var config1 = configFactory.create({ sslEnabled: false, maxRetries: 0 });
                var config2 = configFactory.create(config1);
                expect(config2).not.toEqual(config1);
                expect(config2.sslEnabled).toEqual(false);
                expect(config2.maxRetries).toEqual(0);
            });
            it('should be able to pass credential values directly', function() {
                var config = configFactory.create({ accessKeyId: 'AKID', secretAccessKey: 'SECRET', sessionToken: 'SESSION' });
                expect(config.credentials.accessKeyId).toEqual('AKID');
                expect(config.credentials.secretAccessKey).toEqual('SECRET');
                expect(config.credentials.sessionToken).toEqual('SESSION');
            });
        });
        describe('region', function() {
            it('defaults to undefined', function() {
                expect(configFactory.create().region).toBeUndefined();
            });
        });
        describe('maxRetries', function() {
            it('defaults to undefined', function() {
                expect(configFactory.create().maxRetries).toBeUndefined();
            });
            it('can be set to an integer', function() {
                expect(configFactory.create({maxRetries: 2}).maxRetries).toEqual(2);
            });
        });
        describe('paramValidation', function() {
            it('defaults to true', function() {
                expect(configFactory.create().paramValidation).toEqual(true);
            });
        });
        describe('computeChecksums', function() {
            it('defaults to true', function() {
                expect(configFactory.create().computeChecksums).toEqual(true);
            });
        });
        describe('sslEnabled', function() {
            it('defaults to true', function() {
                expect(configFactory.create().sslEnabled).toEqual(true);
            });
            it('can be set to false', function() {
                expect(configFactory.create({ sslEnabled: false }).sslEnabled).toEqual(false);
            });
        });
        describe('httpOptions', function() {
            it('defaults to {timeout:120000}', function() {
                expect(configFactory.create().httpOptions).toEqual({timeout: 120000});
            });
        });
        describe('systemClockOffset', function() {
            it('defaults to 0', function() {
                expect(configFactory.create().systemClockOffset).toEqual(0);
            });
        });
        describe('set', function() {
            it('should set a default value for a key', function() {
                var config = configFactory.create();
                config.set('maxRetries', undefined, 'DEFAULT');
                expect(config.maxRetries).toEqual('DEFAULT');
            });
            it('should execute default value if it is a function', function() {
                var mock = jasmine.createSpy('mock');
                var config = configFactory.create();
                config.set('maxRetries', undefined, mock);
                expect(mock.calls.count()).toEqual(1);
            });
            it('should not expand default value function if value is present', function() {
                var mock = jasmine.createSpy('mock');
                var config = configFactory.create();
                config.set('maxRetries', 'VALUE', mock);
                expect(mock.calls.count()).toEqual(0);
            });
            it('should get result from default value if it is a function', function() {
                var funct = function() { return 'VALUE'; };
                var config = configFactory.create();
                config.set('maxRetries', undefined, funct);
                expect(config.maxRetries).toEqual('VALUE');
            });
            it('should be able to access other values from default value function', function() {
                var funct = function() { return this.maxRetries + 1; };
                var config = configFactory.create({ maxRetries: 2 });
                config.set('temp', undefined, funct);
                expect(config.temp).toEqual(3);
            });
        });
        describe('clear', function() {
            it('should be able to clear all key values from a config object', function() {
                var config = configFactory.create({ credentials: {}, maxRetries: 300, sslEnabled: 'foo' });
                expect(config.maxRetries).toEqual(300);
                expect(config.sslEnabled).toEqual('foo');
                expect(config.credentials).toBeDefined();

                config.clear();
                expect(config.maxRetries).toBeUndefined();
                expect(config.sslEnabled).toBeUndefined();
                expect(config.credentials).toBeDefined();
                expect(config.credentialProvider).toBeDefined();
            });
        });
        describe('update', function() {
            it('should be able to update keyed values', function() {
                var config = configFactory.create();
                expect(config.maxRetries).toBeUndefined();
                config.update({maxRetries: 10});
                expect(config.maxRetries).toEqual(10);
            });
            it('should ignore non-keyed values', function() {
                var config = configFactory.create();
                config.update({foo: 10});
                expect(config.foo).toBeUndefined();
            });
            it('allows unknown keys if allowUnknownKeys is set', function() {
                var config = configFactory.create();
                config.update({foo: 10}, true);
                expect(config.foo).toEqual(10);
            });
            it('should allow service identifiers to be set', inject(function(atlas) {
                var config = atlas.config;
                config.update({identity: {endpoint: 'localhost'}});
                expect(config.identity).toEqual({endpoint: 'localhost'});
            }));
            it('should be able to update literal credentials', function() {
                var config = configFactory.create();
                config.update({
                    accessKeyId: 'AKID',
                    secretAccessKey: 'SECRET',
                    sessionToken: 'SESSION'
                });
                expect(config.credentials.accessKeyId).toEqual('AKID');
                expect(config.credentials.secretAccessKey).toEqual('SECRET');
                expect(config.credentials.sessionToken).toEqual('SESSION');
            });
            it('should deep merge httpOptions', function() {
                var config = configFactory.create();
                config.update({httpOptions: { timeout: 1 }});
                config.update({httpOptions: { xhrSync: true }});
                expect(config.httpOptions.timeout).toEqual(1);
                expect(config.httpOptions.xhrSync).toEqual(true);
            });
        });
        describe('getCredentials', function() {
            function expectValid(options, key) {
                var config = (options.set && options.clear) ? options : configFactory.create(options);
                var spy = jasmine.createSpy('getCredentials callback');
                config.getCredentials(spy);
                expect(spy.calls.count()).toEqual(1);
                expect(spy.calls.first().args[0]).not.toBeTruthy();
                if (key)
                    expect(config.credentials.accessKeyId).toEqual(key);
            }
            function expectError(options, message) {
                var config = (options.set && options.clear) ? options : configFactory.create(options);
                var spy = jasmine.createSpy('getCredentials callback');
                config.getCredentials(spy);
                expect(spy.calls.count()).toEqual(1);
                expect(spy.calls.first().args[0].code).toEqual('CredentialsError');
                expect(spy.calls.first().args[0].message).toEqual(message);
            }

            it('should check credentials for static object first', function() {
                expectValid({
                  credentials: {
                    accessKeyId: '123',
                    secretAccessKey: '456'
                  }
                });
            });
            it('should error if static credentials are not available', function() {
                expectError({
                  credentials: {}
                }, 'Missing credentials');
            });
            it('should check credentials for async get() method', function() {
                expectValid({
                  credentials: {
                    get: function(cb) {
                      return cb();
                    }
                  }
                });
            });
            it('should error if credentials.get() cannot resolve', function() {
                var options;
                options = {
                  credentials: {
                    constructor: {
                      name: 'CustomCredentials'
                    },
                    get: function(cb) {
                      return cb(new Error('Error!'), null);
                    }
                  }
                };
                expectError(options, 'Could not load credentials from CustomCredentials');
            });
            it('should check credentialProvider if no credentials', function() {
                expectValid({
                  credentials: null,
                  credentialProvider: {
                    resolve: function(cb) {
                      return cb(null, {
                        accessKeyId: 'key',
                        secretAccessKey: 'secret'
                      });
                    }
                  }
                });
            });
            it('should error if credentialProvider fails to resolve', function() {
                var options = {
                  credentials: null,
                  credentialProvider: {
                    resolve: function(cb) {
                      return cb(new Error('Error!'), null);
                    }
                  }
                };
                expectError(options, 'Could not load credentials from any providers');
            });
            it('should error if no credentials or credentialProvider', function() {
                var options = {
                  credentials: null,
                  credentialProvider: null
                };
                expectError(options, 'No credentials to load');
            });
        });

    });

    describe('atlasCredentialsFactoryProvider', function() {
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

    describe('atlasCredentialsFactory :: WebIdentityCredentials ::', function() {
        beforeEach(module('atlas.sdk'));

        var creds = null;
        var setupCreds = function(atlasCredentialsFactory) {
            creds = atlasCredentialsFactory.createWebIdentityCredentials({ WebIdentityToken: 'token', RoleArn: 'arn' })
        }
        var setupClients  = function(atlasCredentialsFactory) {
            setupCreds(atlasCredentialsFactory);
            creds.createClients();
        }
        var mockSTS = function(expireTime) {
            spyOn(creds.service, 'assumeRoleWithWebIdentity').and.callFake(function (cb) {
                expect(creds.service.params).toEqual({
                  RoleArn: 'arn',
                  WebIdentityToken: 'token',
                  RoleSessionName: 'web-identity'
                });
                return cb(null, {
                  Credentials: {
                    AccessKeyId: 'KEY',
                    SecretAccessKey: 'SECRET',
                    SessionToken: 'TOKEN',
                    Expiration: expireTime
                  },
                  OtherProperty: true
                });
            });
        }
        describe('constructor', function() {
            it('lazily constructs service clients', inject(function(atlasCredentialsFactory) {
                setupCreds(atlasCredentialsFactory);
                expect(creds.service).toBeUndefined();
            }));
        });
        describe('createClients', function() {
            beforeEach(inject(function(atlasCredentialsFactory) {
                setupCreds(atlasCredentialsFactory);
            }));
            it('constructs service clients if not present', inject(function(atlasCredentialsFactory) {
                expect(creds.service).toBeUndefined();
                creds.createClients();
                expect(creds.service).toBeDefined();
            }));
            it('does not construct service clients if present', inject(function(atlasCredentialsFactory) {
                creds.createClients();
                service = creds.service;
                creds.createClients();
                expect(service).toEqual(creds.service);
            }));
        });
        describe('refresh', function() {
            beforeEach(inject(function(atlasCredentialsFactory) {
                setupClients(atlasCredentialsFactory);
            }));
            it('loads federated credentials from STS', inject(function(atlasCredentialsFactory, atlasUtil) {
                mockSTS(new Date(atlasUtil.date.getDate().getTime() + 100000));
                creds.refresh(function(err) {
                    expect(creds.accessKeyId).toEqual('KEY');
                    expect(creds.secretAccessKey).toEqual('SECRET');
                    expect(creds.sessionToken).toEqual('TOKEN');
                    expect(creds.needsRefresh()).toEqual(false);
                    expect(creds.data.OtherProperty).toEqual(true);
                });
            }));
            it('does try to load creds second time if service request failed', inject(function(atlasCredentialsFactory) {
                var spy = spyOn(creds.service, 'assumeRoleWithWebIdentity').and.callFake(function (cb) {
                    cb(new Error('INVALID SERVICE'));
                });
                creds.refresh(function(err) {
                    expect(err.message).toEqual('INVALID SERVICE');
                });
                creds.refresh(function(err) {
                    creds.refresh(function(err) {
                        creds.refresh(function(err) {
                            expect(spy.calls.count()).toEqual(4);
                        })
                    })
                });
            }));
        });
    });

    describe('atlasServiceFactory ::', function() {

        var config = null;
        var service = null;
        var retryableError = function(error, result) {
            expect(service.retryableError(error)).toEqual(result);
        }
        beforeEach(function() {
            module('atlas.sdk');
            inject(function(atlasGlobalConfig, atlasServiceFactory) {
                config = atlasGlobalConfig;
                //service = atlasServiceFactory.create(config);
            });
        });

        describe('apiVersions ::', function() {
            it('should set apiVersions property', inject(function(atlasServiceFactory) {
                var customService = atlasServiceFactory.defineService('custom', ['2001-01-01', '1999-05-05'])
                expect(customService.apiVersions).toEqual(['1999-05-05', '2001-01-01'])
            }));
        });

        describe('constructor ::', function() {
            it('should use atlas.config copy if no config is provided', inject(function(atlasServiceFactory) {
                var service = atlasServiceFactory.create();
                expect(service.config).not.toEqual(config);
                expect(service.config.sslEnabled).toEqual(true)
            }));
        });

    });

    describe('atlas -->', function() {
        beforeEach(module('atlas.sdk'));
        describe('config', function() {
            it('should be a default Config object', inject(function(atlas) {
                expect(atlas.config.sslEnabled).toEqual(true);
                expect(atlas.config.maxRetries).toBeUndefined();
            }));
            it('can set default config to an object literal', inject(function(atlas) {
                var oldConfig = atlas.config;
                atlas.config = {};
                expect(atlas.config).toEqual({});
                atlas.config = oldConfig;
            }));
        });
    });
});
