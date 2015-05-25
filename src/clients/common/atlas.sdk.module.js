angular.module('atlas.sdk', [
	])
    .config([function () {
    }])
    .service('atlasConfig', [function() {
        return {
            /** [Number] an offset value in milliseconds to apply to all signing
             *  times. Use this to compensate for clock skew when your system may be
             *  out of sync with the service time. Note that this configuration option
             *  can only be applied to the global `atlasConfig` object and cannot be
             *  overridden in service-specific configuration. Defaults to 0 milliseconds.
             */
            systemClockOffset: 0
        };
    }])
    .service('atlasUtil', ['atlasConfig', function(atlasConfig) {
        /* Date and time utility functions. */
        var dateUtil = {
            /**
             * @return [Date] the current JavaScript date object.
             */
            getDate: function() {
                if (atlasConfig.systemClockOffset) {
                    return new Date(new Date().getTime() + atlasConfig.systemClockOffset);
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
        return {
            date: dateUtil,
        }
    }])
    .provider('atlasCredentialsFactory', [function () {
        /* (Integer) */
        var expiryWindow = this.expiryWindow = 15;

        this.$get = ['atlasUtil', function (atlasUtil) {
            return new atlasCredentialsFactory();

            function atlasCredentialsFactory () {
                return {
                    create: create
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
                        var arg = arguments[0].credentials || arguments[0];
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
            }
        }];
    }])
    .provider('atlas', [function () {
        var globalConfig = this.globalConfig = {
            /* the credentials object that contains authentication keys (required) */
            credentials: {


            },
            /* whether SSL is enabled or not (optional, default = false) */
            sslEnabled: false,
        };

        this.$get = ['$rootScope', '$q', function atlasFactory($rootScope, $q) {

            return new Atlas();
            /*--------------------------------------------------------------*/
            function Atlas(requestConfig) {
                if (!angular.isObject(requestConfig)) {
                    throw minErr('atlas')('badreq', 'atlas request configuration must be an object.  Received: {0}', requestConfig);
                }
            }
        }];
    }])
    ;
